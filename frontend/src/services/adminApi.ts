import axios from 'axios';
import { basePath } from '../constants/basePath';

const adminApi = axios.create({
  baseURL: `${basePath}/api/admin`,
  timeout: 30000, // start/restart는 평균 1-5초, 보수적으로 30초
  withCredentials: true,
});

export interface ActionResult {
  ok: boolean;
  action: 'start' | 'restart';
  container: string;
  status: string | null;
  duration_ms: number;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  user_email: string;
  action: string;
  container_name: string;
  success: boolean;
  error: string | null;
  duration_ms: number;
}

export async function startContainer(name: string): Promise<ActionResult> {
  const { data } = await adminApi.post<ActionResult>(
    `/containers/${encodeURIComponent(name)}/start`,
  );
  return data;
}

export async function restartContainer(name: string): Promise<ActionResult> {
  const { data } = await adminApi.post<ActionResult>(
    `/containers/${encodeURIComponent(name)}/restart`,
  );
  return data;
}

export async function fetchAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  const { data } = await adminApi.get<AuditLogEntry[]>('/audit-log', { params: { limit } });
  return data;
}
