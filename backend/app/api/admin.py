"""관리자 전용 API — 컨테이너 제어 + 감사 로그 조회."""

from fastapi import APIRouter, Depends, Query

from app.core.auth import require_admin
from app.services.admin_action_service import (
    list_audit_log,
    perform_container_action,
)

router = APIRouter()


@router.post("/containers/{name}/start")
async def start_container(name: str, admin: dict = Depends(require_admin)) -> dict:
    return await perform_container_action("start", name, admin["email"])


@router.post("/containers/{name}/restart")
async def restart_container(name: str, admin: dict = Depends(require_admin)) -> dict:
    return await perform_container_action("restart", name, admin["email"])


@router.get("/audit-log")
async def get_audit_log(
    limit: int = Query(100, ge=1, le=500),
    _: dict = Depends(require_admin),
) -> list[dict]:
    return await list_audit_log(limit=limit)
