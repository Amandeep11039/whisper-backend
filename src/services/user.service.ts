import { PrismaClient } from '@prisma/client';
import { AppError } from './auth.service.js';

const prisma = new PrismaClient();

export const updateDisplayName = async (userId: string, displayName: string) => {
  if (!displayName || displayName.trim() === '') {
    throw new AppError(400, 'Display name cannot be empty');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { displayName: displayName.trim() },
  });

  return updatedUser;
};

export const getPartner = async (currentUserId: string) => {
  const partner = await prisma.user.findFirst({
    where: { NOT: { id: currentUserId } }
  });
  if (!partner) throw new AppError(404, 'Partner not found');

  const nickname = await prisma.nickname.findUnique({
    where: {
      giverId_receiverId: {
        giverId: currentUserId,
        receiverId: partner.id,
      }
    }
  });

  return {
    id: partner.id,
    username: partner.username,
    displayName: partner.displayName,
    nickname: nickname?.nickname || null,
  };
};

export const updatePartnerNickname = async (currentUserId: string, nicknameText: string) => {
  const partner = await prisma.user.findFirst({
    where: { NOT: { id: currentUserId } }
  });
  if (!partner) throw new AppError(404, 'Partner not found');

  if (!nicknameText || nicknameText.trim() === '') {
    // Delete nickname
    await prisma.nickname.deleteMany({
      where: {
        giverId: currentUserId,
        receiverId: partner.id,
      }
    });
    return { nickname: null };
  }

  const updated = await prisma.nickname.upsert({
    where: {
      giverId_receiverId: {
        giverId: currentUserId,
        receiverId: partner.id,
      }
    },
    update: { nickname: nicknameText.trim() },
    create: {
      giverId: currentUserId,
      receiverId: partner.id,
      nickname: nicknameText.trim(),
    }
  });

  return { nickname: updated.nickname };
};
