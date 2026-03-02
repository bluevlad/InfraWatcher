from fastapi import APIRouter

from app.services.healthcheck_service import run_health_checks
from app.models.schemas import HealthCheckResult

router = APIRouter()


@router.get("/healthchecks", response_model=list[HealthCheckResult])
async def get_health_checks():
    return await run_health_checks()
