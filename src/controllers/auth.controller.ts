import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginUser, AppError } from '../services/auth.service.js';

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, pin } = req.body;

  try {
    const user = await loginUser(username, pin);
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
  res.json({ success: true });
});
