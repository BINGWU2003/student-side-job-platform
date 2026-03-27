import { z } from 'zod';

export const submitReviewSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export type SubmitReviewBody = z.infer<typeof submitReviewSchema>;
