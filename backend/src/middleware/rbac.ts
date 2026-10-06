import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/types';

/**
 * Enforce Role-Based Access Control (RBAC)
 * Must be placed AFTER `authenticate` middleware.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required before checking permissions.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Requires one of [${allowedRoles.join(', ')}] role, but you are [${req.user.role}].`,
      });
      return;
    }

    next();
  };
}
