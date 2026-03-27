import { http } from './index';
import type { ApiResponse, LoginResponse, RegisterRequest, UserInfo } from '@student-side-job-platform/shared-types';

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await http.post<ApiResponse<LoginResponse>>('/api/auth/login', { username, password });
  return res.data.data as LoginResponse;
}

export async function register(payload: RegisterRequest): Promise<UserInfo> {
  const res = await http.post<ApiResponse<UserInfo>>('/api/auth/register', payload);
  return res.data.data as UserInfo;
}

export async function getMe(): Promise<UserInfo> {
  const res = await http.get<ApiResponse<UserInfo>>('/api/auth/me');
  return res.data.data as UserInfo;
}

export async function updateMe(payload: Record<string, unknown>): Promise<UserInfo> {
  const res = await http.put<ApiResponse<UserInfo>>('/api/auth/me', payload);
  return res.data.data as UserInfo;
}

export async function updatePassword(oldPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
  await http.patch<ApiResponse<null>>('/api/auth/password', { oldPassword, newPassword, confirmPassword });
}
