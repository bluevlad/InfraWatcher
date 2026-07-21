"""LogAnalyzer 화면 통합용 thin proxy.

- 수집/파싱/cron은 LogAnalyzer 백엔드(별도 서비스)가 담당.
- InfraWatcher는 실시간 관제 진입점만 제공:
  * 대시보드 실시간 에러 피드 (관제 대상 컨테이너 한정)
  * 컨테이너 Drawer 내 "에러 로그" 탭
- LogAnalyzer 다운 시 502를 반환해 프런트엔드가 격리 처리.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status

from app.data.container_registry import CONTAINER_MAP
from app.services import loganalyzer_service as la

router = APIRouter()

_SEVERITY_KEYS = ("critical", "high", "medium", "low")


def _hours_since(since_iso: str | None, fallback_hours: int = 24) -> int:
    """클라이언트 연결 시각(ISO8601) → LogAnalyzer hours 파라미터로 변환."""
    if not since_iso:
        return fallback_hours
    try:
        dt = datetime.fromisoformat(since_iso.replace("Z", "+00:00"))
    except ValueError:
        return fallback_hours
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    elapsed = (datetime.now(timezone.utc) - dt).total_seconds() / 3600.0
    return max(1, min(720, math.ceil(elapsed)))


@router.get("/loganalyzer/live-errors")
async def live_errors(
    since: str | None = Query(None, description="ISO8601 — 대시보드 연결 시각"),
    limit: int = Query(30, ge=1, le=100),
) -> dict[str, Any]:
    """실시간 관제 피드 — 관제 대상 컨테이너의 최근 에러 + severity 집계.

    LogAnalyzer는 전체 컨테이너 에러를 수집하므로,
    containers.json에 등록된 관제 대상으로 필터해 반환한다.
    """
    hours = _hours_since(since, fallback_hours=1)
    try:
        page = await la.get_error_list(hours=hours, page_size=200)
    except la.LogAnalyzerUnavailable as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"LogAnalyzer unavailable: {exc}",
        ) from exc

    items_all: list[dict[str, Any]] = page.get("items", [])
    monitored = [
        e for e in items_all
        if (e.get("container_name") or "") in CONTAINER_MAP
    ]
    if since:
        monitored = [e for e in monitored if (e.get("timestamp") or "") >= since]

    severity_counts = {k: 0 for k in _SEVERITY_KEYS}
    for e in monitored:
        sev = (e.get("severity") or "").lower()
        if sev in severity_counts:
            severity_counts[sev] += 1

    monitored.sort(key=lambda e: e.get("timestamp") or "", reverse=True)
    return {
        "since": since,
        "hours_window": hours,
        "total": len(monitored),
        "severity_counts": severity_counts,
        "items": monitored[:limit],
    }


@router.get("/loganalyzer/errors")
async def container_errors(
    container: str = Query(..., min_length=1, max_length=128),
    since: str | None = Query(None, description="ISO8601 — 대시보드 연결 시각"),
    limit: int = Query(50, ge=1, le=200),
) -> dict[str, Any]:
    """특정 컨테이너의 최근 에러 로그.
    LogAnalyzer는 service 단위 필터만 지원하므로 hours 윈도로 fetch 후 container_name으로 필터.
    """
    hours = _hours_since(since, fallback_hours=24)
    try:
        page = await la.get_error_list(hours=hours, page_size=200)
    except la.LogAnalyzerUnavailable as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"LogAnalyzer unavailable: {exc}",
        ) from exc

    items_all: list[dict[str, Any]] = page.get("items", [])
    filtered = [
        e for e in items_all
        if (e.get("container_name") or "").lower() == container.lower()
    ]
    if since:
        filtered = [e for e in filtered if (e.get("timestamp") or "") >= since]
    return {
        "container": container,
        "since": since,
        "hours_window": hours,
        "total": len(filtered),
        "items": filtered[:limit],
    }
