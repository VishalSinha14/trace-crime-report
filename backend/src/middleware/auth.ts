import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { AuthTokenPayload, UserRole } from '../models/types';
import { query } from '../utils/db';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload & { name?: string };
    }
  }
}

/**
 * Require valid JWT authentication
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is required to access this resource.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    
    // Optional check: verify user is still active in DB
    const userRes = await query('SELECT id, name, email, role, is_active FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User account not found or has been deactivated.',
      });
      return;
    }

    req.user = {
      id: userRes.rows[0].id,
      email: userRes.rows[0].email,
      role: userRes.rows[0].role as UserRole,
      name: userRes.rows[0].name,
    };

    next();
  } catch (err) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token.',
    });
  }
}

/**
 * Optional authentication: if token is present, decode it. If not, continue as guest.
 */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    const userRes = await query('SELECT id, name, email, role, is_active FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rows.length > 0 && userRes.rows[0].is_active) {
      req.user = {
        id: userRes.rows[0].id,
        email: userRes.rows[0].email,
        role: userRes.rows[0].role as UserRole,
        name: userRes.rows[0].name,
      };
    }
  } catch {
    // Ignore invalid tokens for optional auth and proceed as guest
  }

  next();
}
