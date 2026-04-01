import { z } from 'zod';

export const jobTypeSchema = z.enum(['PROMOTION', 'TUTORING', 'EVENT', 'CATERING', 'OTHER']);
export const salaryTypeSchema = z.enum(['HOURLY', 'TOTAL']);
export const jobStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CLOSED']);

const jobFields = {
  title: z.string().min(1).max(100),
  type: jobTypeSchema,
  description: z.string().min(1).max(5000),
  location: z.string().min(1).max(200),
  salary: z.number().positive(),
  salaryType: salaryTypeSchema,
  headcount: z.number().int().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  deadline: z.coerce.date(),
  requirement: z.string().max(2000).optional(),
} satisfies z.ZodRawShape;

const createJobBaseSchema = z
  .object(jobFields)
  .refine((data) => data.endDate >= data.startDate, {
    path: ['endDate'],
    message: 'endDate must be greater than or equal to startDate',
  })
  .refine((data) => data.deadline <= data.startDate, {
    path: ['deadline'],
    message: 'deadline must be before or equal to startDate',
  });

export const createJobSchema = createJobBaseSchema;

export const updateJobSchema = z
  .object(jobFields)
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field is required',
      });
      return;
    }

    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate must be greater than or equal to startDate',
      });
    }

    if (data.deadline && data.startDate && data.deadline > data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['deadline'],
        message: 'deadline must be before or equal to startDate',
      });
    }
  });

export const reviewJobSchema = z
  .object({
    action: z.enum(['approve', 'reject']),
    reason: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'reject' && (!data.reason || data.reason.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'reason is required when rejecting a job',
      });
    }
  });

export const jobListQuerySchema = z.object({
  type: jobTypeSchema.optional(),
  location: z.string().max(200).optional(),
  sort: z.enum(['latest', 'oldest']).optional().default('latest'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateJobBody = z.infer<typeof createJobSchema>;
export type UpdateJobBody = z.infer<typeof updateJobSchema>;
export type ReviewJobBody = z.infer<typeof reviewJobSchema>;
export type JobListQueryParsed = z.infer<typeof jobListQuerySchema>;
