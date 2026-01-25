import { Router } from 'express';
import { authController } from './auth.controller';
import {protect} from "./auth.middleware";

const router = Router();

router.post(
    '/register',
    // authValidator.register, // Uncomment when validation is ready
    authController.register
);

router.post(
    '/login',
    // authValidator.login,
    authController.login
);

router.post(
    '/logout',
    protect,
    authController.logout
);

export default router;