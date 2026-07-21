import axios from 'axios';
import { basePath } from '../constants/basePath';

const api = axios.create({
  baseURL: `${basePath}/api/loganalyzer`,
  timeout: 10000,
  withCredentials: true,
});

export interface ContainerErrorItem {
  id: number;
  timestamp: string;
  container_name: string;
  service_group: string;
  severity: string;
  error_type: string | null;
  message: string;
  stack_trace?: string | null;
}

export interface ContainerErrorsResponse {
  container: string;
  since: string | null;
  hours_window: number;
  total: number;
  items: ContainerErrorItem[];
}

export interface LiveErrorsResponse {
  since: string | null;
  hours_window: number;
  total: number;
  severity_counts: { critical: number; high: number; medium: number; low: number };
  items: ContainerErrorItem[];
}

export async function fetchLiveErrors(
  since?: string,
  limit = 30,
): Promise<LiveErrorsResponse> {
  const { data } = await api.get<LiveErrorsResponse>('/live-errors', {
    params: { since, limit },
  });
  return data;
}

export async function fetchContainerErrors(
  container: string,
  since?: string,
  limit = 50,
): Promise<ContainerErrorsResponse> {
  const { data } = await api.get<ContainerErrorsResponse>('/errors', {
    params: { container, since, limit },
  });
  return data;
}
