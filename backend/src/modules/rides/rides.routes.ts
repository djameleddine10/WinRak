import { Router } from 'express';
import { authenticate, requireDriver } from '../../middleware/auth';
import {
  estimateRide,
  requestRide,
  acceptRide,
  driverArrived,
  startRide,
  completeRide,
  cancelRide,
  trackRide,
  getRideById,
  getMyRides,
} from './rides.controller';

const router = Router();

router.use(authenticate);

router.post('/estimate', estimateRide);
router.post('/request', requestRide);
router.get('/my', getMyRides);
router.get('/:id', getRideById);
router.get('/:id/track', trackRide);

router.patch('/:id/accept', requireDriver, acceptRide);
router.patch('/:id/arrived', requireDriver, driverArrived);
router.patch('/:id/start', requireDriver, startRide);
router.patch('/:id/complete', requireDriver, completeRide);
router.patch('/:id/cancel', cancelRide);

export default router;
