import { http } from './index';
import type { ApiResponse } from '@student-side-job-platform/shared-types';

export interface DashboardData {
  users: { total: number; students: number; employers: number };
  jobs: { total: number; pending: number; approved: number; rejected: number; closed: number };
  applications: { total: number; pending: number; accepted: number; rejected: number };
  chart: {
    users: { dates: string[]; counts: number[] };
    jobs: { dates: string[]; counts: number[] };
  };
}

export async function getDashboard(): Promise<DashboardData> {
  const res = await http.get<ApiResponse<DashboardData>>('/api/admin/dashboard');
  return res.data.data as DashboardData;
}
