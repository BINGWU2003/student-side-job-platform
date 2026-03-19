import { http } from './index';
import type { ApiResponse } from '@bingwu-my-monorepo/shared';
import type { UserInfo, LoginResponse } from '@bingwu-my-monorepo/shared-types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await http.post<ApiResponse<LoginResponse>>('/api/auth/login', { email, password });
  return res.data.data;
}

export async function register(
  email: string,
  username: string,
  password: string
): Promise<UserInfo> {
  const res = await http.post<ApiResponse<UserInfo>>('/api/auth/register', {
    email,
    username,
    password,
  });
  return res.data.data;
}
