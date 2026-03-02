from fastapi import APIRouter

from app.services.system_service import collect_system_metrics
from app.models.schemas import SystemMetrics

router = APIRouter()


@router.get("/system", response_model=SystemMetrics)
async def get_system_metrics():
    return await collect_system_metrics()
