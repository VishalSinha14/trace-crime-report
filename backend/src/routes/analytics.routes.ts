import { Router } from 'express';
import {
  getAnalyticsOverview,
  getHotspots,
  getTemporalPatterns,
  getAIMetrics,
} from '../controllers/analytics.controller';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.get('/overview', optionalAuthenticate, getAnalyticsOverview);
router.get('/hotspots', optionalAuthenticate, getHotspots);
router.get('/temporal', optionalAuthenticate, getTemporalPatterns);
router.get('/ai-metrics', optionalAuthenticate, getAIMetrics);

export default router;
