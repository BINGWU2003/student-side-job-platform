import { http } from './index';
import type { ApiResponse, AdminLogItem, PagedData } from '@student-side-job-platform/shared-types';

export interface AdminLogRow extends AdminLogItem {
  admin?: { id: number; username: string };
}

export async function getAdminLogs(params: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}): Promise<PagedData<AdminLogRow>> {
  const res = await http.get<ApiResponse<PagedData<AdminLogRow>>>('/api/admin/logs', { params });
  return res.data.data as PagedData<AdminLogRow>;
}
