import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { prisma } from './prisma.js';

let io: Server | null = null;

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
    const userId = socket.data.userId;
    const username = socket.data.username;
    console.log(`User connected to socket: ${username} (${userId})`);

    // Both users join the single unified chat room
    socket.join('chat');

    socket.on('send_message', async (data: { content: string }) => {
      try {
        if (!data || typeof data.content !== 'string') {
          return;
        }

        const text = data.content.trim();
        if (!text) {
          return;
        }

        // Save pure text message to database
        const savedMessage = await prisma.message.create({
          data: {
            senderId: userId,
            content: text,
          },
          select: {
            id: true,
            senderId: true,
            content: true,
            createdAt: true,
          },
        });

        // Broadcast to both users in the room
        io?.to('chat').emit('new_message', savedMessage);
      } catch (error) {
        console.error('Error handling send_message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected from socket: ${username} (${userId})`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};
