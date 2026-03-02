import logging
from datetime import datetime, timedelta, timezone

from app.core.database import get_db

logger = logging.getLogger(__name__)


async def aggregate_hourly_metrics() -> None:
    db = await get_db()
    now = datetime.now(timezone.utc)
    # Aggregate the previous full hour
    hour_end = now.replace(minute=0, second=0, microsecond=0)
    hour_start = hour_end - timedelta(hours=1)

    hour_start_str = hour_start.isoformat()
    hour_end_str = hour_end.isoformat()
    hour_ts = hour_start_str

    # Container metrics aggregation
    cursor = await db.execute(
        """
        INSERT OR REPLACE INTO container_metrics_hourly
            (container_name, hour_timestamp, avg_cpu_percent, max_cpu_percent, min_cpu_percent,
             avg_memory_percent, max_memory_percent, avg_memory_usage,
             avg_network_rx, avg_network_tx, sample_count)
        SELECT
            container_name,
            ? as hour_timestamp,
            AVG(cpu_percent),
            MAX(cpu_percent),
            MIN(cpu_percent),
            AVG(memory_percent),
            MAX(memory_percent),
            AVG(memory_usage),
            AVG(network_rx),
            AVG(network_tx),
            COUNT(*)
        FROM container_metrics
        WHERE timestamp >= ? AND timestamp < ?
        GROUP BY container_name
        """,
        (hour_ts, hour_start_str, hour_end_str),
    )

    # System metrics aggregation
    await db.execute(
        """
        INSERT OR REPLACE INTO system_metrics_hourly
            (hour_timestamp, avg_cpu_percent, max_cpu_percent,
             avg_memory_percent, max_memory_percent, avg_disk_percent,
             avg_load_avg_1, sample_count)
        SELECT
            ? as hour_timestamp,
            AVG(cpu_percent),
            MAX(cpu_percent),
            AVG(memory_percent),
            MAX(memory_percent),
            AVG(disk_percent),
            AVG(load_avg_1),
            COUNT(*)
        FROM system_metrics
        WHERE timestamp >= ? AND timestamp < ?
        """,
        (hour_ts, hour_start_str, hour_end_str),
    )

    await db.commit()
    logger.info("Hourly aggregation complete for %s", hour_ts)


async def cleanup_with_retention() -> None:
    db = await get_db()
    now = datetime.now(timezone.utc)

    # Raw data: keep 24 hours
    raw_cutoff = (now - timedelta(hours=24)).isoformat()
    await db.execute("DELETE FROM container_metrics WHERE timestamp < ?", (raw_cutoff,))
    await db.execute("DELETE FROM system_metrics WHERE timestamp < ?", (raw_cutoff,))
    await db.execute("DELETE FROM health_checks WHERE timestamp < ?", (raw_cutoff,))

    # Hourly aggregated data: keep 7 days
    hourly_cutoff = (now - timedelta(days=7)).isoformat()
    await db.execute("DELETE FROM container_metrics_hourly WHERE hour_timestamp < ?", (hourly_cutoff,))
    await db.execute("DELETE FROM system_metrics_hourly WHERE hour_timestamp < ?", (hourly_cutoff,))

    await db.commit()
    logger.info("Differential cleanup: raw < %s, hourly < %s", raw_cutoff, hourly_cutoff)
