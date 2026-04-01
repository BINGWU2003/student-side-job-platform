import { http } from './index';
import type {
  ApiResponse,
  PagedData,
  ReviewItem,
  Role,
  UserInfo,
  UserStatus,
} from '@student-side-job-platform/shared-types';

export interface AdminUserDetail extends UserInfo {
  reviews: Array<ReviewItem & { fromUser?: { id: number; username: string; role: Role } }>;
}

export async function getAdminUsers(params: {
  role?: Role;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}): Promise<PagedData<UserInfo>> {
  const res = await http.get<ApiResponse<PagedData<UserInfo>>>('/api/admin/users', { params });
  return res.data.data as PagedData<UserInfo>;
}

export async function getAdminUserDetail(id: number): Promise<AdminUserDetail> {
  const res = await http.get<ApiResponse<AdminUserDetail>>(`/api/admin/users/${id}`);
  return res.data.data as AdminUserDetail;
}

export async function updateAdminUserStatus(id: number, status: UserStatus): Promise<UserInfo> {
  const res = await http.patch<ApiResponse<UserInfo>>(`/api/admin/users/${id}/status`, { status });
  return res.data.data as UserInfo;
}
