from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ContainerInfo(BaseModel):
    name: str
    group: str
    status: str  # running, stopped, paused, etc.
    image: str
    created: str
    started_at: str
    uptime: str
    cpu_percent: float
    memory_usage: int  # bytes
    memory_limit: int  # bytes
    memory_percent: float
    network_rx: int  # bytes
    network_tx: int  # bytes
    block_read: int  # bytes
    block_write: int  # bytes
    pids: int
    ports: list[str]


class SystemMetrics(BaseModel):
    cpu_percent: float
    cpu_count: int
    memory_total: int
    memory_used: int
    memory_percent: float
    disk_total: int
    disk_used: int
    disk_percent: float
    load_avg_1: float
    load_avg_5: float
    load_avg_15: float
    boot_time: str
    uptime: str


class HealthCheckResult(BaseModel):
    container_name: str
    group: str
    health_type: str
    port: int | None
    path: str | None
    status: str  # healthy, unhealthy, unknown
    response_time_ms: float | None
    status_code: int | None
    error: str | None
    checked_at: str


class DashboardSnapshot(BaseModel):
    timestamp: str
    system: SystemMetrics
    containers: list[ContainerInfo]
    health_checks: list[HealthCheckResult]
    summary: DashboardSummary


class DashboardSummary(BaseModel):
    total_containers: int
    running_containers: int
    stopped_containers: int
    healthy_services: int
    unhealthy_services: int
    unknown_services: int
    total_cpu_percent: float
    total_memory_percent: float


# Fix forward reference
DashboardSnapshot.model_rebuild()


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    timestamp: str


class ContainerMetricPoint(BaseModel):
    timestamp: str
    cpu_percent: float
    memory_percent: float
    memory_usage: int
    network_rx: int
    network_tx: int


class ContainerMetricsHistory(BaseModel):
    container_name: str
    start: str
    end: str
    interval: str
    data: list[ContainerMetricPoint]


class HealthCheckHistoryItem(BaseModel):
    id: int
    timestamp: str
    container_name: str
    health_type: str
    port: int | None
    path: str | None
    status: str
    response_time_ms: float | None
    status_code: int | None
    error: str | None


class PaginatedHealthChecks(BaseModel):
    items: list[HealthCheckHistoryItem]
    total: int
    page: int
    size: int
    pages: int


class GroupSummary(BaseModel):
    group: str
    container_count: int
    running_count: int
    stopped_count: int
    healthy_count: int
    unhealthy_count: int
    total_cpu_percent: float
    total_memory_percent: float
