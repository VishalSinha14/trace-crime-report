import { Request, Response } from 'express';
import { query } from '../utils/db';
import { logAudit } from '../services/audit.service';
import { UserRole } from '../models/types';

function parsePaginationValue(value: unknown, fallback: number, max?: number): number | null {
  if (value === undefined) {
    return fallback;
  }

  const rawValue = Array.isArray(value) ? value[0] : value;
  if (typeof rawValue !== 'string' && typeof rawValue !== 'number') {
    return null;
  }

  const parsed = Number(rawValue);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return null;
  }

  return max === undefined ? parsed : Math.min(max, parsed);
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const { search, role, page = '1', limit = '20' } = req.query;

  const pageNum = parsePaginationValue(page, 1);
  const limitNum = parsePaginationValue(limit, 20, 100);
  if (pageNum === null || limitNum === null) {
    res.status(400).json({ error: 'Bad Request', message: 'Page and limit must be positive integers.' });
    return;
  }
  const offset = (pageNum - 1) * limitNum;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (search) {
    conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  if (role) {
    conditions.push(`role = $${idx++}::user_role`);
    params.push(role);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countRes = await query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const sql = `
      SELECT id, name, email, role, avatar_url, is_active, created_at, updated_at,
             (SELECT COUNT(*) FROM incidents WHERE user_id = users.id)::int AS report_count
      FROM users
      ${where}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    params.push(limitNum, offset);
    const usersRes = await query(sql, params);

    res.json({
      users: usersRes.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('listUsers error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve users.' });
  }
}

export async function updateUserRole(req: Request<{ id: string }, {}, { role: UserRole }>, res: Response): Promise<void> {
  const { id } = req.params;
  const { role } = req.body;
  const admin = req.user!;

  if (!['CITIZEN', 'MODERATOR', 'ADMIN'].includes(role)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid role specified.' });
    return;
  }

  // Prevent admin from demoting themselves to avoid accidental lockout
  if (id === admin.id && role !== 'ADMIN') {
    res.status(400).json({ error: 'Bad Request', message: 'You cannot remove your own admin privileges.' });
    return;
  }

  try {
    const updateRes = await query(
      `UPDATE users
       SET role = $1::user_role, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, is_active`,
      [role, id]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'User not found.' });
      return;
    }

    const updatedUser = updateRes.rows[0];

    await logAudit({
      userId: admin.id,
      action: 'USER_ROLE_CHANGED',
      entityType: 'users',
      entityId: id,
      metadata: { target_email: updatedUser.email, new_role: role },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: `User role updated to ${role}.`,
      user: updatedUser,
    });
  } catch (err: any) {
    console.error('updateUserRole error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update user role.' });
  }
}

export async function updateUserStatus(req: Request<{ id: string }, {}, { isActive: boolean }>, res: Response): Promise<void> {
  const { id } = req.params;
  const { isActive } = req.body;
  const admin = req.user!;

  if (typeof isActive !== 'boolean') {
    res.status(400).json({ error: 'Bad Request', message: 'isActive must be a boolean.' });
    return;
  }

  if (id === admin.id && !isActive) {
    res.status(400).json({ error: 'Bad Request', message: 'You cannot deactivate your own account.' });
    return;
  }

  try {
    const updateRes = await query(
      `UPDATE users
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, is_active`,
      [isActive, id]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'User not found.' });
      return;
    }

    await logAudit({
      userId: admin.id,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'users',
      entityId: id,
      metadata: { is_active: isActive },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: updateRes.rows[0],
    });
  } catch (err: any) {
    console.error('updateUserStatus error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update user status.' });
  }
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const { action, entityType, page = '1', limit = '30' } = req.query;

  const pageNum = parsePaginationValue(page, 1);
  const limitNum = parsePaginationValue(limit, 30, 100);
  if (pageNum === null || limitNum === null) {
    res.status(400).json({ error: 'Bad Request', message: 'Page and limit must be positive integers.' });
    return;
  }
  const offset = (pageNum - 1) * limitNum;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (action) {
    conditions.push(`a.action = $${idx++}`);
    params.push(action);
  }

  if (entityType) {
    conditions.push(`a.entity_type = $${idx++}`);
    params.push(entityType);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countRes = await query(`SELECT COUNT(*) AS total FROM audit_logs a ${where}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const sql = `
      SELECT 
        a.id,
        a.user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        a.action,
        a.entity_type,
        a.entity_id,
        a.metadata,
        a.ip_address,
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${where}
      ORDER BY a.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    params.push(limitNum, offset);
    const logsRes = await query(sql, params);

    res.json({
      logs: logsRes.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('getAuditLogs error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve audit logs.' });
  }
}

export async function getSystemStats(_req: Request, res: Response): Promise<void> {
  try {
    const versionRes = await query('SELECT version(), PostGIS_Full_Version()');
    const tableCounts = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users)::int AS users_count,
        (SELECT COUNT(*) FROM incidents)::int AS incidents_count,
        (SELECT COUNT(*) FROM incident_analysis)::int AS analysis_count,
        (SELECT COUNT(*) FROM notifications)::int AS notifications_count,
        (SELECT COUNT(*) FROM audit_logs)::int AS audit_logs_count
    `);

    res.json({
      database: {
        serverVersion: versionRes.rows[0].version,
        postgisVersion: versionRes.rows[0].postgis_full_version,
      },
      tableCounts: tableCounts.rows[0],
      process: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
    });
  } catch (err: any) {
    console.error('getSystemStats error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve system statistics.' });
  }
}
