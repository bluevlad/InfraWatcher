import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import get_settings
from app.services.aggregation_service import aggregate_hourly_metrics, cleanup_with_retention
from app.models.schemas import DashboardSnapshot, DashboardSummary
from app.services.docker_service import collect_containers, save_container_metrics
from app.services.healthcheck_service import run_health_checks, save_health_checks
from app.services.system_service import collect_system_metrics, save_system_metrics
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

# Cache latest data for API responses
_latest_containers = []
_latest_system = None
_latest_health_checks = []


def get_latest_snapshot() -> dict | None:
    if _latest_system is None:
        return None
    return _build_snapshot()


def get_latest_containers():
    return _latest_containers


def get_latest_health_checks():
    return _latest_health_checks


def _build_snapshot() -> dict:
    running = sum(1 for c in _latest_containers if c.status == "running")
    stopped = len(_latest_containers) - running
    healthy = sum(1 for h in _latest_health_checks if h.status == "healthy")
    unhealthy = sum(1 for h in _latest_health_checks if h.status == "unhealthy")
    unknown = sum(1 for h in _latest_health_checks if h.status == "unknown")
    total_cpu = sum(c.cpu_percent for c in _latest_containers)
    total_mem = (
        sum(c.memory_usage for c in _latest_containers) /
        max(sum(c.memory_limit for c in _latest_containers if c.memory_limit > 0), 1)
        * 100
    )

    summary = DashboardSummary(
        total_containers=len(_latest_containers),
        running_containers=running,
        stopped_containers=stopped,
        healthy_services=healthy,
        unhealthy_services=unhealthy,
        unknown_services=unknown,
        total_cpu_percent=round(total_cpu, 2),
        total_memory_percent=round(total_mem, 2),
    )

    snapshot = DashboardSnapshot(
        timestamp=datetime.now(timezone.utc).isoformat(),
        system=_latest_system,
        containers=_latest_containers,
        health_checks=_latest_health_checks,
        summary=summary,
    )
    return snapshot.model_dump()


async def collect_metrics_job():
    global _latest_containers, _latest_system
    try:
        _latest_containers = await collect_containers()
        _latest_system = await collect_system_metrics()

        await save_container_metrics(_latest_containers)
        await save_system_metrics(_latest_system)

        # Broadcast to WebSocket clients
        snapshot = _build_snapshot()
        await ws_manager.broadcast({"type": "snapshot", "data": snapshot})

        logger.debug(
            "Metrics collected: %d containers, CPU %.1f%%",
            len(_latest_containers), _latest_system.cpu_percent,
        )
    except Exception as e:
        logger.error("Metrics collection failed: %s", e)


async def health_check_job():
    global _latest_health_checks
    try:
        _latest_health_checks = await run_health_checks()
        await save_health_checks(_latest_health_checks)

        # Broadcast updated snapshot
        if _latest_system is not None:
            snapshot = _build_snapshot()
            await ws_manager.broadcast({"type": "snapshot", "data": snapshot})

        healthy = sum(1 for h in _latest_health_checks if h.status == "healthy")
        logger.debug(
            "Health checks: %d/%d healthy",
            healthy, len(_latest_health_checks),
        )
    except Exception as e:
        logger.error("Health check failed: %s", e)


async def aggregation_job():
    try:
        await aggregate_hourly_metrics()
    except Exception as e:
        logger.error("Hourly aggregation failed: %s", e)


async def cleanup_job():
    try:
        await cleanup_with_retention()
    except Exception as e:
        logger.error("Data cleanup failed: %s", e)


def start_scheduler():
    settings = get_settings()

    scheduler.add_job(
        collect_metrics_job,
        "interval",
        seconds=settings.METRICS_INTERVAL,
        id="collect_metrics",
        max_instances=1,
    )
    scheduler.add_job(
        health_check_job,
        "interval",
        seconds=settings.HEALTHCHECK_INTERVAL,
        id="health_checks",
        max_instances=1,
    )
    scheduler.add_job(
        aggregation_job,
        "cron",
        minute=5,
        id="aggregation",
        max_instances=1,
    )
    scheduler.add_job(
        cleanup_job,
        "interval",
        hours=1,
        id="cleanup",
        max_instances=1,
    )

    scheduler.start()
    logger.info(
        "Scheduler started: metrics every %ds, health checks every %ds",
        settings.METRICS_INTERVAL, settings.HEALTHCHECK_INTERVAL,
    )


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
