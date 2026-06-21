import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginUser, AppError } from '../services/auth.service.js';
import { prisma } from '../config/prisma.js';

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, pin } = req.body;

  try {
    const user = await loginUser(username, pin);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: null }
    });
    res.json(user);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body;
  if (userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() }
      });
    } catch (err) {
      console.error('[auth] logout lastSeenAt update failed:', err);
    }
  }
  res.json({ success: true });
});
