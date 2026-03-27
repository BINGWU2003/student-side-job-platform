export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

export interface PagedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
