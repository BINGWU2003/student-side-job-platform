import { z } from 'zod';

export const complaintTypeSchema = z.enum(['FAKE_INFO', 'ILLEGAL_CONTENT', 'OTHER']);
export const complaintStatusSchema = z.enum(['PENDING', 'RESOLVED', 'DISMISSED']);

export const submitComplaintSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  type: complaintTypeSchema,
  description: z.string().min(1).max(2000),
});

export const handleComplaintSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']),
  closeJob: z.boolean().optional(),
  note: z.string().max(1000).optional(),
});

export type SubmitComplaintBody = z.infer<typeof submitComplaintSchema>;
export type HandleComplaintBody = z.infer<typeof handleComplaintSchema>;
