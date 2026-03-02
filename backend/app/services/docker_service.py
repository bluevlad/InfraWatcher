import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from functools import partial

import docker
from docker.errors import DockerException, NotFound

from app.core.config import get_settings
from app.core.database import get_db
from app.data.container_registry import CONTAINER_MAP, CONTAINER_REGISTRY
from app.models.schemas import ContainerInfo

logger = logging.getLogger(__name__)

_client: docker.DockerClient | None = None
_executor = ThreadPoolExecutor(max_workers=8)


def _get_client() -> docker.DockerClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = docker.DockerClient(base_url=f"unix://{settings.DOCKER_SOCKET}", timeout=10)
    return _client


def _format_uptime(started_at: str) -> str:
    try:
        start = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
        delta = datetime.now(timezone.utc) - start
        days = delta.days
        hours, remainder = divmod(delta.seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        if days > 0:
            return f"{days}d {hours}h {minutes}m"
        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"
    except Exception:
        return "unknown"


def _format_ports(container) -> list[str]:
    ports = []
    port_bindings = container.attrs.get("NetworkSettings", {}).get("Ports") or {}
    for container_port, bindings in port_bindings.items():
        if bindings:
            for b in bindings:
                ports.append(f"{b.get('HostPort', '?')}→{container_port}")
        else:
            ports.append(container_port)
    return ports


def _get_container_stats(container) -> dict:
    """Get stats for a single container (blocking call, run in thread)."""
    try:
        stats = container.stats(stream=False)
        # CPU
        cpu_delta = (
            stats["cpu_stats"]["cpu_usage"]["total_usage"]
            - stats["precpu_stats"]["cpu_usage"]["total_usage"]
        )
        system_delta = (
            stats["cpu_stats"]["system_cpu_usage"]
            - stats["precpu_stats"]["system_cpu_usage"]
        )
        num_cpus = stats["cpu_stats"].get("online_cpus", 1)
        cpu_percent = (cpu_delta / system_delta * 100.0 * num_cpus) if system_delta > 0 else 0.0

        # Memory
        mem_stats = stats.get("memory_stats", {})
        mem_usage = mem_stats.get("usage", 0) - mem_stats.get("stats", {}).get("cache", 0)
        mem_limit = mem_stats.get("limit", 0)
        mem_percent = (mem_usage / mem_limit * 100.0) if mem_limit > 0 else 0.0

        # Network
        net_stats = stats.get("networks", {})
        rx = sum(v.get("rx_bytes", 0) for v in net_stats.values())
        tx = sum(v.get("tx_bytes", 0) for v in net_stats.values())

        # Block I/O
        blkio = stats.get("blkio_stats", {}).get("io_service_bytes_recursive") or []
        block_read = sum(e.get("value", 0) for e in blkio if e.get("op") == "read")
        block_write = sum(e.get("value", 0) for e in blkio if e.get("op") == "write")

        pids = stats.get("pids_stats", {}).get("current", 0)

        return {
            "cpu_percent": round(cpu_percent, 2),
            "memory_usage": max(mem_usage, 0),
            "memory_limit": mem_limit,
            "memory_percent": round(mem_percent, 2),
            "network_rx": rx,
            "network_tx": tx,
            "block_read": block_read,
            "block_write": block_write,
            "pids": pids or 0,
        }
    except Exception as e:
        logger.debug("Failed to get stats for container: %s", e)
        return {
            "cpu_percent": 0, "memory_usage": 0, "memory_limit": 0,
            "memory_percent": 0, "network_rx": 0, "network_tx": 0,
            "block_read": 0, "block_write": 0, "pids": 0,
        }


def _collect_single_container(name: str) -> ContainerInfo | None:
    """Collect info for a single container (blocking, for thread pool)."""
    try:
        client = _get_client()
        container = client.containers.get(name)
        config = CONTAINER_MAP.get(name)
        group = config.group if config else "Unknown"

        state = container.attrs.get("State", {})
        status = state.get("Status", "unknown")
        started_at = state.get("StartedAt", "")
        image_tags = container.image.tags if container.image.tags else [container.attrs.get("Config", {}).get("Image", "unknown")]

        if status == "running":
            stats = _get_container_stats(container)
        else:
            stats = {
                "cpu_percent": 0, "memory_usage": 0, "memory_limit": 0,
                "memory_percent": 0, "network_rx": 0, "network_tx": 0,
                "block_read": 0, "block_write": 0, "pids": 0,
            }

        return ContainerInfo(
            name=name,
            group=group,
            status=status,
            image=image_tags[0],
            created=container.attrs.get("Created", ""),
            uptime=_format_uptime(started_at) if status == "running" else "-",
            ports=_format_ports(container),
            **stats,
        )
    except NotFound:
        logger.debug("Container %s not found", name)
        return None
    except Exception as e:
        logger.warning("Error collecting container %s: %s", name, e)
        return None


async def collect_containers() -> list[ContainerInfo]:
    """Collect all registered containers using thread pool for parallel stats."""
    import asyncio

    loop = asyncio.get_event_loop()
    names = [c.name for c in CONTAINER_REGISTRY]

    futures = [
        loop.run_in_executor(_executor, partial(_collect_single_container, name))
        for name in names
    ]
    results = await asyncio.gather(*futures, return_exceptions=True)

    containers = []
    for r in results:
        if isinstance(r, ContainerInfo):
            containers.append(r)
        elif isinstance(r, Exception):
            logger.warning("Container collection error: %s", r)

    return containers


async def save_container_metrics(containers: list[ContainerInfo]) -> None:
    now = datetime.now(timezone.utc).isoformat()
    db = await get_db()
    for c in containers:
        await db.execute(
            """INSERT INTO container_metrics
               (timestamp, container_name, status, cpu_percent,
                memory_usage, memory_limit, memory_percent,
                network_rx, network_tx, block_read, block_write, pids)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (now, c.name, c.status, c.cpu_percent,
             c.memory_usage, c.memory_limit, c.memory_percent,
             c.network_rx, c.network_tx, c.block_read, c.block_write, c.pids),
        )
    await db.commit()


def check_docker_connection() -> bool:
    try:
        client = _get_client()
        client.ping()
        return True
    except DockerException:
        return False
