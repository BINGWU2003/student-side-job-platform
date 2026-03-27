import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('id must be a positive integer'),
});

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type PageQueryParsed = z.infer<typeof pageQuerySchema>;
