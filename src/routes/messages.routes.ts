import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { getUnreadMessages } from '../controllers/message.controller.js';

const router = Router();

router.get('/unread', requireAuth, getUnreadMessages);

export default router;
