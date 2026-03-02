from fastapi import APIRouter, Query

from app.core.scheduler import get_latest_containers, get_latest_health_checks
from app.data.container_registry import CONTAINERS
from app.services.history_service import get_group_metrics_history

router = APIRouter()


@router.get("/groups/{group}/summary")
async def group_summary(group: str):
    group_container_names = {c.name for c in CONTAINERS if c.group == group}

    containers = get_latest_containers()
    health_checks = get_latest_health_checks()

    group_containers = [c for c in containers if c.name in group_container_names]
    group_health = [h for h in health_checks if h.container_name in group_container_names]

    running = sum(1 for c in group_containers if c.status == "running")
    stopped = len(group_containers) - running
    healthy = sum(1 for h in group_health if h.status == "healthy")
    unhealthy = sum(1 for h in group_health if h.status == "unhealthy")
    total_cpu = sum(c.cpu_percent for c in group_containers)
    total_mem_usage = sum(c.memory_usage for c in group_containers)
    total_mem_limit = sum(c.memory_limit for c in group_containers if c.memory_limit > 0)
    total_mem_pct = (total_mem_usage / max(total_mem_limit, 1)) * 100

    return {
        "group": group,
        "container_count": len(group_containers),
        "running_count": running,
        "stopped_count": stopped,
        "healthy_count": healthy,
        "unhealthy_count": unhealthy,
        "total_cpu_percent": round(total_cpu, 2),
        "total_memory_percent": round(total_mem_pct, 2),
    }


@router.get("/groups/{group}/metrics")
async def group_metrics_history(
    group: str,
    start: str | None = Query(None),
    end: str | None = Query(None),
    interval: str | None = Query(None),
):
    return await get_group_metrics_history(group, start, end, interval)
