import { Request, Response } from 'express';
import type { PoolClient } from 'pg';
import { query, getClient } from '../utils/db';
import { createNotification } from '../services/notification.service';
import { broadcastToRole, broadcastToUser } from '../sockets';

// ─── Scoring weights ────────────────────────────────────────────────────────

const TYPE_SCORE: Record<string, number> = {
  WITNESSED:    3,
  AFFECTED:     2,
  FALSE_REPORT: -2,
};

/** Recompute credibility_score from all corroborations for an incident */
async function recomputeCredibility(client: PoolClient, incidentId: string): Promise<number> {
  const result = await client.query(
    `SELECT type FROM corroborations WHERE incident_id = $1`,
    [incidentId]
  );

  let total = 0;
  for (const row of result.rows) {
    total += TYPE_SCORE[row.type] ?? 0;
  }

  // Clamp to 0–100
  const clamped = Math.max(0, Math.min(100, total));

  await client.query(
    `UPDATE incidents SET credibility_score = $1 WHERE id = $2`,
    [clamped, incidentId]
  );

  return clamped;
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/incidents/:id/corroborate
 * Authenticated citizen submits a corroboration (witness / affected / false report).
 */
export async function submitCorroboration(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Login required to corroborate.' });
    return;
  }

  const { id: incidentId } = req.params;
  const { type, statement } = req.body as { type: string; statement: string };

  // ─── Validate type ───────────────────────────────────────────────────────
  if (!['WITNESSED', 'AFFECTED', 'FALSE_REPORT'].includes(type)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'type must be one of: WITNESSED, AFFECTED, FALSE_REPORT',
    });
    return;
  }

  // ─── Validate statement length ────────────────────────────────────────────
  if (!statement || statement.trim().length < 10 || statement.trim().length > 500) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Statement must be between 10 and 500 characters.',
    });
    return;
  }

  // ─── Fetch incident ───────────────────────────────────────────────────────
  const incResult = await query(
    `SELECT id, user_id, description, category, status, is_public FROM incidents WHERE id = $1`,
    [incidentId]
  );

  if (incResult.rows.length === 0) {
    res.status(404).json({ error: 'Not Found', message: 'Incident not found.' });
    return;
  }

  const incident = incResult.rows[0];

  // ─── Business rules ───────────────────────────────────────────────────────
  if (incident.status === 'REJECTED') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Cannot corroborate a rejected incident.',
    });
    return;
  }

  if (!incident.is_public && incident.status !== 'UNDER_REVIEW') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'This incident is not publicly available for corroboration.',
    });
    return;
  }

  if (incident.user_id === user.id) {
    res.status(400).json({
      error: 'Conflict',
      message: 'You cannot corroborate your own incident report.',
    });
    return;
  }

  // ─── Insert (UNIQUE constraint handles duplicates) ────────────────────────
  const client = await getClient();
  let newScore: number;
  let corroborationCount: number;
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM incidents WHERE id = $1 FOR UPDATE', [incidentId]);
    await client.query(
      `INSERT INTO corroborations (incident_id, user_id, type, statement)
       VALUES ($1, $2, $3, $4)`,
      [incidentId, user.id, type, statement.trim()]
    );
    newScore = await recomputeCredibility(client, incidentId);
    const countResult = await client.query(
      `SELECT COUNT(*)::int AS total FROM corroborations WHERE incident_id = $1`,
      [incidentId]
    );
    corroborationCount = countResult.rows[0]?.total ?? 0;
    await client.query('COMMIT');
  } catch (err: any) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      res.status(409).json({
        error: 'Conflict',
        message: 'You have already submitted a corroboration for this incident.',
      });
      return;
    }
    throw err;
  } finally {
    client.release();
  }

  // ─── High-credibility alert to moderators ─────────────────────────────────
  if (newScore >= 15 && incident.status === 'SUBMITTED') {
    broadcastToRole('MODERATOR', 'incident:high_credibility', {
      incidentId,
      credibilityScore: newScore,
      corroborationCount,
      incidentDescription: incident.description?.substring(0, 100),
      category: incident.category,
    });
  }

  // ─── Notify original reporter ─────────────────────────────────────────────
  try {
    const typeLabel =
      type === 'WITNESSED' ? 'witnessed your report'
      : type === 'AFFECTED' ? 'says they were also affected'
      : 'disputed your report';

    await createNotification(
      incident.user_id,
      'Someone corroborated your report',
      `A community member ${typeLabel}: "${statement.trim().substring(0, 80)}..."`,
      'CORROBORATED',
      incidentId
    );
    broadcastToUser(incident.user_id, 'notification:new', {
      type: 'CORROBORATED',
      incidentId,
    });
  } catch (err) {
    console.error('Failed to notify incident reporter about corroboration:', err);
  }

  res.status(201).json({
    success: true,
    credibility_score: newScore,
    corroboration_count: corroborationCount,
  });
}

