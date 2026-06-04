import { Router } from 'express';
import { getStats, getDriversList, getRidesList, getIncidentsList } from './admin.controller';

const router = Router();

// Public for dev — in production add: authenticate + requireAdmin
router.get('/stats',     getStats);
router.get('/drivers',   getDriversList);
router.get('/rides',     getRidesList);
router.get('/incidents', getIncidentsList);

export default router;
