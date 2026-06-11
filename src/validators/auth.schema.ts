import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1).max(30).regex(/^[a-zA-Z0-9_]+$/),
  pin: z.string().length(6).regex(/^\d{6}$/),
});
