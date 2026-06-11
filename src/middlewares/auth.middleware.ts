import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.header('x-user-id');

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }     

  try {   
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return; 
    }

    req.user = { id: user.id };
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
