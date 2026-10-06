import { Request, Response } from 'express';
import { query, getClient } from '../utils/db';
import { classifyIncident, estimateSeverity } from '../services/ai.service';
import { logAudit } from '../services/audit.service';
import { createNotification } from '../services/notification.service';
import { broadcastToRole, broadcastPublic, broadcastToUser } from '../sockets';
import {
  CreateIncidentInput,
  UpdateIncidentStatusInput,
  UpdateIncidentModerationInput,
  QueryIncidentsInput,
} from '../validators/incident.validator';
import { IncidentCategory, IncidentSeverity, IncidentStatus } from '../models/types';

/**
 * List incidents with spatial bounding box, filters, and role-based privacy enforcement
 */
export async function getIncidents(req: Request, res: Response): Promise<void> {
  const user = req.user;
  const isStaff = user && (user.role === 'MODERATOR' || user.role === 'ADMIN');
  const filterMyReports = req.query.my_reports && user;

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  // ─── Privacy & Access Control ─────────────────────────────────────────────
  if (filterMyReports) {
    // Citizen viewing their own reports
    conditions.push(`i.user_id = $${paramIdx++}`);
    params.push(user.id);
  } else if (!isStaff) {
    // Public / standard citizen view: ONLY verified & public incidents
    conditions.push(`i.status = 'VERIFIED' AND i.is_public = true`);
  } else {
    // Moderator / Admin can filter by any status if requested
    if (req.query.status) {
      conditions.push(`i.status = $${paramIdx++}::incident_status`);
      params.push(req.query.status);
    }
  }

  // ─── Category & Severity Filters ──────────────────────────────────────────
  if (req.query.category) {
    conditions.push(`i.category = $${paramIdx++}::incident_category`);
    params.push(req.query.category);
  }

  if (req.query.severity) {
    conditions.push(`i.severity = $${paramIdx++}::incident_severity`);
    params.push(req.query.severity);
  }

  // ─── Text Search ──────────────────────────────────────────────────────────
  if (req.query.search) {
    conditions.push(`(i.description ILIKE $${paramIdx} OR i.location_area ILIKE $${paramIdx})`);
    params.push(`%${req.query.search}%`);
    paramIdx++;
  }

  // ─── PostGIS Bounding Box Filter ─────────────────────────────────────────
  if (
    req.query.minLat !== undefined &&
    req.query.maxLat !== undefined &&
    req.query.minLng !== undefined &&
    req.query.maxLng !== undefined
  ) {
    conditions.push(
      `i.location && ST_MakeEnvelope($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, 4326)`
    );
    params.push(
      Number(req.query.minLng),
      Number(req.query.minLat),
      Number(req.query.maxLng),
      Number(req.query.maxLat)
    );
  }

  // ─── Date Range Filter ────────────────────────────────────────────────────
  if (req.query.startDate) {
    conditions.push(`i.occurred_at >= $${paramIdx++}`);
    params.push(new Date(String(req.query.startDate)));
  }
  if (req.query.endDate) {
    conditions.push(`i.occurred_at <= $${paramIdx++}`);
    params.push(new Date(String(req.query.endDate)));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    // Count total matching items
    const countSql = `SELECT COUNT(*) AS total FROM incidents i ${whereClause}`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    // Fetch paginated incidents
    // For non-staff, sanitize reporter info
    const selectReporter = isStaff
      ? `u.name AS reporter_name, u.email AS reporter_email,`
      : user
      ? `CASE WHEN i.user_id = '${user.id}' THEN u.name ELSE 'Anonymous Reporter' END AS reporter_name,`
      : `'Anonymous' AS reporter_name,`;

    const dataSql = `
      SELECT 
        i.id,
        i.user_id,
        i.description,
        i.category,
        i.ai_category,
        i.ai_confidence,
        i.severity,
        i.status,
        i.latitude,
        i.longitude,
        i.location_area,
        i.occurred_at,
        i.is_public,
        ${isStaff ? 'i.moderation_notes,' : ''}
        i.created_at,
        i.updated_at,
        ${selectReporter}
        (SELECT COUNT(*) FROM incident_media m WHERE m.incident_id = i.id)::int AS media_count
      FROM incidents i
      LEFT JOIN users u ON i.user_id = u.id
      ${whereClause}
      ORDER BY i.occurred_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    params.push(limit, offset);
    const dataRes = await query(dataSql, params);

    res.json({
      data: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('getIncidents error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve incidents.' });
  }
}

/**
 * Get incident by ID with privacy protection
 */
export async function getIncidentById(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user;
  const isStaff = user && (user.role === 'MODERATOR' || user.role === 'ADMIN');

  try {
    const incRes = await query(
      `SELECT i.*, 
              u.name AS reporter_name, 
              u.email AS reporter_email
       FROM incidents i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.id = $1`,
      [id]
    );

    if (incRes.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Incident not found.' });
      return;
    }

    const incident = incRes.rows[0];

    // Privacy check
    const isOwner = user && user.id === incident.user_id;
    const isPublicVerified = incident.status === 'VERIFIED' && incident.is_public;

    if (!isStaff && !isOwner && !isPublicVerified) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'This report is currently under review or unverified and cannot be viewed publicly.',
      });
      return;
    }

    // Fetch media and AI analysis records
    const mediaRes = await query('SELECT * FROM incident_media WHERE incident_id = $1', [id]);
    const analysisRes = await query(
      'SELECT * FROM incident_analysis WHERE incident_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    // Sanitize reporter for non-staff non-owners
    if (!isStaff && !isOwner) {
      incident.reporter_name = 'Anonymous Reporter';
      incident.reporter_email = undefined;
      incident.moderation_notes = undefined;
    }

    res.json({
      incident,
      media: mediaRes.rows,
      analysis: analysisRes.rows[0] || null,
    });
  } catch (err: any) {
    console.error('getIncidentById error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve incident details.' });
  }
}

/**
 * Create a new incident report (runs AI classification & severity estimation)
 */
export async function createIncident(
  req: Request<{}, {}, CreateIncidentInput>,
  res: Response
): Promise<void> {
  const user = req.user!;
  const { description, category: userCategory, latitude, longitude, location_area, occurred_at } = req.body;

  const client = await getClient();

  try {
    // 1. Run AI analysis (outside DB transaction to prevent long open locks)
    const classification = await classifyIncident(description);
    const assignedCategory = userCategory || classification.category;
    const severityEstimate = await estimateSeverity(description, assignedCategory);

    // 2. Begin PostgreSQL Transaction
    await client.query('BEGIN');

    const occurredDate = occurred_at ? new Date(occurred_at) : new Date();

    const insertSql = `
      INSERT INTO incidents (
        user_id,
        description,
        category,
        ai_category,
        ai_confidence,
        severity,
        status,
        location,
        latitude,
        longitude,
        location_area,
        occurred_at,
        is_public
      )
      VALUES (
        $1,
        $2,
        $3::incident_category,
        $4::incident_category,
        $5,
        $6::incident_severity,
        'SUBMITTED',
        ST_SetSRID(ST_MakePoint($7, $8), 4326),
        $8,
        $7,
        $9,
        $10,
        false
      )
      RETURNING *
    `;

    const incRes = await client.query(insertSql, [
      user.id,
      description,
      assignedCategory,
      classification.category,
      classification.confidence,
      severityEstimate.severity,
      longitude,
      latitude,
      location_area || null,
      occurredDate,
    ]);

    const newIncident = incRes.rows[0];

    // 3. Store AI analysis record atomically inside transaction
    await client.query(
      `INSERT INTO incident_analysis (
        incident_id,
        predicted_category,
        category_confidence,
        predicted_severity,
        severity_confidence,
        model_version
      )
      VALUES ($1, $2::incident_category, $3, $4::incident_severity, $5, $6)`,
      [
        newIncident.id,
        classification.category,
        classification.confidence,
        severityEstimate.severity,
        severityEstimate.confidence,
        classification.modelVersion,
      ]
    );

    await client.query('COMMIT');
    client.release();

    // 4. Log Audit & Notifications (post-commit)
    await logAudit({
      userId: user.id,
      action: 'INCIDENT_CREATED',
      entityType: 'incidents',
      entityId: newIncident.id,
      metadata: { category: assignedCategory, severity: severityEstimate.severity, area: location_area },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // 5. Notify Staff via WebSockets
    broadcastToRole('MODERATOR', 'incident:new', {
      ...newIncident,
      reporter_name: user.name,
      reporter_email: user.email,
    });
    broadcastToRole('ADMIN', 'incident:new', {
      ...newIncident,
      reporter_name: user.name,
      reporter_email: user.email,
    });

    // Notify user of report submission
    await createNotification(
      user.id,
      'Incident Submitted',
      `Your report for "${assignedCategory.replace('_', ' ')}" has been received and queued for review.`,
      'STATUS_CHANGE',
      newIncident.id
    );

    res.status(201).json({
      message: 'Incident report submitted successfully.',
      incident: newIncident,
      aiAnalysis: {
        predictedCategory: classification.category,
        confidence: classification.confidence,
        predictedSeverity: severityEstimate.severity,
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    console.error('createIncident error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to submit incident report.' });
  }
}

/**
 * Update incident status (MODERATOR or ADMIN only)
 */
export async function updateIncidentStatus(
  req: Request<{ id: string }, {}, UpdateIncidentStatusInput>,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const { status, moderation_notes, is_public } = req.body;
  const user = req.user!;

  try {
    // Fetch previous status
    const currentRes = await query('SELECT * FROM incidents WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Incident not found.' });
      return;
    }

    const current = currentRes.rows[0];
    const shouldBePublic = is_public !== undefined ? is_public : status === 'VERIFIED' || status === 'RESOLVED';

    const updateRes = await query(
      `UPDATE incidents
       SET status = $1::incident_status,
           is_public = $2,
           moderation_notes = COALESCE($3, moderation_notes),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, shouldBePublic, moderation_notes || null, id]
    );

    const updatedIncident = updateRes.rows[0];

    // Log Audit
    await logAudit({
      userId: user.id,
      action: 'STATUS_CHANGED',
      entityType: 'incidents',
      entityId: id,
      metadata: { old_status: current.status, new_status: status, notes: moderation_notes },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Notify original reporter
    await createNotification(
      updatedIncident.user_id,
      `Report Status Updated: ${status}`,
      `Your report (#${id.substring(0, 8)}) status changed from ${current.status} to ${status}.${
        moderation_notes ? ` Note: ${moderation_notes}` : ''
      }`,
      'STATUS_CHANGE',
      id
    );

    // Real-time broadcast
    if (shouldBePublic && status === 'VERIFIED') {
      broadcastPublic('incident:verified', updatedIncident);
    }
    broadcastToRole('MODERATOR', 'incident:updated', updatedIncident);
    broadcastToRole('ADMIN', 'incident:updated', updatedIncident);
    broadcastToUser(updatedIncident.user_id, 'incident:my_update', updatedIncident);

    res.json({
      message: `Incident status updated to ${status}.`,
      incident: updatedIncident,
    });
  } catch (err: any) {
    console.error('updateIncidentStatus error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update incident status.' });
  }
}

