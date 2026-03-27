import { http } from './index';
import type { ApiResponse, LoginResponse } from '@student-side-job-platform/shared-types';

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await http.post<ApiResponse<LoginResponse>>('/api/auth/login', { username, password });
  return res.data.data as LoginResponse;
}
