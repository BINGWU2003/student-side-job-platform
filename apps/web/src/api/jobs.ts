import { http } from './index';
import type {
  ApiResponse,
  JobDetail,
  JobItem,
  JobListQuery,
  PagedData,
} from '@student-side-job-platform/shared-types';

export async function getJobList(params: JobListQuery): Promise<PagedData<JobItem>> {
  const res = await http.get<ApiResponse<PagedData<JobItem>>>('/api/jobs', { params });
  return res.data.data as PagedData<JobItem>;
}

export async function getJobDetail(id: number): Promise<JobDetail> {
  const res = await http.get<ApiResponse<JobDetail>>(`/api/jobs/${id}`);
  return res.data.data as JobDetail;
}

export async function createJob(payload: Record<string, unknown>): Promise<JobItem> {
  const res = await http.post<ApiResponse<JobItem>>('/api/jobs', payload);
  return res.data.data as JobItem;
}

export async function getEmployerJobs(
  params: Record<string, unknown>
): Promise<PagedData<JobItem>> {
  const res = await http.get<ApiResponse<PagedData<JobItem>>>('/api/employer/jobs', { params });
  return res.data.data as PagedData<JobItem>;
}

export async function getEmployerJob(id: number): Promise<JobItem> {
  const res = await http.get<ApiResponse<JobItem>>(`/api/employer/jobs/${id}`);
  return res.data.data as JobItem;
}

export async function updateEmployerJob(
  id: number,
  payload: Record<string, unknown>
): Promise<JobItem> {
  const res = await http.put<ApiResponse<JobItem>>(`/api/employer/jobs/${id}`, payload);
  return res.data.data as JobItem;
}

export async function closeEmployerJob(id: number): Promise<JobItem> {
  const res = await http.patch<ApiResponse<JobItem>>(`/api/employer/jobs/${id}/close`);
  return res.data.data as JobItem;
}
