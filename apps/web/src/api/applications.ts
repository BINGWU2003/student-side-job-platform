import { http } from './index';
import type { ApiResponse, ApplicationItem, PagedData } from '@student-side-job-platform/shared-types';

export async function submitApplication(jobId: number, intro?: string): Promise<ApplicationItem> {
  const res = await http.post<ApiResponse<ApplicationItem>>('/api/applications', { jobId, intro });
  return res.data.data as ApplicationItem;
}

export async function getMyApplications(params: Record<string, unknown>): Promise<PagedData<ApplicationItem>> {
  const res = await http.get<ApiResponse<PagedData<ApplicationItem>>>('/api/applications/my', { params });
  return res.data.data as PagedData<ApplicationItem>;
}

export async function deleteApplication(id: number): Promise<void> {
  await http.delete(`/api/applications/${id}`);
}

export async function getJobApplications(jobId: number, params: Record<string, unknown>): Promise<PagedData<ApplicationItem>> {
  const res = await http.get<ApiResponse<PagedData<ApplicationItem>>>(`/api/employer/jobs/${jobId}/applications`, { params });
  return res.data.data as PagedData<ApplicationItem>;
}

export async function reviewApplication(id: number, action: 'accept' | 'reject'): Promise<ApplicationItem> {
  const res = await http.patch<ApiResponse<ApplicationItem>>(`/api/employer/applications/${id}/review`, { action });
  return res.data.data as ApplicationItem;
}
