"""관리자 컨테이너 제어 (start/restart) + 감사 로그."""

import logging
import time
from datetime import datetime, timezone
from typing import Literal

from docker.errors import APIError, NotFound
from fastapi import HTTPException, status

from app.core.database import get_db
from app.data.container_registry import CONTAINER_MAP
from app.services.docker_service import _get_client

logger = logging.getLogger(__name__)

Action = Literal["start", "restart"]


async def _record_audit(
    user_email: str,
    action: Action,
    container_name: str,
    success: bool,
    error: str | None,
    duration_ms: int,
) -> None:
    """감사 로그 기록 — DB 실패는 호출자 액션 결과를 가리지 않도록 흡수."""
    try:
        db = await get_db()
        await db.execute(
            """
            INSERT INTO audit_log
                (timestamp, user_email, action, container_name, success, error, duration_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                user_email,
                action,
                container_name,
                1 if success else 0,
                error,
                duration_ms,
            ),
        )
        await db.commit()
    except Exception as exc:  # pragma: no cover
        logger.exception("audit_log write failed: %s", exc)


def _validate_container(name: str) -> None:
    if name not in CONTAINER_MAP:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail=f"Container '{name}' is not registered for management",
        )


async def perform_container_action(
    action: Action,
    container_name: str,
    user_email: str,
) -> dict:
    """start 또는 restart 실행 + 감사 로그."""
    _validate_container(container_name)

    started = time.monotonic()
    error: str | None = None
    new_status: str | None = None

    try:
        client = _get_client()
        container = client.containers.get(container_name)
        if action == "start":
            container.start()
        elif action == "restart":
            container.restart()
        # reload to get fresh status
        container.reload()
        new_status = container.status
    except NotFound:
        error = "Container not found in Docker"
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=error)
    except APIError as exc:
        error = f"Docker API error: {exc.explanation or str(exc)}"
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=error)
    except Exception as exc:  # pragma: no cover
        error = f"Unexpected error: {exc}"
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error)
    finally:
        duration_ms = int((time.monotonic() - started) * 1000)
        await _record_audit(
            user_email=user_email,
            action=action,
            container_name=container_name,
            success=error is None,
            error=error,
            duration_ms=duration_ms,
        )

    logger.info(
        "admin action %s on %s by %s succeeded (status=%s, %dms)",
        action,
        container_name,
        user_email,
        new_status,
        duration_ms,
    )
    return {
        "ok": True,
        "action": action,
        "container": container_name,
        "status": new_status,
        "duration_ms": duration_ms,
    }


async def list_audit_log(limit: int = 100) -> list[dict]:
    db = await get_db()
    cur = await db.execute(
        """
        SELECT id, timestamp, user_email, action, container_name,
               success, error, duration_ms
        FROM audit_log
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    )
    rows = await cur.fetchall()
    return [
        {
            "id": r["id"],
            "timestamp": r["timestamp"],
            "user_email": r["user_email"],
            "action": r["action"],
            "container_name": r["container_name"],
            "success": bool(r["success"]),
            "error": r["error"],
            "duration_ms": r["duration_ms"],
        }
        for r in rows
    ]
