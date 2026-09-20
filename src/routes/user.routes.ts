import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { markRead } from '../controllers/user.controller.js';

const router = Router();

router.patch('/mark-read', requireAuth, markRead);

export default router;
