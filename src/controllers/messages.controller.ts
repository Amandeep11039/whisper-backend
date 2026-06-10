import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { z } from 'zod';
import type { PaginationSchema, SendMessageSchema, EditMessageSchema } from '../shared/schemas/message.schema.js';

import { getIO } from '../lib/socket.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMessages = asyncHandler(async (
  req: Request<{}, {}, {}, z.infer<typeof PaginationSchema>>,
  res: Response
): Promise<void> => {
  const { cursor, limit } = req.query;

  const messages = await prisma.message.findMany({
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = messages.length > limit;
  const data = hasMore ? messages.slice(0, limit) : messages;

  res.json({
    messages: data.reverse(),
    nextCursor: hasMore ? data[0]?.id : null,
  });
});

export const sendMessage = asyncHandler(async (
  req: Request<{}, {}, z.infer<typeof SendMessageSchema>>,
  res: Response
): Promise<void> => {
  const senderId = req.user!.id;
  const { content, type, mediaUrl } = req.body;

  const message = await prisma.message.create({
    data: { senderId, content, type, mediaUrl },
  });

  getIO().emit('message:new', message);

  res.status(201).json(message);
});

export const editMessage = asyncHandler(async (
  req: Request<{ id: string }, {}, z.infer<typeof EditMessageSchema>>,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const existing = await prisma.message.findUnique({ where: { id } });

  if (!existing || existing.senderId !== userId) {
    res.status(403).json({ error: 'Cannot edit this message' });
    return;
  }

  if (existing.isDeleted) {
    res.status(410).json({ error: 'Message has been deleted' });
    return;
  }

  const updated = await prisma.message.update({
    where: { id },
    data: { content: req.body.content, isEdited: true, editedAt: new Date() },
  });

  getIO().emit('message:edited', { id: updated.id, content: updated.content, editedAt: updated.editedAt });

  res.json(updated);
});

export const deleteMessage = asyncHandler(async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const existing = await prisma.message.findUnique({ where: { id } });

  if (!existing || existing.senderId !== userId) {
    res.status(403).json({ error: 'Cannot delete this message' });
    return;
  }

  const deleted = await prisma.message.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  getIO().emit('message:deleted', { id: deleted.id, deletedAt: deleted.deletedAt });

  res.json({ success: true });
});

export const markSeen = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const now = new Date();
  
  try {
    await prisma.message.updateMany({
      where: {
        senderId: { not: userId },
        seenAt: null
      },
      data: {
        seenAt: now
      }
    });
  } catch (err: any) {
    if (err.code === 'P2020' || err.message?.includes('database is locked')) {
      console.warn('[messages.controller] Ignored SQLite lock on markSeen');
    } else {
      throw err;
    }
  }

  getIO().emit('messages:seen', { seenAt: now.toISOString() });

  res.json({ success: true, seenAt: now.toISOString() });
});