/**
 * GET /api/incidents/:id/corroborations
 * Return anonymized corroboration list for a given incident.
 */
export async function getCorroborations(req: Request, res: Response): Promise<void> {
  const { id: incidentId } = req.params;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  // Verify incident exists and is accessible
  const incResult = await query(
    `SELECT id, is_public, status FROM incidents WHERE id = $1`,
    [incidentId]
  );

  if (incResult.rows.length === 0) {
    res.status(404).json({ error: 'Not Found', message: 'Incident not found.' });
    return;
  }

  const incident = incResult.rows[0];
  const user = req.user;
  const isStaff = user && (user.role === 'MODERATOR' || user.role === 'ADMIN');

  // Non-staff can only see corroborations on public incidents
  if (!incident.is_public && !isStaff) {
    res.status(403).json({ error: 'Forbidden', message: 'Access denied.' });
    return;
  }

  const result = await query(
    `SELECT
       c.id,
       c.type,
       c.statement,
       c.created_at,
       -- Show only first name for privacy (full name for staff)
       CASE WHEN $1 = true THEN u.name
            ELSE SPLIT_PART(u.name, ' ', 1)
       END AS author_name,
       -- Let the original reporter see if it's their own corroboration
       (c.user_id = $2) AS is_own
     FROM corroborations c
     JOIN users u ON u.id = c.user_id
     WHERE c.incident_id = $3
     ORDER BY c.created_at DESC
     LIMIT $4 OFFSET $5`,
    [isStaff ? true : false, user?.id ?? null, incidentId, limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*)::int AS total FROM corroborations WHERE incident_id = $1',
    [incidentId]
  );
  const corroborationCount = countResult.rows[0]?.total ?? 0;
  const breakdown = {
    WITNESSED:    result.rows.filter((r) => r.type === 'WITNESSED').length,
    AFFECTED:     result.rows.filter((r) => r.type === 'AFFECTED').length,
    FALSE_REPORT: result.rows.filter((r) => r.type === 'FALSE_REPORT').length,
  };

  const credResult = await query(
    `SELECT credibility_score FROM incidents WHERE id = $1`,
    [incidentId]
  );
  const credibilityScore = credResult.rows[0]?.credibility_score ?? 0;

  // Check if requesting user already corroborated
  let userCorroborationType: string | null = null;
  if (user) {
    const ownResult = await query(
      `SELECT type FROM corroborations WHERE incident_id = $1 AND user_id = $2`,
      [incidentId, user.id]
    );
    userCorroborationType = ownResult.rows[0]?.type ?? null;
  }

  res.json({
    corroborations: result.rows,
    corroboration_count: corroborationCount,
    credibility_score: credibilityScore,
    breakdown,
    user_corroboration_type: userCorroborationType,
    pagination: {
      page,
      limit,
      total: corroborationCount,
      totalPages: Math.ceil(corroborationCount / limit),
    },
  });
}
