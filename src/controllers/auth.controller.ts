import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { signToken, revokeToken } from '../utils/jwt.js';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, pin } = req.body;

    if (!username || !pin) {
      res.status(400).json({ error: 'Username and PIN are required' });
      return;
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPin = String(pin).trim();

    const user = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(cleanPin, user.pinHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken(user.id, user.username);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    let token: string | undefined;

    // Handle token from JSON body, plain text body (sendBeacon), or Authorization header
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        token = parsed.token;
      } catch {
        token = req.body;
      }
    } else if (req.body && req.body.token) {
      token = req.body.token;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      await revokeToken(token);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Logout error:', error);
    res.status(204).send(); // Always return success for logout even on error
  }
};
