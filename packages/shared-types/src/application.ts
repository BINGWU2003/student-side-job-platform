export type AppStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ApplicationItem {
  id: number;
  jobId: number;
  studentId: number;
  intro: string | null;
  status: AppStatus;
  createdAt: string;
  updatedAt: string;
  hasReviewed?: boolean;
}
