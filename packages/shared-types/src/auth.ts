import type { EmployerProfile, Role, StudentProfile, UserBase, UserStatus } from './user';

export interface UserInfo extends UserBase {
  phone: string;
  role: Role;
  status: UserStatus;
  studentProfile?: StudentProfile | null;
  employerProfile?: EmployerProfile | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export interface RegisterBaseRequest {
  username: string;
  phone: string;
  password: string;
  role: 'STUDENT' | 'EMPLOYER';
}

export interface StudentRegisterRequest extends RegisterBaseRequest {
  role: 'STUDENT';
  realName?: string;
  studentNo?: string;
  school?: string;
  major?: string;
}

export interface EmployerRegisterRequest extends RegisterBaseRequest {
  role: 'EMPLOYER';
  companyName?: string;
  contactName?: string;
  description?: string;
}

export type RegisterRequest = StudentRegisterRequest | EmployerRegisterRequest;
export type RegisterResponse = UserInfo;
