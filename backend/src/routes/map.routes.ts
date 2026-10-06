import { Router } from 'express';
import {
  getMapIncidents,
  getMapClusters,
  getMapHeatmap,
  getNearbyIncidents,
} from '../controllers/map.controller';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public / RBAC-aware map pins query
router.get('/incidents', optionalAuthenticate, getMapIncidents);

// Clustered pins for high-density visualization
router.get('/clusters', optionalAuthenticate, getMapClusters);

// Heatmap coordinates
router.get('/heatmap', optionalAuthenticate, getMapHeatmap);

// Proximity search / local safety score
router.get('/nearby', optionalAuthenticate, getNearbyIncidents);

export default router;
