import axios from 'axios';
import { basePath } from '../constants/basePath';

const api = axios.create({
  baseURL: `${basePath}/api/loganalyzer`,
  timeout: 10000,
  withCredentials: true,
});

export interface IntegrationSummary {
  github: { issued_count: number; auto_trigger: string; note: string };
  qa_dashboard: { pending_open_count: number };
  standup: { pending_resolved_count: number };
  totals: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total_errors: number;
  };
}

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

export interface IntegrationActionResult {
  status: string; // 'sent' | 'no_data' | 'failed'
  groups_count?: number;
  message?: string;
}

export async function fetchIntegrationSummary(): Promise<IntegrationSummary> {
  const { data } = await api.get<IntegrationSummary>('/integration-summary');
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

export async function pushQaDashboard(): Promise<IntegrationActionResult> {
  const { data } = await api.post<IntegrationActionResult>('/qa-push');
  return data;
}

export async function reportStandup(): Promise<IntegrationActionResult> {
  const { data } = await api.post<IntegrationActionResult>('/standup-report');
  return data;
}
