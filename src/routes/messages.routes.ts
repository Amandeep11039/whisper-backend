import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as ctrl from '../controllers/messages.controller.js';
import { SendMessageSchema, EditMessageSchema, PaginationSchema } from '../validators/message.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(PaginationSchema, 'query'), ctrl.getMessages);
router.post('/seen', ctrl.markSeen);
router.post('/', validate(SendMessageSchema), ctrl.sendMessage);
router.patch('/:id', validate(EditMessageSchema), ctrl.editMessage);
router.delete('/:id', ctrl.deleteMessage);

export default router;
