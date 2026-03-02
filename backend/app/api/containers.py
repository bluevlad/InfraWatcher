from fastapi import APIRouter

from app.services.docker_service import collect_containers
from app.models.schemas import ContainerInfo

router = APIRouter()


@router.get("/containers", response_model=list[ContainerInfo])
async def get_containers():
    return await collect_containers()
