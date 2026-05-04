from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "InfraWatcher"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 9090

    # Database
    DB_PATH: str = "/app/data/infrawatcher.db"

    # Docker
    DOCKER_SOCKET: str = "/var/run/docker.sock"

    # Health Check
    HEALTHCHECK_HOST: str = "host.docker.internal"
    HEALTHCHECK_TIMEOUT: float = 3.0

    # Scheduler intervals (seconds)
    METRICS_INTERVAL: int = 10
    HEALTHCHECK_INTERVAL: int = 30

    # CORS
    CORS_ORIGINS: str = "https://infrawatcher.unmong.com,http://localhost:4090"

    # WebSocket
    WS_BROADCAST_INTERVAL: int = 10

    # Data retention (hours)
    DATA_RETENTION_HOURS: int = 168  # 7 days

    model_config = {
        "env_file": ".env",
        "env_prefix": "IW_",
        "extra": "ignore",
    }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
