import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createPaymentIntent, confirmPayment, getPaymentHistory } from './payments.controller';

const router = Router();
router.use(authenticate);
router.post('/intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/history', getPaymentHistory);

export default router;
