import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyPin } from '../utils/hash.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, pin } = req.body;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isValid = await verifyPin(pin, user.pinHash);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  res.json({ id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl });
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true });
});
