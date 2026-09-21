import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { prisma } from './prisma.js';

let io: Server | null = null;

// Per-user server-side safety timers for typing auto-stop (handles network drops / crashes)
const typingTimers = new Map<string, NodeJS.Timeout>();

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:5173',
        'https://whisper-frontend-nine.vercel.app',
        /^http:\/\/192\.168\.\d+\.\d+:5173$/,
      ],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.IO connections
  io.use(async (socket: Socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token && socket.handshake.headers?.authorization) {
        const header = socket.handshake.headers.authorization;
        if (header.startsWith('Bearer ')) {
          token = header.split(' ')[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const payload = await verifyToken(token);
      socket.data.userId = payload.sub;
      socket.data.username = payload.username;
      next();
    } catch (err: any) {
      console.warn('Socket connection rejected:', err.message);
      next(new Error('Authentication error: Invalid or revoked token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    const username = socket.data.username as string;
    console.log(`User connected to socket: ${username} (${userId})`);

    // Both users join the single unified chat room
    socket.join('chat');

    socket.on('send_message', async (data: { content: string }) => {
      try {
        if (!data || typeof data.content !== 'string') return;

        const text = data.content.trim();
        if (!text) return;

        // If sender was typing, cancel their server-side typing timer and notify partner
        if (typingTimers.has(userId)) {
          clearTimeout(typingTimers.get(userId)!);
          typingTimers.delete(userId);
          socket.to('chat').emit('partner_stopped_typing', { userId });
        }

        // Save pure text message to database
        const savedMessage = await prisma.message.create({
          data: { senderId: userId, content: text },
          select: { id: true, senderId: true, content: true, createdAt: true },
        });

        // Broadcast to both users in the room
        io?.to('chat').emit('new_message', savedMessage);
      } catch (error) {
        console.error('Error handling send_message:', error);
      }
    });

    // ─── Typing indicator events ──────────────────────────────────────────────

    socket.on('typing_start', () => {
      // Clear any existing safety timeout for this user
      if (typingTimers.has(userId)) {
        clearTimeout(typingTimers.get(userId)!);
      }

      // Notify partner — NOT the sender (socket.to vs io.to)
      socket.to('chat').emit('partner_typing', { userId });

      // Safety: auto-stop after 5 s in case client never sends typing_stop
      const timer = setTimeout(() => {
        socket.to('chat').emit('partner_stopped_typing', { userId });
        typingTimers.delete(userId);
      }, 5000);

      typingTimers.set(userId, timer);
    });

    socket.on('typing_stop', () => {
      if (typingTimers.has(userId)) {
        clearTimeout(typingTimers.get(userId)!);
        typingTimers.delete(userId);
      }
      socket.to('chat').emit('partner_stopped_typing', { userId });
    });

    // ─── Disconnect cleanup ───────────────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log(`User disconnected from socket: ${username} (${userId})`);

      // Clear typing timer and inform partner the indicator should stop
      if (typingTimers.has(userId)) {
        clearTimeout(typingTimers.get(userId)!);
        typingTimers.delete(userId);
      }
      socket.to('chat').emit('partner_stopped_typing', { userId });
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io has not been initialized');
  return io;
};
