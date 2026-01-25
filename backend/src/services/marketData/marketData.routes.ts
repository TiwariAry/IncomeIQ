import { Router } from 'express';
import { marketDataController } from './marketData.controller';
import {protect} from "../auth/auth.middleware";
import { rateLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

router.use(protect, rateLimiter(10, 'market'));

router.get('/quote/:symbol', marketDataController.getQuote);
router.get('/history/:symbol', marketDataController.getHistory);

export default router;