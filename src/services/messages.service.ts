import * as repo from '../repositories/messages.repository.js';
import { getIO } from '../config/socket.js';
import { AppError } from './auth.service.js';

export const fetchMessages = async (limit: number, cursor?: string) => {
  const messages = await repo.getMessages(limit, cursor);
  const hasMore = messages.length > limit;
  const data = hasMore ? messages.slice(0, limit) : messages;

  return {
    messages: data.reverse(),
    nextCursor: hasMore ? data[0]?.id : null,
  };
};

export const sendMessage = async (senderId: string, content: string | undefined, type: 'TEXT' | 'IMAGE' | 'VOICE', mediaUrl?: string) => {
  const message = await repo.createMessage({ 
    senderId, 
    content: content ?? null, 
    type, 
    mediaUrl: mediaUrl ?? null 
  });
  getIO().emit('message:new', message);
  return message;
};

export const editMessage = async (id: string, userId: string, content: string) => {
  const existing = await repo.getMessageById(id);

  if (!existing || existing.senderId !== userId) {
    throw new AppError(403, 'Cannot edit this message');
  }

  if (existing.isDeleted) {
    throw new AppError(410, 'Message has been deleted');
  }

  const updated = await repo.updateMessage(id, { content, isEdited: true, editedAt: new Date() });
  getIO().emit('message:edited', { id: updated.id, content: updated.content, editedAt: updated.editedAt });
  return updated;
};

export const deleteMessage = async (id: string, userId: string) => {
  const existing = await repo.getMessageById(id);

  if (!existing || existing.senderId !== userId) {
    throw new AppError(403, 'Cannot delete this message');
  }

  const deleted = await repo.updateMessage(id, { isDeleted: true, deletedAt: new Date() });
  getIO().emit('message:deleted', { id: deleted.id, deletedAt: deleted.deletedAt });
  return true;
};

export const markSeen = async (userId: string) => {
  const now = new Date();
  try {
    await repo.markMessagesAsSeen(userId, now);
  } catch (err: any) {
    if (err.code === 'P2020' || err.message?.includes('database is locked')) {
      console.warn('[messages.service] Ignored SQLite lock on markSeen');
    } else {
      throw err;
    }
  }
  getIO().emit('messages:seen', { seenAt: now.toISOString() });
  return now.toISOString();
};
