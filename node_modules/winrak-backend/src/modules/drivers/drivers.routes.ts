import { Router } from 'express';
import { authenticate, requireDriver, requireAdmin } from '../../middleware/auth';
import {
  getNearbyDrivers, updateLocation, updateStatus,
  getDriverProfile, getEarnings, submitDocuments,
  registerAsDriver, getDriverRides,
} from './drivers.controller';

const router = Router();

router.use(authenticate);

router.get('/nearby', getNearbyDrivers);
router.post('/register', registerAsDriver);
router.get('/me', requireDriver, getDriverProfile);
router.patch('/location', requireDriver, updateLocation);
router.patch('/status', requireDriver, updateStatus);
router.get('/me/earnings', requireDriver, getEarnings);
router.get('/me/rides', requireDriver, getDriverRides);
router.post('/me/documents', requireDriver, submitDocuments);

export default router;
