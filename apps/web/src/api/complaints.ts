import { http } from './index';
import type { ApiResponse, ComplaintItem, PagedData } from '@student-side-job-platform/shared-types';

export async function submitComplaint(payload: {
  jobId: number;
  type: 'FAKE_INFO' | 'ILLEGAL_CONTENT' | 'OTHER';
  description: string;
}): Promise<ComplaintItem> {
  const res = await http.post<ApiResponse<ComplaintItem>>('/api/complaints', payload);
  return res.data.data as ComplaintItem;
}

export async function getMyComplaints(params: Record<string, unknown>): Promise<PagedData<ComplaintItem>> {
  const res = await http.get<ApiResponse<PagedData<ComplaintItem>>>('/api/complaints/my', { params });
  return res.data.data as PagedData<ComplaintItem>;
}
