export type CmplType = 'FAKE_INFO' | 'ILLEGAL_CONTENT' | 'OTHER';
export type CmplStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface ComplaintItem {
  id: number;
  jobId: number;
  studentId: number;
  type: CmplType;
  description: string;
  status: CmplStatus;
  handleNote: string | null;
  createdAt: string;
  updatedAt: string;
}
