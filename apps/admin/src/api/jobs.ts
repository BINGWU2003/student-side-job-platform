import { http } from './index';
import type { ApiResponse, JobItem, JobStatus, PagedData } from '@student-side-job-platform/shared-types';

export interface AdminJobItem extends JobItem {
  employer?: {
    id: number;
    username: string;
    phone: string;
    status?: 'ACTIVE' | 'DISABLED';
    employerProfile?: {
      companyName: string | null;
      contactName: string | null;
      description: string | null;
    } | null;
  };
}

export async function getAdminJobs(params: {
  status?: JobStatus;
  page?: number;
  pageSize?: number;
}): Promise<PagedData<AdminJobItem>> {
  const res = await http.get<ApiResponse<PagedData<AdminJobItem>>>('/api/admin/jobs', { params });
  return res.data.data as PagedData<AdminJobItem>;
}

export async function getAdminJob(id: number): Promise<AdminJobItem> {
  const res = await http.get<ApiResponse<AdminJobItem>>(`/api/admin/jobs/${id}`);
  return res.data.data as AdminJobItem;
}

export async function reviewAdminJob(id: number, payload: { action: 'approve' | 'reject'; reason?: string }): Promise<AdminJobItem> {
  const res = await http.patch<ApiResponse<AdminJobItem>>(`/api/admin/jobs/${id}/review`, payload);
  return res.data.data as AdminJobItem;
}
