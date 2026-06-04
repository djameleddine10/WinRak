import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getProfile, updateProfile, addEmergencyContact, getWinPoints } from './users.controller';

const router = Router();
router.use(authenticate);
router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.post('/emergency-contacts', addEmergencyContact);
router.get('/me/win-points', getWinPoints);

export default router;
