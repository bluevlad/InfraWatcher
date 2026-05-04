import json
import logging
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ContainerConfig:
    name: str
    group: str
    port: int | None
    health_path: str | None
    health_type: str  # "http", "tcp", "docker"
    host: str | None = None  # None = use default HEALTHCHECK_HOST


def _load_containers() -> list[ContainerConfig]:
    data_dir = Path(__file__).parent
    config_file = data_dir / "containers.json"
    using_example = False
    if not config_file.exists():
        config_file = data_dir / "containers.example.json"
        using_example = True
    with config_file.open(encoding="utf-8") as f:
        items = json.load(f)
    if using_example:
        logger.warning(
            "containers.json 없음 — containers.example.json (placeholder) 사용. "
            "실제 모니터링하려면 containers.json을 생성해야 합니다."
        )
    return [ContainerConfig(**item) for item in items]


CONTAINER_REGISTRY: list[ContainerConfig] = _load_containers()
CONTAINER_MAP: dict[str, ContainerConfig] = {c.name: c for c in CONTAINER_REGISTRY}
GROUP_NAMES: list[str] = list(dict.fromkeys(c.group for c in CONTAINER_REGISTRY))
