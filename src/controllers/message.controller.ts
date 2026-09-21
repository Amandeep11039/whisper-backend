import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { prisma } from '../config/prisma.js';

export const getUnreadMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastReadAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const whereClause: any = {
      senderId: { not: userId },
    };

    if (user.lastReadAt) {
      whereClause.createdAt = {
        gt: user.lastReadAt,
      };
    }

    const unreadMessages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderId: true,
        content: true,
        createdAt: true,
      },
    });

    res.json({ messages: unreadMessages });
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    res.status(500).json({ error: 'Failed to fetch unread messages' });
  }
};

export const getSentPendingMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // In this 2-person chat, the "other" user is anyone who is not the current user
    const otherUser = await prisma.user.findFirst({
      where: { id: { not: userId } },
      select: { lastReadAt: true },
    });

    const whereClause: any = { senderId: userId };

    // Only include messages that the other user has NOT yet read
    if (otherUser?.lastReadAt) {
      whereClause.createdAt = { gt: otherUser.lastReadAt };
    }
    // If otherUser.lastReadAt is null they have never read anything -> return all sent messages

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderId: true,
        content: true,
        createdAt: true,
      },
    });

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching sent-pending messages:', error);
    res.status(500).json({ error: 'Failed to fetch sent-pending messages' });
  }
};

