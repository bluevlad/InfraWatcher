TABLES_DDL = [
    """
    CREATE TABLE IF NOT EXISTS container_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        container_name TEXT NOT NULL,
        status TEXT NOT NULL,
        cpu_percent REAL DEFAULT 0,
        memory_usage INTEGER DEFAULT 0,
        memory_limit INTEGER DEFAULT 0,
        memory_percent REAL DEFAULT 0,
        network_rx INTEGER DEFAULT 0,
        network_tx INTEGER DEFAULT 0,
        block_read INTEGER DEFAULT 0,
        block_write INTEGER DEFAULT 0,
        pids INTEGER DEFAULT 0
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS system_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        cpu_percent REAL NOT NULL,
        cpu_count INTEGER NOT NULL,
        memory_total INTEGER NOT NULL,
        memory_used INTEGER NOT NULL,
        memory_percent REAL NOT NULL,
        disk_total INTEGER NOT NULL,
        disk_used INTEGER NOT NULL,
        disk_percent REAL NOT NULL,
        load_avg_1 REAL NOT NULL,
        load_avg_5 REAL NOT NULL,
        load_avg_15 REAL NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS health_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        container_name TEXT NOT NULL,
        health_type TEXT NOT NULL,
        port INTEGER,
        path TEXT,
        status TEXT NOT NULL,
        response_time_ms REAL,
        status_code INTEGER,
        error TEXT
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_container_metrics_ts ON container_metrics(timestamp)",
    "CREATE INDEX IF NOT EXISTS idx_container_metrics_name ON container_metrics(container_name)",
    "CREATE INDEX IF NOT EXISTS idx_container_metrics_name_ts ON container_metrics(container_name, timestamp)",
    "CREATE INDEX IF NOT EXISTS idx_system_metrics_ts ON system_metrics(timestamp)",
    "CREATE INDEX IF NOT EXISTS idx_health_checks_ts ON health_checks(timestamp)",
    "CREATE INDEX IF NOT EXISTS idx_health_checks_name ON health_checks(container_name)",
    "CREATE INDEX IF NOT EXISTS idx_health_checks_name_ts ON health_checks(container_name, timestamp)",
    """
    CREATE TABLE IF NOT EXISTS container_metrics_hourly (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        container_name TEXT NOT NULL,
        hour_timestamp TEXT NOT NULL,
        avg_cpu_percent REAL DEFAULT 0,
        max_cpu_percent REAL DEFAULT 0,
        min_cpu_percent REAL DEFAULT 0,
        avg_memory_percent REAL DEFAULT 0,
        max_memory_percent REAL DEFAULT 0,
        avg_memory_usage INTEGER DEFAULT 0,
        avg_network_rx INTEGER DEFAULT 0,
        avg_network_tx INTEGER DEFAULT 0,
        sample_count INTEGER DEFAULT 0
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS system_metrics_hourly (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hour_timestamp TEXT NOT NULL,
        avg_cpu_percent REAL DEFAULT 0,
        max_cpu_percent REAL DEFAULT 0,
        avg_memory_percent REAL DEFAULT 0,
        max_memory_percent REAL DEFAULT 0,
        avg_disk_percent REAL DEFAULT 0,
        avg_load_avg_1 REAL DEFAULT 0,
        sample_count INTEGER DEFAULT 0
    )
    """,
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_container_metrics_hourly_name_ts ON container_metrics_hourly(container_name, hour_timestamp)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_system_metrics_hourly_ts ON system_metrics_hourly(hour_timestamp)",
]
