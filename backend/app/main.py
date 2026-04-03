import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.core.scheduler import (
    start_scheduler,
    stop_scheduler,
    collect_metrics_job,
    health_check_job,
)
from app.api import health, containers, system, healthcheck, websocket, container_history, groups

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting InfraWatcher...")
    await init_db()

    # Run initial collection before starting scheduler
    await collect_metrics_job()
    await health_check_job()

    start_scheduler()
    logger.info("InfraWatcher started successfully")

    yield

    # Shutdown
    logger.info("Shutting down InfraWatcher...")
    stop_scheduler()
    await close_db()
    logger.info("InfraWatcher shut down")


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    root_path="",
)

cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST API routes
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(containers.router, prefix="/api", tags=["containers"])
app.include_router(system.router, prefix="/api", tags=["system"])
app.include_router(healthcheck.router, prefix="/api", tags=["healthchecks"])
app.include_router(container_history.router, prefix="/api", tags=["container-history"])
app.include_router(groups.router, prefix="/api", tags=["groups"])

# WebSocket
app.include_router(websocket.router, tags=["websocket"])
