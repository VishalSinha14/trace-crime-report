import { Request, Response } from 'express';
import { query } from '../utils/db';

/**
 * Return incidents within a bounding box for map pins
 */
export async function getMapIncidents(req: Request, res: Response): Promise<void> {
  const user = req.user;
  const isStaff = user && (user.role === 'MODERATOR' || user.role === 'ADMIN');

  const {
    minLat = '18.42',
    maxLat = '18.65',
    minLng = '73.75',
    maxLng = '74.00',
    category,
    severity,
    status,
    limit = '1500',
  } = req.query;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  // Spatial bounding box condition
  conditions.push(`location && ST_MakeEnvelope($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, 4326)`);
  params.push(Number(minLng), Number(minLat), Number(maxLng), Number(maxLat));

  // Role-based visibility
  if (!isStaff) {
    conditions.push(`status = 'VERIFIED' AND is_public = true`);
  } else if (status) {
    conditions.push(`status = $${paramIdx++}::incident_status`);
    params.push(status);
  }

  if (category) {
    conditions.push(`category = $${paramIdx++}::incident_category`);
    params.push(category);
  }

  if (severity) {
    conditions.push(`severity = $${paramIdx++}::incident_severity`);
    params.push(severity);
  }

  const maxPoints = Math.min(2500, Math.max(10, Number(limit)));
  params.push(maxPoints);

  const sql = `
    SELECT 
      id,
      description,
      category,
      severity,
      status,
      latitude,
      longitude,
      location_area,
      occurred_at,
      credibility_score,
      (SELECT COUNT(*) FROM corroborations c WHERE c.incident_id = incidents.id)::int AS corroboration_count
    FROM incidents
    WHERE ${conditions.join(' AND ')}
    ORDER BY occurred_at DESC
    LIMIT $${paramIdx}
  `;

  try {
    const result = await query(sql, params);
    res.json({
      count: result.rows.length,
      incidents: result.rows,
    });
  } catch (err: any) {
    console.error('getMapIncidents error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve map incidents.' });
  }
}

/**
 * Grid-based spatial clustering using PostGIS ST_SnapToGrid
 * Highly optimized for rendering thousands of points across zoom levels
 */
export async function getMapClusters(req: Request, res: Response): Promise<void> {
  const user = req.user;
  const isStaff = user && (user.role === 'MODERATOR' || user.role === 'ADMIN');
  const { gridSize = '0.015', category, severity } = req.query;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (!isStaff) {
    conditions.push(`status = 'VERIFIED' AND is_public = true`);
  }

  if (category) {
    conditions.push(`category = $${idx++}::incident_category`);
    params.push(category);
  }

  if (severity) {
    conditions.push(`severity = $${idx++}::incident_severity`);
    params.push(severity);
  }

  const grid = Math.max(0.002, Math.min(0.1, Number(gridSize)));
  params.push(grid);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      COUNT(*)::int AS count,
      ROUND(AVG(latitude)::numeric, 6)::float AS latitude,
      ROUND(AVG(longitude)::numeric, 6)::float AS longitude,
      (ARRAY_AGG(location_area))[1] AS sample_area,
      COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END)::int AS critical_count,
      COUNT(CASE WHEN severity = 'HIGH' THEN 1 END)::int AS high_count,
      COUNT(CASE WHEN severity = 'MEDIUM' THEN 1 END)::int AS medium_count,
      COUNT(CASE WHEN severity = 'LOW' THEN 1 END)::int AS low_count
    FROM incidents
    ${where}
    GROUP BY ST_SnapToGrid(location, $${idx})
    HAVING COUNT(*) > 0
    ORDER BY count DESC
    LIMIT 500
  `;

  try {
    const result = await query(sql, params);
    res.json({
      clusters: result.rows,
    });
  } catch (err: any) {
    console.error('getMapClusters error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to compute map clusters.' });
  }
}

/**
 * Return heatmap coordinates with severity weighting
 */
export async function getMapHeatmap(req: Request, res: Response): Promise<void> {
  const user = req.user;
  const isStaff = user && (user.role === 'MODERATOR' || user.role === 'ADMIN');

  const conditions: string[] = [];
  if (!isStaff) {
    conditions.push(`status = 'VERIFIED' AND is_public = true`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      latitude,
      longitude,
      CASE 
        WHEN severity = 'CRITICAL' THEN 1.0
        WHEN severity = 'HIGH' THEN 0.75
        WHEN severity = 'MEDIUM' THEN 0.5
        ELSE 0.25
      END AS weight
    FROM incidents
    ${where}
    ORDER BY occurred_at DESC
    LIMIT 5000
  `;

  try {
    const result = await query(sql);
    res.json({
      points: result.rows.map((r) => [r.latitude, r.longitude, r.weight]),
    });
  } catch (err: any) {
    console.error('getMapHeatmap error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve heatmap points.' });
  }
}

/**
 * Nearby incidents query using PostGIS ST_DWithin (geography)
 */
export async function getNearbyIncidents(req: Request, res: Response): Promise<void> {
  const { lat, lng, radiusKm = '3' } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ error: 'Bad Request', message: 'lat and lng query parameters are required.' });
    return;
  }

  const latitude = Number(lat);
  const longitude = Number(lng);
  const radiusMeters = Math.min(25000, Math.max(100, Number(radiusKm) * 1000));

  try {
    const sql = `
      SELECT 
        id,
        description,
        category,
        severity,
        status,
        latitude,
        longitude,
        location_area,
        occurred_at,
        ROUND(ST_Distance(
          location::geography, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        )::numeric, 0)::int AS distance_meters
      FROM incidents
      WHERE status = 'VERIFIED' AND is_public = true
        AND ST_DWithin(
          location::geography, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 
          $3
        )
      ORDER BY distance_meters ASC
      LIMIT 100
    `;

    const result = await query(sql, [longitude, latitude, radiusMeters]);

    // Compute localized safety score
    const total = result.rows.length;
    let riskPoints = 0;
    for (const inc of result.rows) {
      if (inc.severity === 'CRITICAL') riskPoints += 10;
      else if (inc.severity === 'HIGH') riskPoints += 5;
      else if (inc.severity === 'MEDIUM') riskPoints += 2;
      else riskPoints += 1;
    }

    // Safety score out of 100 (100 is safest)
    const safetyScore = Math.max(10, Math.min(100, Math.round(100 - riskPoints * 1.2)));

    res.json({
      safetyScore,
      radiusKm: Number(radiusKm),
      totalIncidentsNearby: total,
      incidents: result.rows,
    });
  } catch (err: any) {
    console.error('getNearbyIncidents error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve nearby incidents.' });
  }
}
