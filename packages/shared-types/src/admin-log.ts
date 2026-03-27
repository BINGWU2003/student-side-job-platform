export interface AdminLogItem {
  id: number;
  adminId: number;
  action: string;
  targetId: number | null;
  targetType: string | null;
  note: string | null;
  createdAt: string;
}