/**
 * Update incident moderation details (MODERATOR or ADMIN only)
 */
export async function updateIncidentModeration(
  req: Request<{ id: string }, {}, UpdateIncidentModerationInput>,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const { category, severity, status, moderation_notes, is_public } = req.body;
  const user = req.user!;

  try {
    const fields: string[] = [];
    const params: unknown[] = [id];
    let idx = 2;

    if (category) {
      fields.push(`category = $${idx++}::incident_category`);
      params.push(category);
    }
    if (severity) {
      fields.push(`severity = $${idx++}::incident_severity`);
      params.push(severity);
    }
    if (status) {
      fields.push(`status = $${idx++}::incident_status`);
      params.push(status);
    }
    if (moderation_notes !== undefined) {
      fields.push(`moderation_notes = $${idx++}`);
      params.push(moderation_notes);
    }
    if (is_public !== undefined) {
      fields.push(`is_public = $${idx++}`);
      params.push(is_public);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'No fields provided for update.' });
      return;
    }

    fields.push(`updated_at = NOW()`);

    const updateSql = `
      UPDATE incidents
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const resUpdate = await query(updateSql, params);
    if (resUpdate.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Incident not found.' });
      return;
    }

    const updated = resUpdate.rows[0];

    await logAudit({
      userId: user.id,
      action: 'MODERATION_UPDATED',
      entityType: 'incidents',
      entityId: id,
      metadata: { category, severity, status, moderation_notes, is_public },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Incident moderation details updated.',
      incident: updated,
    });
  } catch (err: any) {
    console.error('updateIncidentModeration error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update moderation details.' });
  }
}
