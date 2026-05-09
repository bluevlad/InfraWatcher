"""LogAnalyzer thin proxy client.

LogAnalyzer 백엔드(별도 서비스, 9092)에 대한 InfraWatcher 측 얇은 어댑터.
- 화면 통합만 수행 — 수집/파싱 로직은 LogAnalyzer가 담당.
- LogAnalyzer 장애 시 InfraWatcher 본체 대시보드는 영향 없도록 호출자가 예외 처리.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class LogAnalyzerUnavailable(Exception):
    """LogAnalyzer 호출 실패 — 네트워크/타임아웃/5xx."""


def _client() -> httpx.AsyncClient:
    settings = get_settings()
    return httpx.AsyncClient(
        base_url=settings.LOGANALYZER_BASE_URL,
        timeout=settings.LOGANALYZER_TIMEOUT,
    )


async def _get(path: str, params: dict[str, Any] | None = None) -> Any:
    async with _client() as cli:
        try:
            r = await cli.get(path, params=params)
            r.raise_for_status()
            return r.json()
        except (httpx.HTTPError, httpx.TimeoutException) as exc:
            logger.warning("LogAnalyzer GET %s failed: %s", path, exc)
            raise LogAnalyzerUnavailable(str(exc)) from exc


async def _post(path: str, params: dict[str, Any] | None = None) -> Any:
    async with _client() as cli:
        try:
            r = await cli.post(path, params=params)
            r.raise_for_status()
            return r.json()
        except (httpx.HTTPError, httpx.TimeoutException) as exc:
            logger.warning("LogAnalyzer POST %s failed: %s", path, exc)
            raise LogAnalyzerUnavailable(str(exc)) from exc


async def get_health() -> dict[str, Any]:
    return await _get("/api/health")


async def get_error_summary(hours: int = 24) -> dict[str, Any]:
    return await _get("/api/errors/summary", {"hours": hours})


async def get_error_groups(
    status: str | None = None,
    limit: int = 200,
) -> list[dict[str, Any]]:
    params: dict[str, Any] = {"limit": limit, "sort_by": "last_seen"}
    if status:
        params["status"] = status
    return await _get("/api/errors/groups", params)


async def get_error_list(
    hours: int = 24,
    page_size: int = 200,
) -> dict[str, Any]:
    return await _get(
        "/api/errors/list",
        {"hours": hours, "page": 1, "page_size": page_size},
    )


async def push_qa_dashboard() -> dict[str, Any]:
    return await _post("/api/integration/qa-dashboard")


async def report_standup() -> dict[str, Any]:
    return await _post("/api/integration/standup")
