import { Router } from 'express';
import { sendOtpHandler, verifyOtpHandler, refreshTokenHandler, logoutHandler } from './auth.controller';
import { authLimiter } from '../../middleware/rateLimiter';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/send-otp', authLimiter, sendOtpHandler);
router.post('/verify-otp', authLimiter, verifyOtpHandler);
router.post('/refresh-token', refreshTokenHandler);
router.post('/logout', authenticate, logoutHandler);

export default router;
