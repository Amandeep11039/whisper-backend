import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware.js';
import { LoginSchema } from '../validators/auth.schema.js';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', validate(LoginSchema), ctrl.login);
router.post('/logout', ctrl.logout);

export default router;
