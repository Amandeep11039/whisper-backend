import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { prisma } from '../config/prisma.js';
import { getIO } from '../config/socket.js';

export const markRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const now = new Date();

    await prisma.user.update({
      where: { id: userId },
      data: { lastReadAt: now },
    });

    // Delete messages that were sent TO this user (by others) and are now read.
    // Since this is a 2-person chat, "sent by others" = senderId !== userId.
    await prisma.message.deleteMany({
      where: {
        senderId: { not: userId },
        createdAt: { lte: now },
      },
    });

    // Notify all connected clients in the chat room that this user has read up to `now`.
    // The sender's client listens for this event to clear their own sent-but-unread messages from the UI.
    try {
      const io = getIO();
      io.to('chat').emit('partner_read', { readAt: now.toISOString(), readerId: userId });
    } catch {
      // Socket may not be initialised in test environments; swallow safely
    }

    res.json({ success: true, lastReadAt: now });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to update read status' });
  }
};
