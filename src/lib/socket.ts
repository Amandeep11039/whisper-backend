import { Server } from 'socket.io';
import http from 'http';
import { prisma } from './prisma.js';

let io: Server;

export function initSocket(server: http.Server): Server {
  io = new Server(server, { 
    cors: { 
      origin: (process.env['CLIENT_ORIGIN'] || 'http://localhost:5173').split(','),
      credentials: true,
    } 
  });

  io.use(async (socket, next) => {
    const userId = socket.handshake.auth.userId;
    
    if (!userId) {
      return next(new Error('Unauthorized'));
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return next(new Error('Unauthorized'));
      
      socket.data.userId = userId;
      next();
    } catch {
      next(new Error('Internal error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id, 'UserId:', socket.data.userId);
    
    // Join a personal room so we can emit to specific users
    socket.join(socket.data.userId);

    socket.on('user:typing', (payload: { isTyping: boolean }) => {
      socket.broadcast.emit('user:typing', payload);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
