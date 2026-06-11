import { prisma } from '../config/prisma.js';
import type { Prisma } from '@prisma/client';

export const getMessages = async (limit: number, cursor?: string) => {
  return prisma.message.findMany({
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
  });
};

export const createMessage = async (data: Prisma.MessageUncheckedCreateInput) => {
  return prisma.message.create({ data });
};

export const getMessageById = async (id: string) => {
  return prisma.message.findUnique({ where: { id } });
};

export const updateMessage = async (id: string, data: Prisma.MessageUpdateInput) => {
  return prisma.message.update({
    where: { id },
    data,
  });
};

export const markMessagesAsSeen = async (userId: string, now: Date) => {
  return prisma.message.updateMany({
    where: {
      senderId: { not: userId },
      seenAt: null
    },
    data: {
      seenAt: now
    }
  });
};
