import logging
import os
from datetime import datetime, timedelta, timezone

import aiosqlite

from app.core.config import get_settings
from app.models.database_models import TABLES_DDL

logger = logging.getLogger(__name__)

_db: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    global _db
    if _db is None:
        raise RuntimeError("Database not initialized")
    return _db


async def init_db() -> None:
    global _db
    settings = get_settings()

    os.makedirs(os.path.dirname(settings.DB_PATH), exist_ok=True)

    _db = await aiosqlite.connect(settings.DB_PATH)
    _db.row_factory = aiosqlite.Row

    # Enable WAL mode for concurrent read/write
    await _db.execute("PRAGMA journal_mode=WAL")
    await _db.execute("PRAGMA busy_timeout=5000")

    for ddl in TABLES_DDL:
        await _db.execute(ddl)
    await _db.commit()

    logger.info("Database initialized at %s", settings.DB_PATH)


async def close_db() -> None:
    global _db
    if _db is not None:
        await _db.close()
        _db = None
        logger.info("Database connection closed")


async def cleanup_old_data() -> None:
    settings = get_settings()
    cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.DATA_RETENTION_HOURS)
    cutoff_str = cutoff.isoformat()

    db = await get_db()
    await db.execute("DELETE FROM container_metrics WHERE timestamp < ?", (cutoff_str,))
    await db.execute("DELETE FROM system_metrics WHERE timestamp < ?", (cutoff_str,))
    await db.execute("DELETE FROM health_checks WHERE timestamp < ?", (cutoff_str,))
    await db.commit()
    logger.info("Cleaned up data older than %s", cutoff_str)
