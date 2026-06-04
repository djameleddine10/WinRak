import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { submitRating, getRideRatings } from './ratings.controller';

const router = Router();
router.use(authenticate);
router.post('/', submitRating);
router.get('/ride/:rideId', getRideRatings);

export default router;
