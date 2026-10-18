import { Router } from 'express';
import { submitCorroboration, getCorroborations } from '../controllers/corroboration.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router({ mergeParams: true });

// Submit a corroboration (auth required — must be a logged-in citizen)
router.post('/corroborate', authenticate, requireRole('CITIZEN'), submitCorroboration);

// Get corroborations list for an incident (authenticated users only)
router.get('/corroborations', authenticate, getCorroborations);

export default router;
