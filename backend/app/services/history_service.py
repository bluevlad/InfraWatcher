import math
from datetime import datetime, timedelta, timezone

from app.core.database import get_db


INTERVAL_SECONDS = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
}


def _default_time_range(start: str | None, end: str | None) -> tuple[str, str]:
    now = datetime.now(timezone.utc)
    if end is None:
        end = now.isoformat()
    if start is None:
        start = (now - timedelta(hours=1)).isoformat()
    return start, end


def _pick_interval(start: str, end: str, interval: str | None) -> str:
    if interval and interval in INTERVAL_SECONDS:
        return interval
    try:
        s = datetime.fromisoformat(start)
        e = datetime.fromisoformat(end)
        diff_h = (e - s).total_seconds() / 3600
    except ValueError:
        return "1m"
    if diff_h <= 1:
        return "1m"
    if diff_h <= 6:
        return "5m"
    if diff_h <= 24:
        return "15m"
    return "1h"


def _strftime_bucket(interval: str) -> str:
    if interval == "1m":
        return "%Y-%m-%dT%H:%M"
    if interval == "5m":
        return "%Y-%m-%dT%H:%M"
    if interval == "15m":
        return "%Y-%m-%dT%H:%M"
    return "%Y-%m-%dT%H"


def _should_use_hourly(start: str, end: str) -> bool:
    try:
        s = datetime.fromisoformat(start)
        e = datetime.fromisoformat(end)
        return (e - s).total_seconds() > 86400  # > 24h
    except ValueError:
        return False


async def get_container_metrics_history(
    name: str,
    start: str | None = None,
    end: str | None = None,
    interval: str | None = None,
) -> dict:
    start, end = _default_time_range(start, end)
    interval = _pick_interval(start, end, interval)

    if _should_use_hourly(start, end):
        return await _get_container_metrics_from_hourly(name, start, end, interval)

    bucket_fmt = _strftime_bucket(interval)
    interval_sec = INTERVAL_SECONDS.get(interval, 60)

    db = await get_db()

    if interval in ("5m", "15m"):
        query = """
            SELECT
                strftime(?, timestamp) as bucket,
                AVG(cpu_percent) as cpu_percent,
                AVG(memory_percent) as memory_percent,
                AVG(memory_usage) as memory_usage,
                AVG(network_rx) as network_rx,
                AVG(network_tx) as network_tx
            FROM container_metrics
            WHERE container_name = ? AND timestamp >= ? AND timestamp <= ?
            GROUP BY (CAST(strftime('%s', timestamp) AS INTEGER) / ?)
            ORDER BY bucket ASC
        """
        cursor = await db.execute(query, (bucket_fmt, name, start, end, interval_sec))
    else:
        query = """
            SELECT
                strftime(?, timestamp) as bucket,
                AVG(cpu_percent) as cpu_percent,
                AVG(memory_percent) as memory_percent,
                AVG(memory_usage) as memory_usage,
                AVG(network_rx) as network_rx,
                AVG(network_tx) as network_tx
            FROM container_metrics
            WHERE container_name = ? AND timestamp >= ? AND timestamp <= ?
            GROUP BY bucket
            ORDER BY bucket ASC
        """
        cursor = await db.execute(query, (bucket_fmt, name, start, end))

    rows = await cursor.fetchall()

    data = [
        {
            "timestamp": row["bucket"],
            "cpu_percent": round(row["cpu_percent"] or 0, 2),
            "memory_percent": round(row["memory_percent"] or 0, 2),
            "memory_usage": int(row["memory_usage"] or 0),
            "network_rx": int(row["network_rx"] or 0),
            "network_tx": int(row["network_tx"] or 0),
        }
        for row in rows
    ]

    return {
        "container_name": name,
        "start": start,
        "end": end,
        "interval": interval,
        "data": data,
    }


async def _get_container_metrics_from_hourly(
    name: str, start: str, end: str, interval: str
) -> dict:
    db = await get_db()
    query = """
        SELECT
            hour_timestamp as bucket,
            avg_cpu_percent as cpu_percent,
            avg_memory_percent as memory_percent,
            avg_memory_usage as memory_usage,
            avg_network_rx as network_rx,
            avg_network_tx as network_tx
        FROM container_metrics_hourly
        WHERE container_name = ? AND hour_timestamp >= ? AND hour_timestamp <= ?
        ORDER BY hour_timestamp ASC
    """
    cursor = await db.execute(query, (name, start, end))
    rows = await cursor.fetchall()

    data = [
        {
            "timestamp": row["bucket"],
            "cpu_percent": round(row["cpu_percent"] or 0, 2),
            "memory_percent": round(row["memory_percent"] or 0, 2),
            "memory_usage": int(row["memory_usage"] or 0),
            "network_rx": int(row["network_rx"] or 0),
            "network_tx": int(row["network_tx"] or 0),
        }
        for row in rows
    ]

    return {
        "container_name": name,
        "start": start,
        "end": end,
        "interval": "1h",
        "data": data,
    }


