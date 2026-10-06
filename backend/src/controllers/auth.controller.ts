import { Request, Response } from 'express';
import { query } from '../utils/db';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { logAudit } from '../services/audit.service';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

export async function register(req: Request<{}, {}, RegisterInput>, res: Response): Promise<void> {
  const { name, email, password } = req.body;

  try {
    // Check if user with email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.',
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'CITIZEN')
       RETURNING id, name, email, role, avatar_url, is_active, created_at, updated_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    await logAudit({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'users',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Account successfully created.',
      user,
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create user account.' });
  }
}

export async function login(req: Request<{}, {}, LoginInput>, res: Response): Promise<void> {
  const { email, password } = req.body;

  try {
    const result = await query(
      `SELECT id, name, email, password_hash, role, avatar_url, is_active, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
      return;
    }

    const user = result.rows[0];

    if (!user.is_active) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'This account has been deactivated. Please contact an administrator.',
      });
      return;
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'users',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const { password_hash, ...safeUser } = user;

    res.json({
      message: 'Authentication successful.',
      user: safeUser,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to authenticate user.' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userRes = await query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.created_at, u.updated_at,
              (SELECT COUNT(*) FROM notifications n WHERE n.user_id = u.id AND n.read = false)::int AS unread_notifications,
              (SELECT COUNT(*) FROM incidents i WHERE i.user_id = u.id)::int AS total_reports
       FROM users u
       WHERE u.id = $1`,
      [req.user!.id]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'User not found.' });
      return;
    }

    res.json({ user: userRes.rows[0] });
  } catch (err: any) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch user profile.' });
  }
}
