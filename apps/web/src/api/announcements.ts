import { http } from './index';
import type { AnnouncementItem, ApiResponse } from '@student-side-job-platform/shared-types';

export async function getAnnouncements(): Promise<AnnouncementItem[]> {
  const res = await http.get<ApiResponse<AnnouncementItem[]>>('/api/announcements');
  return res.data.data as AnnouncementItem[];
}

export async function getAnnouncementDetail(id: number): Promise<AnnouncementItem> {
  const res = await http.get<ApiResponse<AnnouncementItem>>(`/api/announcements/${id}`);
  return res.data.data as AnnouncementItem;
}
