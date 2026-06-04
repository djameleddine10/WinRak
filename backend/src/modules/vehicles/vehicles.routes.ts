import { Router } from 'express';
import { authenticate, requireDriver } from '../../middleware/auth';
import { addVehicle, getMyVehicles, updateVehicle } from './vehicles.controller';

const router = Router();
router.use(authenticate);
router.get('/my', requireDriver, getMyVehicles);
router.post('/', requireDriver, addVehicle);
router.patch('/:id', requireDriver, updateVehicle);

export default router;
