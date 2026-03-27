import type { EmployerProfile } from './user';

export type JobType = 'PROMOTION' | 'TUTORING' | 'EVENT' | 'CATERING' | 'OTHER';
export type SalaryType = 'HOURLY' | 'TOTAL';
export type JobStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';

export interface JobItem {
  id: number;
  title: string;
  type: JobType;
  description: string;
  location: string;
  salary: number;
  salaryType: SalaryType;
  headcount: number;
  startDate: string;
  endDate: string;
  deadline: string;
  requirement: string | null;
  status: JobStatus;
  rejectReason: string | null;
  employerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobDetail extends JobItem {
  employer?: {
    id: number;
    username: string;
    phone: string;
    profile: EmployerProfile | null;
  };
  acceptedCount?: number;
  hasApplied?: boolean;
  isFavorited?: boolean;
}

export interface JobListQuery {
  type?: JobType;
  location?: string;
  sort?: 'latest' | 'oldest';
  page?: number;
  pageSize?: number;
}
