import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import * as ctrl from '../controllers/user.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/partner', ctrl.getPartner);
router.put('/partner/nickname', ctrl.updatePartnerNickname);
router.patch('/me', ctrl.updateProfile);

export default router;
