import { findUserByUsername } from '../repositories/auth.repository.js';
import { verifyPin } from '../utils/hash.js';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export const loginUser = async (username: string, pin: string) => {
  const user = await findUserByUsername(username);
  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const isValid = await verifyPin(pin, user.pinHash);
  if (!isValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  return { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl };
};