async def get_container_healthcheck_history(
    name: str,
    start: str | None = None,
    end: str | None = None,
    page: int = 1,
    size: int = 20,
    status_filter: str | None = None,
) -> dict:
    start, end = _default_time_range(start, end)
    db = await get_db()

    conditions = ["container_name = ?", "timestamp >= ?", "timestamp <= ?"]
    params: list = [name, start, end]

    if status_filter:
        conditions.append("status = ?")
        params.append(status_filter)

    where = " AND ".join(conditions)

    count_cursor = await db.execute(
        f"SELECT COUNT(*) as cnt FROM health_checks WHERE {where}", params
    )
    count_row = await count_cursor.fetchone()
    total = count_row["cnt"]
    pages = max(1, math.ceil(total / size))

    offset = (page - 1) * size
    query = f"""
        SELECT id, timestamp, container_name, health_type, port, path,
               status, response_time_ms, status_code, error
        FROM health_checks
        WHERE {where}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    """
    cursor = await db.execute(query, params + [size, offset])
    rows = await cursor.fetchall()

    items = [
        {
            "id": row["id"],
            "timestamp": row["timestamp"],
            "container_name": row["container_name"],
            "health_type": row["health_type"],
            "port": row["port"],
            "path": row["path"],
            "status": row["status"],
            "response_time_ms": row["response_time_ms"],
            "status_code": row["status_code"],
            "error": row["error"],
        }
        for row in rows
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }


async def get_group_metrics_history(
    group: str,
    start: str | None = None,
    end: str | None = None,
    interval: str | None = None,
) -> dict:
    from app.data.container_registry import CONTAINERS

    group_containers = [c.name for c in CONTAINERS if c.group == group]
    if not group_containers:
        return {"group": group, "start": "", "end": "", "interval": "", "data": []}

    start, end = _default_time_range(start, end)
    interval = _pick_interval(start, end, interval)

    if _should_use_hourly(start, end):
        return await _get_group_metrics_from_hourly(group, group_containers, start, end)

    bucket_fmt = _strftime_bucket(interval)
    interval_sec = INTERVAL_SECONDS.get(interval, 60)
    placeholders = ",".join("?" for _ in group_containers)

    db = await get_db()

    if interval in ("5m", "15m"):
        query = f"""
            SELECT
                strftime(?, timestamp) as bucket,
                SUM(cpu_percent) as cpu_percent,
                AVG(memory_percent) as memory_percent,
                SUM(memory_usage) as memory_usage,
                SUM(network_rx) as network_rx,
                SUM(network_tx) as network_tx
            FROM container_metrics
            WHERE container_name IN ({placeholders}) AND timestamp >= ? AND timestamp <= ?
            GROUP BY (CAST(strftime('%s', timestamp) AS INTEGER) / ?)
            ORDER BY bucket ASC
        """
        params = [bucket_fmt] + group_containers + [start, end, interval_sec]
    else:
        query = f"""
            SELECT
                strftime(?, timestamp) as bucket,
                SUM(cpu_percent) as cpu_percent,
                AVG(memory_percent) as memory_percent,
                SUM(memory_usage) as memory_usage,
                SUM(network_rx) as network_rx,
                SUM(network_tx) as network_tx
            FROM container_metrics
            WHERE container_name IN ({placeholders}) AND timestamp >= ? AND timestamp <= ?
            GROUP BY bucket
            ORDER BY bucket ASC
        """
        params = [bucket_fmt] + group_containers + [start, end]

    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()

    data = [
        {
            "timestamp": row["bucket"],
            "cpu_percent": round(row["cpu_percent"] or 0, 2),
            "memory_percent": round(row["memory_percent"] or 0, 2),
            "memory_usage": int(row["memory_usage"] or 0),
            "network_rx": int(row["network_rx"] or 0),
            "network_tx": int(row["network_tx"] or 0),
        }
        for row in rows
    ]

    return {"group": group, "start": start, "end": end, "interval": interval, "data": data}


async def _get_group_metrics_from_hourly(
    group: str, group_containers: list[str], start: str, end: str
) -> dict:
    db = await get_db()
    placeholders = ",".join("?" for _ in group_containers)
    query = f"""
        SELECT
            hour_timestamp as bucket,
            SUM(avg_cpu_percent) as cpu_percent,
            AVG(avg_memory_percent) as memory_percent,
            SUM(avg_memory_usage) as memory_usage,
            SUM(avg_network_rx) as network_rx,
            SUM(avg_network_tx) as network_tx
        FROM container_metrics_hourly
        WHERE container_name IN ({placeholders}) AND hour_timestamp >= ? AND hour_timestamp <= ?
        GROUP BY hour_timestamp
        ORDER BY hour_timestamp ASC
    """
    cursor = await db.execute(query, group_containers + [start, end])
    rows = await cursor.fetchall()

    data = [
        {
            "timestamp": row["bucket"],
            "cpu_percent": round(row["cpu_percent"] or 0, 2),
            "memory_percent": round(row["memory_percent"] or 0, 2),
            "memory_usage": int(row["memory_usage"] or 0),
            "network_rx": int(row["network_rx"] or 0),
            "network_tx": int(row["network_tx"] or 0),
        }
        for row in rows
    ]

    return {"group": group, "start": start, "end": end, "interval": "1h", "data": data}
