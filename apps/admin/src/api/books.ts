import { http } from './index';
import type { ApiResponse, PageResult } from '@student-side-job-platform/shared';
import type {
  Book,
  BookListQuery,
  CreateBookRequest,
  UpdateBookRequest,
} from '@student-side-job-platform/shared-types';

export type { Book, BookListQuery, CreateBookRequest, UpdateBookRequest };

export async function getBooks(params?: BookListQuery): Promise<PageResult<Book>> {
  const res = await http.get<ApiResponse<PageResult<Book>>>('/api/books', { params });
  return res.data.data;
}

export async function getBook(id: number): Promise<Book> {
  const res = await http.get<ApiResponse<Book>>(`/api/books/${id}`);
  return res.data.data;
}

export async function createBook(data: CreateBookRequest): Promise<Book> {
  const res = await http.post<ApiResponse<Book>>('/api/books', data);
  return res.data.data;
}

export async function updateBook(id: number, data: UpdateBookRequest): Promise<Book> {
  const res = await http.put<ApiResponse<Book>>(`/api/books/${id}`, data);
  return res.data.data;
}

export async function deleteBook(id: number): Promise<void> {
  await http.delete(`/api/books/${id}`);
}
