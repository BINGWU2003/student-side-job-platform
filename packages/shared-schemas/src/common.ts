import { z } from 'zod';

/** 整数 ID 路径参数：/api/books/:id */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('id 必须为正整数'),
});

/** 通用分页查询参数 */
export const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type PageQueryParsed = z.infer<typeof pageQuerySchema>;
