import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { getUnreadMessages, getSentPendingMessages } from '../controllers/message.controller.js';

const router = Router();

router.get('/unread', requireAuth, getUnreadMessages);
router.get('/sent-pending', requireAuth, getSentPendingMessages);

export default router;
