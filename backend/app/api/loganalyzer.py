"""LogAnalyzer 화면 통합용 thin proxy.

- 수집/파싱/cron은 LogAnalyzer 백엔드(별도 서비스)가 담당.
- InfraWatcher는 화면 통합 진입점만 제공:
  * 대시보드 상단 3카드 (GitHub Issue / QA Dashboard / StandUp)
  * 컨테이너 Drawer 내 "에러 로그" 탭
  * 수동 전송/보고는 관리자(`require_admin`) 전용 + 감사 로그 기록
- LogAnalyzer 다운 시 502를 반환해 프런트엔드가 ErrorBoundary로 격리.
"""

from __future__ import annotations

import math
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import require_admin
from app.services import loganalyzer_service as la
from app.services.admin_action_service import record_admin_audit

router = APIRouter()


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


@router.get("/loganalyzer/integration-summary")
async def integration_summary() -> dict[str, Any]:
    """3카드용 집계 — 미해결 그룹 / 해결 그룹 / 자동 트리거 정보."""
    try:
        summary = await la.get_error_summary(hours=24)
        groups = await la.get_error_groups(limit=200)
    except la.LogAnalyzerUnavailable as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"LogAnalyzer unavailable: {exc}",
        ) from exc

    issued_count = sum(1 for g in groups if g.get("github_issue_number"))
    return {
        "github": {
            "issued_count": issued_count,
            "auto_trigger": "06:00 daily",
            "note": "CRITICAL/HIGH 미해결 오류는 일일 cron이 자동 생성",
        },
        "qa_dashboard": {
            "pending_open_count": summary.get("open_groups", 0),
        },
        "standup": {
            "pending_resolved_count": summary.get("resolved_groups", 0),
        },
        "totals": {
            "critical": summary.get("critical", 0),
            "high": summary.get("high", 0),
            "medium": summary.get("medium", 0),
            "low": summary.get("low", 0),
            "total_errors": summary.get("total_errors", 0),
        },
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


@router.post("/loganalyzer/qa-push")
async def manual_qa_push(admin: dict = Depends(require_admin)) -> dict[str, Any]:
    """관리자 수동 트리거: LogAnalyzer → QA Dashboard 전송. 감사 로그 기록."""
    started = time.monotonic()
    try:
        result = await la.push_qa_dashboard()
    except la.LogAnalyzerUnavailable as exc:
        duration_ms = int((time.monotonic() - started) * 1000)
        await record_admin_audit(
            admin["email"], "loganalyzer.qa-push", "loganalyzer:qa-dashboard",
            success=False, error=str(exc), duration_ms=duration_ms,
        )
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"LogAnalyzer unavailable: {exc}",
        ) from exc

    duration_ms = int((time.monotonic() - started) * 1000)
    sent = result.get("status") == "sent"
    await record_admin_audit(
        admin["email"], "loganalyzer.qa-push", "loganalyzer:qa-dashboard",
        success=sent, error=None if sent else result.get("status"),
        duration_ms=duration_ms,
    )
    return result


@router.post("/loganalyzer/standup-report")
async def manual_standup(admin: dict = Depends(require_admin)) -> dict[str, Any]:
    """관리자 수동 트리거: LogAnalyzer → StandUp 보고. 감사 로그 기록."""
    started = time.monotonic()
    try:
        result = await la.report_standup()
    except la.LogAnalyzerUnavailable as exc:
        duration_ms = int((time.monotonic() - started) * 1000)
        await record_admin_audit(
            admin["email"], "loganalyzer.standup-report", "loganalyzer:standup",
            success=False, error=str(exc), duration_ms=duration_ms,
        )
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"LogAnalyzer unavailable: {exc}",
        ) from exc

    duration_ms = int((time.monotonic() - started) * 1000)
    sent = result.get("status") == "sent"
    await record_admin_audit(
        admin["email"], "loganalyzer.standup-report", "loganalyzer:standup",
        success=sent, error=None if sent else result.get("status"),
        duration_ms=duration_ms,
    )
    return result
