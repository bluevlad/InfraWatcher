export interface ContainerInfo {
  name: string;
  group: string;
  status: string;
  image: string;
  created: string;
  started_at: string;
  uptime: string;
  cpu_percent: number;
  memory_usage: number;
  memory_limit: number;
  memory_percent: number;
  network_rx: number;
  network_tx: number;
  block_read: number;
  block_write: number;
  pids: number;
  ports: string[];
}

export interface SystemMetrics {
  cpu_percent: number;
  cpu_count: number;
  memory_total: number;
  memory_used: number;
  memory_percent: number;
  disk_total: number;
  disk_used: number;
  disk_percent: number;
  load_avg_1: number;
  load_avg_5: number;
  load_avg_15: number;
  boot_time: string;
  uptime: string;
}

export interface HealthCheckResult {
  container_name: string;
  group: string;
  health_type: string;
  port: number | null;
  path: string | null;
  status: string;
  response_time_ms: number | null;
  status_code: number | null;
  error: string | null;
  checked_at: string;
}

export interface DashboardSummary {
  total_containers: number;
  running_containers: number;
  stopped_containers: number;
  healthy_services: number;
  unhealthy_services: number;
  unknown_services: number;
  total_cpu_percent: number;
  total_memory_percent: number;
}

export interface DashboardSnapshot {
  timestamp: string;
  system: SystemMetrics;
  containers: ContainerInfo[];
  health_checks: HealthCheckResult[];
  summary: DashboardSummary;
}

export interface WSMessage {
  type: string;
  data: DashboardSnapshot;
}

export interface ContainerMetricPoint {
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  memory_usage: number;
  network_rx: number;
  network_tx: number;
}

export interface ContainerMetricsHistory {
  container_name: string;
  start: string;
  end: string;
  interval: string;
  data: ContainerMetricPoint[];
}

export interface HealthCheckHistoryItem {
  id: number;
  timestamp: string;
  container_name: string;
  health_type: string;
  port: number | null;
  path: string | null;
  status: string;
  response_time_ms: number | null;
  status_code: number | null;
  error: string | null;
}

export interface PaginatedHealthChecks {
  items: HealthCheckHistoryItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface GroupSummary {
  group: string;
  container_count: number;
  running_count: number;
  stopped_count: number;
  healthy_count: number;
  unhealthy_count: number;
  total_cpu_percent: number;
  total_memory_percent: number;
}
