// ─── 用户信息 ──────────────────────────────────────────────────────────────────

export interface UserInfo {
  id: number;
  email: string;
  username: string;
  role: string;
}

// ─── 登录 ──────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

// ─── 注册 ──────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export type RegisterResponse = UserInfo;
