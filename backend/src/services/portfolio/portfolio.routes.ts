import { Router } from 'express';
import { portfolioController } from './portfolio.controller';
import {protect} from "../auth/auth.middleware";
import { rateLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

router.use(protect, rateLimiter(500, 'Portfolio'));

router.post('/', portfolioController.create);
router.get('/', portfolioController.getAll);
router.get('/:portfolioId', portfolioController.getDetails);
router.post('/:portfolioId/buy', portfolioController.buy);

export default router;