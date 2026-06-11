import { prisma } from '../config/prisma.js';
import type { User } from '@prisma/client';

export const findUserByUsername = async (username: string) => {
  return prisma.user.findUnique({ where: { username } });
};
