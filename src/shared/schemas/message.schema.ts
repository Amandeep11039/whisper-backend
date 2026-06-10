import { z } from 'zod';

export const SendMessageSchema = z.object({
  content: z.string().max(4000).optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VOICE']),
  mediaUrl: z.string().url().optional(),
}).refine(
  (data) => data.type === 'TEXT' ? !!data.content : !!data.mediaUrl,
  { message: 'Text messages require content; media messages require mediaUrl' }
);

export const EditMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export const PaginationSchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
