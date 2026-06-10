import http from 'http';
import app from './app.js';
import { initSocket } from './lib/socket.js';
import { prisma } from './lib/prisma.js';

const PORT = process.env['PORT'] || 3001;

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close();
}); 
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  server.close();
});
