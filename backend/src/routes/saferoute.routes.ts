import { Router } from 'express';
import { getSafeRoute } from '../controllers/saferoute.controller';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Safe route calculation (public, but auth-aware for potential future personalization)
router.get('/safe-route', optionalAuthenticate, getSafeRoute);

export default router;
