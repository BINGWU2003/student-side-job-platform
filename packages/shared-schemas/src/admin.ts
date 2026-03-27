import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'DISABLED']),
});

export type UpdateUserStatusBody = z.infer<typeof updateUserStatusSchema>;
