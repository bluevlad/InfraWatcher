import axios from 'axios';
import type { ContainerInfo, SystemMetrics, HealthCheckResult } from '../types';

const api = axios.create({
  baseURL: '/api',
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
