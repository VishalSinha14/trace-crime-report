import { Request, Response } from 'express';
import { query } from '../utils/db';

export async function getAnalyticsOverview(req: Request, res: Response): Promise<void> {
  const user = req.user;
  const isStaff = user && (user.role === 'MODERATOR' || user.role === 'ADMIN');

  try {
    // 1. Overall Status Counts
    const statusSql = `
      SELECT status, COUNT(*)::int AS count
      FROM incidents
      GROUP BY status
    `;
    const statusRes = await query(statusSql);

    const counts: Record<string, number> = {
      total: 0,
      submitted: 0,
      under_review: 0,
      verified: 0,
      forwarded: 0,
      investigating: 0,
      resolved: 0,
      rejected: 0,
    };

    let total = 0;
    for (const row of statusRes.rows) {
      const c = row.count;
      total += c;
      const key = (row.status as string).toLowerCase();
      if (counts[key] !== undefined) counts[key] = c;
    }
    counts.total = total;

    // 2. Category Breakdown
    // If not staff, count only verified & public
    const catWhere = isStaff ? '' : "WHERE status = 'VERIFIED' AND is_public = true";
    const catSql = `
      SELECT category, COUNT(*)::int AS count
      FROM incidents
      ${catWhere}
      GROUP BY category
      ORDER BY count DESC
    `;
    const catRes = await query(catSql);

    // 3. Severity Breakdown
    const sevSql = `
      SELECT severity, COUNT(*)::int AS count
      FROM incidents
      ${catWhere}
      GROUP BY severity
      ORDER BY 
        CASE severity 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          WHEN 'LOW' THEN 4 
        END
    `;
    const sevRes = await query(sevSql);

    // 4. Daily Trend for Past 30 Days
    const trendSql = `
      SELECT 
        TO_CHAR(occurred_at, 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS count,
        COUNT(CASE WHEN severity IN ('HIGH', 'CRITICAL') THEN 1 END)::int AS high_severity_count
      FROM incidents
      ${catWhere ? catWhere + ' AND' : 'WHERE'} occurred_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(occurred_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;
    const trendRes = await query(trendSql);

    res.json({
      counts,
      categories: catRes.rows,
      severities: sevRes.rows,
      dailyTrend: trendRes.rows,
    });
  } catch (err: any) {
    console.error('getAnalyticsOverview error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch analytics overview.' });
  }
}

export async function getHotspots(req: Request, res: Response): Promise<void> {
  const user = req.user;
  const isStaff = user && (user.role === 'MODERATOR' || user.role === 'ADMIN');
  const where = isStaff ? '' : "WHERE status = 'VERIFIED' AND is_public = true";

  try {
    const sql = `
      SELECT 
        location_area AS area,
        COUNT(*)::int AS total_incidents,
        ROUND(AVG(latitude)::numeric, 5)::float AS latitude,
        ROUND(AVG(longitude)::numeric, 5)::float AS longitude,
        COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END)::int AS critical_count,
        COUNT(CASE WHEN severity = 'HIGH' THEN 1 END)::int AS high_count,
        COUNT(CASE WHEN severity = 'MEDIUM' THEN 1 END)::int AS medium_count,
        COUNT(CASE WHEN severity = 'LOW' THEN 1 END)::int AS low_count,
        MODE() WITHIN GROUP (ORDER BY category) AS top_category
      FROM incidents
      ${where}
      GROUP BY location_area
      HAVING location_area IS NOT NULL
      ORDER BY total_incidents DESC
      LIMIT 20
    `;

    const result = await query(sql);
    res.json({
      hotspots: result.rows,
    });
  } catch (err: any) {
    console.error('getHotspots error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve hotspots.' });
  }
}

export async function getTemporalPatterns(req: Request, res: Response): Promise<void> {
  const user = req.user;
  const isStaff = user && (user.role === 'MODERATOR' || user.role === 'ADMIN');
  const where = isStaff ? '' : "WHERE status = 'VERIFIED' AND is_public = true";

  try {
    // By hour of day (0-23)
    const hourlySql = `
      SELECT 
        EXTRACT(HOUR FROM occurred_at)::int AS hour,
        COUNT(*)::int AS count,
        COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END)::int AS critical_count,
        COUNT(CASE WHEN severity = 'HIGH' THEN 1 END)::int AS high_count
      FROM incidents
      ${where}
      GROUP BY EXTRACT(HOUR FROM occurred_at)
      ORDER BY hour ASC
    `;
    const hourlyRes = await query(hourlySql);

    // By day of week (0=Sunday ... 6=Saturday)
    const dowSql = `
      SELECT 
        TO_CHAR(occurred_at, 'Day') AS day_name,
        EXTRACT(DOW FROM occurred_at)::int AS day_of_week,
        COUNT(*)::int AS count
      FROM incidents
      ${where}
      GROUP BY TO_CHAR(occurred_at, 'Day'), EXTRACT(DOW FROM occurred_at)
      ORDER BY day_of_week ASC
    `;
    const dowRes = await query(dowSql);

    res.json({
      hourly: hourlyRes.rows,
      dayOfWeek: dowRes.rows,
    });
  } catch (err: any) {
    console.error('getTemporalPatterns error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve temporal analytics.' });
  }
}

export async function getAIMetrics(_req: Request, res: Response): Promise<void> {
  try {
    const metricsSql = `
      SELECT 
        COUNT(*)::int AS total_analyzed,
        ROUND(AVG(category_confidence)::numeric, 4)::float AS avg_category_confidence,
        ROUND(AVG(severity_confidence)::numeric, 4)::float AS avg_severity_confidence,
        model_version,
        COUNT(CASE WHEN category_confidence >= 0.85 THEN 1 END)::int AS high_confidence_count,
        COUNT(CASE WHEN category_confidence < 0.60 THEN 1 END)::int AS low_confidence_count
      FROM incident_analysis
      GROUP BY model_version
    `;
    const metricsRes = await query(metricsSql);

    res.json({
      metrics: metricsRes.rows,
    });
  } catch (err: any) {
    console.error('getAIMetrics error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve AI metrics.' });
  }
}
