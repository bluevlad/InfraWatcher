from fastapi import APIRouter, Query

from app.services.history_service import (
    get_container_metrics_history,
    get_container_healthcheck_history,
)

router = APIRouter()


@router.get("/containers/{name}/metrics")
async def container_metrics_history(
    name: str,
    start: str | None = Query(None, description="ISO8601 start time"),
    end: str | None = Query(None, description="ISO8601 end time"),
    interval: str | None = Query(None, description="Bucket interval: 1m, 5m, 15m, 1h"),
):
    return await get_container_metrics_history(name, start, end, interval)


@router.get("/containers/{name}/healthchecks")
async def container_healthcheck_history(
    name: str,
    start: str | None = Query(None),
    end: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, description="Filter: healthy, unhealthy, unknown"),
):
    return await get_container_healthcheck_history(name, start, end, page, size, status)
