import { Router } from 'express';
import { authenticate, requireDriver, requireAdmin } from '../../middleware/auth';
import {
  getMyContract, getTerms, signContract,
  createOffer, calculateLoss,
} from './contracts.controller';

const router = Router();

router.use(authenticate);

router.get('/my', requireDriver, getMyContract);
router.get('/terms', getTerms);
router.post('/sign', requireDriver, signContract);
router.post('/offer', requireAdmin, createOffer);
router.post('/calculate-loss', requireAdmin, calculateLoss);

export default router;
