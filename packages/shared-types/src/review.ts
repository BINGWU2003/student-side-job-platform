export interface ReviewItem {
  id: number;
  applicationId: number;
  fromUserId: number;
  toUserId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}
