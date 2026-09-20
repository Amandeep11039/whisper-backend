import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { prisma } from '../config/prisma.js';

export const markRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const now = new Date();

    await prisma.user.update({
      where: { id: userId },
      data: { lastReadAt: now },
    });

    res.json({ success: true, lastReadAt: now });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to update read status' });
  }
};
