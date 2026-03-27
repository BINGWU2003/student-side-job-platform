import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(10000),
  isPinned: z.boolean().optional(),
});

export type CreateAnnouncementBody = z.infer<typeof createAnnouncementSchema>;
