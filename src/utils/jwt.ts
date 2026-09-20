import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';

const JWT_SECRET = process.env['JWT_SECRET'] || 'whisper_ultra_secure_secret_key_2026';
const TOKEN_EXPIRY = '15m';

export interface JwtPayload {
  sub: string;
  username: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export const signToken = (userId: string, username: string): string => {
  const jti = crypto.randomUUID();
  return jwt.sign({ sub: userId, username, jti }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
};

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

  if (!decoded.jti) {
    throw new Error('Malformed token: missing jti');
  }

  // Check if token has been revoked in database
  const isRevoked = await prisma.revokedToken.findUnique({
    where: { jti: decoded.jti },
  });

  if (isRevoked) {
    throw new Error('Token has been revoked');
  }

  return decoded;
};

export const revokeToken = async (token: string): Promise<boolean> => {
  try {
    // We decode without verification in case it's near/at expiry during logout
    const decoded = jwt.decode(token) as JwtPayload | null;
    if (!decoded || !decoded.jti) {
      return false;
    }

    const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000);

    await prisma.revokedToken.upsert({
      where: { jti: decoded.jti },
      update: {},
      create: {
        jti: decoded.jti,
        expiresAt,
      },
    });

    return true;
  } catch (error) {
    console.error('Error revoking token:', error);
    return false;
  }
};
