export type Role = 'ADMIN' | 'EMPLOYER' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface UserBase {
  id: number;
  username: string;
  phone: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: number;
  userId: number;
  realName: string | null;
  studentNo: string | null;
  school: string | null;
  major: string | null;
}

export interface EmployerProfile {
  id: number;
  userId: number;
  companyName: string | null;
  contactName: string | null;
  description: string | null;
}
