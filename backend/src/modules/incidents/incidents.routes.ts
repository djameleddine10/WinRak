import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { reportIncident, getIncident, resolveIncident, listIncidents } from './incidents.controller';

const router = Router();
router.use(authenticate);

router.post('/report', reportIncident);
router.get('/:id', getIncident);
router.patch('/:id/resolve', requireAdmin, resolveIncident);
router.get('/', requireAdmin, listIncidents);

export default router;
