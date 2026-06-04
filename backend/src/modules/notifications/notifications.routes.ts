import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getMyNotifications, markRead, updateFcmToken } from './notifications.controller';

const router = Router();
router.use(authenticate);
router.get('/', getMyNotifications);
router.patch('/:id/read', markRead);
router.patch('/fcm-token', updateFcmToken);

export default router;
