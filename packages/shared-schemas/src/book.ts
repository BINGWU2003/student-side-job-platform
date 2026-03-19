import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().min(1, '书名不能为空').max(200, '书名最多200个字符'),
  author: z.string().min(1, '作者不能为空').max(100, '作者最多100个字符'),
  isbn: z.string().max(20, 'ISBN最多20个字符').optional(),
  description: z.string().max(2000, '简介最多2000个字符').optional(),
  price: z.number().min(0, '价格不能为负数').nullable().optional(),
  publishedAt: z.string().nullable().optional(),
});

export const updateBookSchema = createBookSchema.partial();

export const bookListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
  title: z.string().optional(),
  author: z.string().optional(),
});

export type CreateBookBody = z.infer<typeof createBookSchema>;
export type UpdateBookBody = z.infer<typeof updateBookSchema>;
export type BookListQueryParsed = z.infer<typeof bookListQuerySchema>;
