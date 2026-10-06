import { Router } from 'express';
import {
  listUsers,
  updateUserRole,
  updateUserStatus,
  getAuditLogs,
  getSystemStats,
} from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// All admin routes strictly require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.get('/audit-logs', getAuditLogs);
router.get('/system-stats', getSystemStats);

export default router;
