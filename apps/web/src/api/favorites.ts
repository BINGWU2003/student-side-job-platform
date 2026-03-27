import { http } from './index';
import type { ApiResponse, JobItem, PagedData } from '@student-side-job-platform/shared-types';

export async function addFavorite(jobId: number): Promise<void> {
  await http.post(`/api/favorites/${jobId}`);
}

export async function removeFavorite(jobId: number): Promise<void> {
  await http.delete(`/api/favorites/${jobId}`);
}

export async function getMyFavorites(params: Record<string, unknown>): Promise<PagedData<{ job: JobItem }>> {
  const res = await http.get<ApiResponse<PagedData<{ job: JobItem }>>>('/api/favorites/my', { params });
  return res.data.data as PagedData<{ job: JobItem }>;
}
