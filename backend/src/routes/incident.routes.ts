import { Router } from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
  updateIncidentModeration,
} from '../controllers/incident.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createIncidentSchema,
  updateIncidentStatusSchema,
  updateIncidentModerationSchema,
  queryIncidentsSchema,
} from '../validators/incident.validator';
import { incidentSubmitLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public / Guest / User list with privacy rules & spatial filters
router.get('/', optionalAuthenticate, validateQuery(queryIncidentsSchema), getIncidents);

// Single report details (with RBAC / ownership check)
router.get('/:id', optionalAuthenticate, getIncidentById);

// Submit new incident (requires citizen, moderator, or admin auth)
router.post('/', authenticate, incidentSubmitLimiter, validateBody(createIncidentSchema), createIncident);

// Update status (Moderator or Admin only)
router.patch(
  '/:id/status',
  authenticate,
  requireRole('MODERATOR', 'ADMIN'),
  validateBody(updateIncidentStatusSchema),
  updateIncidentStatus
);

// Update moderation parameters (category, severity, notes)
router.patch(
  '/:id/moderation',
  authenticate,
  requireRole('MODERATOR', 'ADMIN'),
  validateBody(updateIncidentModerationSchema),
  updateIncidentModeration
);

export default router;
