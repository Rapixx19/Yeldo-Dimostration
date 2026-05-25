import { api } from './client';
import type { AuthResponse } from '../types/auth';

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
  return data;
}

export async function signupRequest(
  email: string,
  password: string,
  name: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/signup', { email, password, name });
  return data;
}

export async function demoLoginRequest(): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/demo-login', {});
  return data;
}
