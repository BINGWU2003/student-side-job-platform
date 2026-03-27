import { http } from './index';
import type { ApiResponse, ReviewItem } from '@student-side-job-platform/shared-types';

export async function submitReview(payload: {
  applicationId: number;
  rating: number;
  comment?: string;
}): Promise<ReviewItem> {
  const res = await http.post<ApiResponse<ReviewItem>>('/api/reviews', payload);
  return res.data.data as ReviewItem;
}

export async function getUserReviews(userId: number): Promise<ReviewItem[]> {
  const res = await http.get<ApiResponse<ReviewItem[]>>(`/api/reviews/user/${userId}`);
  return res.data.data as ReviewItem[];
}
