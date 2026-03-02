import logging
from datetime import datetime, timezone

import psutil

from app.core.database import get_db
from app.models.schemas import SystemMetrics

logger = logging.getLogger(__name__)


def _format_uptime(boot_time: float) -> str:
    delta = datetime.now(timezone.utc) - datetime.fromtimestamp(boot_time, tz=timezone.utc)
    days = delta.days
    hours, remainder = divmod(delta.seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    if days > 0:
        return f"{days}d {hours}h {minutes}m"
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


async def collect_system_metrics() -> SystemMetrics:
    cpu_percent = psutil.cpu_percent(interval=0.5)
    cpu_count = psutil.cpu_count() or 1
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    load_avg = psutil.getloadavg()
    boot = psutil.boot_time()

    return SystemMetrics(
        cpu_percent=round(cpu_percent, 1),
        cpu_count=cpu_count,
        memory_total=memory.total,
        memory_used=memory.used,
        memory_percent=round(memory.percent, 1),
        disk_total=disk.total,
        disk_used=disk.used,
        disk_percent=round(disk.percent, 1),
        load_avg_1=round(load_avg[0], 2),
        load_avg_5=round(load_avg[1], 2),
        load_avg_15=round(load_avg[2], 2),
        boot_time=datetime.fromtimestamp(boot, tz=timezone.utc).isoformat(),
        uptime=_format_uptime(boot),
    )


async def save_system_metrics(metrics: SystemMetrics) -> None:
    now = datetime.now(timezone.utc).isoformat()
    db = await get_db()
    await db.execute(
        """INSERT INTO system_metrics
           (timestamp, cpu_percent, cpu_count, memory_total, memory_used,
            memory_percent, disk_total, disk_used, disk_percent,
            load_avg_1, load_avg_5, load_avg_15)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (now, metrics.cpu_percent, metrics.cpu_count,
         metrics.memory_total, metrics.memory_used, metrics.memory_percent,
         metrics.disk_total, metrics.disk_used, metrics.disk_percent,
         metrics.load_avg_1, metrics.load_avg_5, metrics.load_avg_15),
    )
    await db.commit()
