from dataclasses import dataclass


@dataclass(frozen=True)
class ContainerConfig:
    name: str
    group: str
    port: int | None
    health_path: str | None
    health_type: str  # "http", "tcp", "docker"
    host: str | None = None  # None = use default HEALTHCHECK_HOST


CONTAINER_REGISTRY: list[ContainerConfig] = [
    # Academy
    ContainerConfig("academy-admin-back-end", "Academy", 9001, "/", "http"),
    ContainerConfig("academy-user-back-end", "Academy", 9002, "/", "http"),
    ContainerConfig("academy-admin-frontend", "Academy", 4001, "/", "http"),
    ContainerConfig("academy-user-frontend", "Academy", 4002, "/", "http"),

    # AllergyInsight
    ContainerConfig("allergyinsight-backend", "AllergyInsight", 9040, "/api/health", "http"),
    ContainerConfig("allergyinsight-frontend", "AllergyInsight", 4040, "/", "http"),
    ContainerConfig("allergyinsight-scheduler", "AllergyInsight", None, None, "docker"),

    # CompanyAnalyzer
    ContainerConfig("companyanalyzer-backend", "CompanyAnalyzer", 9080, "/api/health", "http"),
    ContainerConfig("companyanalyzer-frontend", "CompanyAnalyzer", 4080, "/", "http"),

    # EduFit
    ContainerConfig("edufit-backend", "EduFit", 9070, "/api/health", "http"),
    ContainerConfig("edufit-frontend", "EduFit", 4070, "/", "http"),
    ContainerConfig("edufit-ai-crawler", "EduFit", None, None, "docker"),

    # Tools
    ContainerConfig("standup-app", "Tools", 9060, "/api/v1/health", "http"),
    ContainerConfig("newsletterplatform-web", "Tools", 4050, "/", "http"),
    ContainerConfig("newsletterplatform-scheduler", "Tools", None, None, "docker"),

    # HopenVision
    ContainerConfig("hopenvision-api", "HopenVision", 9050, "/actuator/health", "http"),
    ContainerConfig("hopenvision-web", "HopenVision", 4060, "/", "http"),
    ContainerConfig("hopenvision-admin", "HopenVision", 4061, "/", "http"),

    # unmong
    ContainerConfig("unmong-main", "unmong", 8888, "/actuator/health", "http"),
    ContainerConfig("unmong-gateway", "unmong", 80, "/health", "http"),

    # DB/Infra
    ContainerConfig("postgresql", "DB/Infra", 5432, None, "tcp"),
    ContainerConfig("mongodb", "DB/Infra", 27017, None, "tcp"),
    ContainerConfig("pgadmin", "DB/Infra", 8882, "/", "http"),
    ContainerConfig("mongo-express", "DB/Infra", 8881, "/", "http"),

    # Host Services (non-Docker, LaunchAgent managed)
    ContainerConfig("ollama", "Host Services", 11434, "/api/tags", "http"),
    ContainerConfig("mlx-server", "Host Services", 11435, "/v1/models", "http"),
]

CONTAINER_MAP: dict[str, ContainerConfig] = {c.name: c for c in CONTAINER_REGISTRY}
GROUP_NAMES: list[str] = list(dict.fromkeys(c.group for c in CONTAINER_REGISTRY))
