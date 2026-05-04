import axios from 'axios';
import type {
  ContainerInfo,
  SystemMetrics,
  HealthCheckResult,
  ContainerMetricsHistory,
  PaginatedHealthChecks,
  GroupSummary,
} from '../types';
import { basePath } from '../constants/basePath';

const api = axios.create({
  baseURL: `${basePath}/api`,
  timeout: 10000,
});

export async function fetchContainers(): Promise<ContainerInfo[]> {
  const { data } = await api.get<ContainerInfo[]>('/containers');
  return data;
}

export async function fetchSystemMetrics(): Promise<SystemMetrics> {
  const { data } = await api.get<SystemMetrics>('/system');
  return data;
}

export async function fetchHealthChecks(): Promise<HealthCheckResult[]> {
  const { data } = await api.get<HealthCheckResult[]>('/healthchecks');
  return data;
}

export async function fetchHealth(): Promise<{ status: string }> {
  const { data } = await api.get('/health');
  return data;
}

export async function fetchContainerMetrics(
  name: string,
  params?: { start?: string; end?: string; interval?: string },
): Promise<ContainerMetricsHistory> {
  const { data } = await api.get<ContainerMetricsHistory>(`/containers/${name}/metrics`, { params });
  return data;
}

export async function fetchContainerHealthchecks(
  name: string,
  params?: { start?: string; end?: string; page?: number; size?: number; status?: string },
): Promise<PaginatedHealthChecks> {
  const { data } = await api.get<PaginatedHealthChecks>(`/containers/${name}/healthchecks`, { params });
  return data;
}

export async function fetchGroupSummary(group: string): Promise<GroupSummary> {
  const { data } = await api.get<GroupSummary>(`/groups/${group}/summary`);
  return data;
}

export async function fetchGroupMetrics(
  group: string,
  params?: { start?: string; end?: string; interval?: string },
): Promise<ContainerMetricsHistory> {
  const { data } = await api.get<ContainerMetricsHistory>(`/groups/${group}/metrics`, { params });
  return data;
}
