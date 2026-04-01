import { http } from './index';
import type { ApiResponse, AnnouncementItem } from '@student-side-job-platform/shared-types';

export async function getAdminAnnouncements(): Promise<AnnouncementItem[]> {
  const res = await http.get<ApiResponse<AnnouncementItem[]>>('/api/admin/announcements');
  return res.data.data as AnnouncementItem[];
}

export async function createAdminAnnouncement(payload: {
  title: string;
  content: string;
  isPinned?: boolean;
}): Promise<AnnouncementItem> {
  const res = await http.post<ApiResponse<AnnouncementItem>>('/api/admin/announcements', payload);
  return res.data.data as AnnouncementItem;
}

export async function updateAdminAnnouncement(
  id: number,
  payload: {
    title: string;
    content: string;
    isPinned?: boolean;
  }
): Promise<AnnouncementItem> {
  const res = await http.put<ApiResponse<AnnouncementItem>>(
    `/api/admin/announcements/${id}`,
    payload
  );
  return res.data.data as AnnouncementItem;
}

export async function deleteAdminAnnouncement(id: number): Promise<void> {
  await http.delete(`/api/admin/announcements/${id}`);
}
