import { z } from 'zod';

export const submitApplicationSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  intro: z.string().max(2000).optional(),
});

export const reviewApplicationSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

export type SubmitApplicationBody = z.infer<typeof submitApplicationSchema>;
export type ReviewApplicationBody = z.infer<typeof reviewApplicationSchema>;
