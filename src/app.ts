import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://whisper-frontend-nine.vercel.app',
    /^http:\/\/192\.168\.\d+\.\d+:5173$/, // Allow local network IPs
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-user-id',
    'x-socket-id'
  ],
}));

app.options('*', cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/users', userRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
