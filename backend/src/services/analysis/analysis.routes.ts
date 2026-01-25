import { Router } from 'express';
import { analysisController } from './analysis.controller';
import { protect } from '../auth/auth.middleware';

const router = Router();
router.use(protect);

router.post('/compare', analysisController.compare);
router.post('/:portfolioId/run', analysisController.run);
router.get('/:portfolioId', analysisController.getHistory);
router.post('/:portfolioId/stress-test', analysisController.stressTest);

export default router;