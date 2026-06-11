import { Request, Response } from 'express';
import type { z } from 'zod';
import type { PaginationSchema, SendMessageSchema, EditMessageSchema } from '../validators/message.schema.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as msgService from '../services/messages.service.js';
import { AppError } from '../services/auth.service.js';

export const getMessages = asyncHandler(async (
  req: Request<{}, {}, {}, z.infer<typeof PaginationSchema>>,
  res: Response
): Promise<void> => {
  const { cursor, limit } = req.query;
  const data = await msgService.fetchMessages(limit, cursor);
  res.json(data);
});

export const sendMessage = asyncHandler(async (
  req: Request<{}, {}, z.infer<typeof SendMessageSchema>>,
  res: Response
): Promise<void> => {
  const senderId = req.user!.id;
  const { content, type, mediaUrl } = req.body;

  const message = await msgService.sendMessage(senderId, content, type, mediaUrl);
  res.status(201).json(message);
});

export const editMessage = asyncHandler(async (
  req: Request<{ id: string }, {}, z.infer<typeof EditMessageSchema>>,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const updated = await msgService.editMessage(id, userId, req.body.content);
    res.json(updated);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});

export const deleteMessage = asyncHandler(async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    await msgService.deleteMessage(id, userId);
    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});

export const markSeen = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const seenAt = await msgService.markSeen(userId);
  res.json({ success: true, seenAt });
});
