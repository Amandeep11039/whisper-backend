import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

type Target = 'body' | 'query' | 'params';

export function validate<T>(schema: ZodSchema<T>, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      res.status(422).json({ 
        error: 'Validation failed', 
        issues: result.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        }))
      });
      return;
    }
    req[target] = result.data;
    next();
  };
}
