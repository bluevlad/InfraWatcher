import asyncio
import logging
import socket
import time
from datetime import datetime, timezone

import httpx

from app.core.config import get_settings
from app.core.database import get_db
from app.data.container_registry import CONTAINER_REGISTRY, ContainerConfig
from app.models.schemas import HealthCheckResult

logger = logging.getLogger(__name__)


async def _check_http(config: ContainerConfig, host: str, timeout: float) -> HealthCheckResult:
    url = f"http://{host}:{config.port}{config.health_path}"
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(url)
            elapsed = (time.monotonic() - start) * 1000
            status = "healthy" if resp.status_code < 500 else "unhealthy"
            return HealthCheckResult(
                container_name=config.name,
                group=config.group,
                health_type="http",
                port=config.port,
                path=config.health_path,
                status=status,
                response_time_ms=round(elapsed, 1),
                status_code=resp.status_code,
                error=None,
                checked_at=datetime.now(timezone.utc).isoformat(),
            )
    except Exception as e:
        elapsed = (time.monotonic() - start) * 1000
        return HealthCheckResult(
            container_name=config.name,
            group=config.group,
            health_type="http",
            port=config.port,
            path=config.health_path,
            status="unhealthy",
            response_time_ms=round(elapsed, 1),
            status_code=None,
            error=str(e)[:200],
            checked_at=datetime.now(timezone.utc).isoformat(),
        )


async def _check_tcp(config: ContainerConfig, host: str, timeout: float) -> HealthCheckResult:
    start = time.monotonic()
    try:
        loop = asyncio.get_event_loop()
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        await loop.run_in_executor(None, sock.connect, (host, config.port))
        sock.close()
        elapsed = (time.monotonic() - start) * 1000
        return HealthCheckResult(
            container_name=config.name,
            group=config.group,
            health_type="tcp",
            port=config.port,
            path=None,
            status="healthy",
            response_time_ms=round(elapsed, 1),
            status_code=None,
            error=None,
            checked_at=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as e:
        elapsed = (time.monotonic() - start) * 1000
        return HealthCheckResult(
            container_name=config.name,
            group=config.group,
            health_type="tcp",
            port=config.port,
            path=None,
            status="unhealthy",
            response_time_ms=round(elapsed, 1),
            status_code=None,
            error=str(e)[:200],
            checked_at=datetime.now(timezone.utc).isoformat(),
        )


async def _check_docker(config: ContainerConfig) -> HealthCheckResult:
    """Check container health via Docker inspect (for containers without ports)."""
    try:
        import docker as docker_lib
        client = docker_lib.DockerClient(
            base_url=f"unix://{get_settings().DOCKER_SOCKET}", timeout=5
        )
        container = client.containers.get(config.name)
        state = container.attrs.get("State", {})
        status = "healthy" if state.get("Status") == "running" else "unhealthy"
        return HealthCheckResult(
            container_name=config.name,
            group=config.group,
            health_type="docker",
            port=None,
            path=None,
            status=status,
            response_time_ms=None,
            status_code=None,
            error=None if status == "healthy" else f"Container status: {state.get('Status')}",
            checked_at=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as e:
        return HealthCheckResult(
            container_name=config.name,
            group=config.group,
            health_type="docker",
            port=None,
            path=None,
            status="unknown",
            response_time_ms=None,
            status_code=None,
            error=str(e)[:200],
            checked_at=datetime.now(timezone.utc).isoformat(),
        )


async def run_health_checks() -> list[HealthCheckResult]:
    settings = get_settings()
    host = settings.HEALTHCHECK_HOST
    timeout = settings.HEALTHCHECK_TIMEOUT

    tasks = []
    for config in CONTAINER_REGISTRY:
        if config.health_type == "http":
            tasks.append(_check_http(config, host, timeout))
        elif config.health_type == "tcp":
            tasks.append(_check_tcp(config, host, timeout))
        elif config.health_type == "docker":
            tasks.append(_check_docker(config))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    checks = []
    for r in results:
        if isinstance(r, HealthCheckResult):
            checks.append(r)
        elif isinstance(r, Exception):
            logger.warning("Health check error: %s", r)

    return checks


async def save_health_checks(checks: list[HealthCheckResult]) -> None:
    db = await get_db()
    for c in checks:
        await db.execute(
            """INSERT INTO health_checks
               (timestamp, container_name, health_type, port, path,
                status, response_time_ms, status_code, error)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (c.checked_at, c.container_name, c.health_type, c.port, c.path,
             c.status, c.response_time_ms, c.status_code, c.error),
        )
    await db.commit()
