import axios from 'axios';
import { basePath } from '../constants/basePath';

const authApi = axios.create({
  baseURL: `${basePath}/api/auth`,
  timeout: 10000,
  withCredentials: true,
});

export interface AuthUser {
  email: string;
  name: string;
  picture: string;
  is_admin: boolean;
}

export async function verifyGoogleCredential(credential: string): Promise<AuthUser> {
  const { data } = await authApi.post<AuthUser>('/google/verify', { credential });
  return data;
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const { data } = await authApi.get<AuthUser>('/me');
    return data;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await authApi.post('/logout');
}

export async function fetchAuthConfig(): Promise<{ google_client_id: string }> {
  const { data } = await authApi.get<{ google_client_id: string }>('/config');
  return data;
}
