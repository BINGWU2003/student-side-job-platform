import { http } from './index';
import type {
  ApiResponse,
  CmplStatus,
  ComplaintItem,
  PagedData,
} from '@student-side-job-platform/shared-types';

export interface AdminComplaintItem extends ComplaintItem {
  job?: { id: number; title: string; status: string; employerId: number };
  student?: {
    id: number;
    username: string;
    phone: string;
    studentProfile?: {
      realName: string | null;
      studentNo: string | null;
      school: string | null;
      major: string | null;
    } | null;
  };
}

export async function getAdminComplaints(params: {
  status?: CmplStatus;
  page?: number;
  pageSize?: number;
}): Promise<PagedData<AdminComplaintItem>> {
  const res = await http.get<ApiResponse<PagedData<AdminComplaintItem>>>('/api/admin/complaints', {
    params,
  });
  return res.data.data as PagedData<AdminComplaintItem>;
}

export async function handleAdminComplaint(
  id: number,
  payload: { status: 'RESOLVED' | 'DISMISSED'; note?: string; closeJob?: boolean }
): Promise<AdminComplaintItem> {
  const res = await http.patch<ApiResponse<AdminComplaintItem>>(
    `/api/admin/complaints/${id}/handle`,
    payload
  );
  return res.data.data as AdminComplaintItem;
}
