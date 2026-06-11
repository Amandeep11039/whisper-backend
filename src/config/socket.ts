import { Server } from 'socket.io';
import http from 'http';
import { prisma } from './prisma.js';

let io: Server;

// Tracks userId -> Set of socketIds (handles multiple tabs)
const onlineUsers = new Map<string, Set<string>>();

const PING_INTERVAL_MS = 20_000;
const PONG_TIMEOUT_MS = 5_000;

export function initSocket(server: http.Server): Server {
  io = new Server(server, {
    cors: {
      origin: (process.env['CLIENT_ORIGIN'] || 'http://localhost:5173').split(','),
      credentials: true,
    },
    // Use the built-in ping/pong at transport level too
    pingInterval: 25_000,
    pingTimeout: 10_000,
  });

  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) return next(new Error('Unauthorized'));

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return next(new Error('Unauthorized'));
      socket.data.userId = userId;
      next();
    } catch {
      next(new Error('Internal error'));
    }
  });

  // ── Connection handler ───────────────────────────────────────────────────────
  io.on('connection', async (socket) => {
    const userId: string = socket.data.userId;
    console.log(`[socket] connected userId=${userId} socketId=${socket.id}`);

    // 1. Add to presence map
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    const userSockets = onlineUsers.get(userId)!;
    const wasOffline = userSockets.size === 0;
    userSockets.add(socket.id);

    // 2. Join personal room
    socket.join(userId);

    // 3. Tell this new socket whether the partner is currently online
    // socket.emit('presence:init', { partnerOnline: false, partnerLastSeen: null }); // overwritten below
    try {
      // Find the partner (the other user in the DB)
      const partner = await prisma.user.findFirst({
        where: { id: { not: userId } },
        select: { id: true, lastSeenAt: true },
      });

      if (partner) {
        const partnerOnline =
          onlineUsers.has(partner.id) && (onlineUsers.get(partner.id)?.size ?? 0) > 0;

        socket.emit('presence:init', {
          partnerOnline,
          partnerLastSeen: partnerOnline
            ? null                                      // ✅ online → no last seen
            : partner.lastSeenAt?.toISOString() ?? null // ✅ offline → show last seen
        });
      }
    } catch (err) {
      console.error('[socket] presence init error:', err);
    }

    // 4. If this user was previously offline, tell the partner they're now online
    if (wasOffline) {
      socket.broadcast.emit('user:online', { userId });
    }

    // ── Application events ───────────────────────────────────────────────────
    socket.on('user:typing', (payload: { isTyping: boolean }) => {
      console.log(payload)
      socket.broadcast.emit('user:typing', payload);
    });

    // Client must respond to our app-level ping to detect silent disconnects
    socket.on('pong:app', () => {
      // Reset the pong timer when we hear back
      clearTimeout(socket.data.pongTimer as ReturnType<typeof setTimeout>);
    });

    // ── Heartbeat ────────────────────────────────────────────────────────────
    const heartbeat = setInterval(() => {
      socket.emit('ping:app');
      socket.data.pongTimer = setTimeout(() => {
        console.log(`[socket] pong timeout, forcing disconnect userId=${userId}`);
        socket.disconnect(true);
      }, PONG_TIMEOUT_MS);
    }, PING_INTERVAL_MS);

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[socket] disconnected userId=${userId} socketId=${socket.id}`);
      clearInterval(heartbeat);
      clearTimeout(socket.data.pongTimer as ReturnType<typeof setTimeout>);

      // Remove from presence map
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);

          // Update lastSeenAt in DB
          const lastSeenAt = new Date();
          try {
            await prisma.user.update({
              where: { id: userId },
              data: { lastSeenAt },
            });
          } catch (err) {
            console.error('[socket] failed to update lastSeenAt:', err);
          }

          // Notify partner
          socket.broadcast.emit('user:offline', {
            userId,
            lastSeenAt: lastSeenAt.toISOString(),
          });
        }
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
