import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  username?: string;
  token?: string;
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized: Token missing' });
      return;
    }

    const payload = await verifyToken(token);
    req.userId = payload.sub;
    req.username = payload.username;
    req.token = token;

    next();
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Unauthorized: Token invalid or revoked' });
  }
};
