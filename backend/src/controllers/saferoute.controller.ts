import { Request, Response } from 'express';
import axios from 'axios';
import { query } from '../utils/db';

// ─── Constants ──────────────────────────────────────────────────────────────

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';
const RISK_BUFFER_METERS = 300;       // Search radius around each sample point
const SAMPLE_SPACING_METERS = 200;    // Distance between sample points along route

// Severity weights for risk scoring
const SEVERITY_WEIGHT: Record<string, number> = {
  CRITICAL: 10,
  HIGH: 5,
  MEDIUM: 2,
  LOW: 1,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compute the distance in meters between two lat/lng points (Haversine formula)
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Sample points at regular intervals along a GeoJSON coordinate array.
 * coordinates = [[lng, lat], [lng, lat], ...]
 * Returns [[lat, lng], [lat, lng], ...] (note: flipped for PostGIS)
 */
function samplePointsAlongRoute(
  coordinates: [number, number][],
  spacingMeters: number
): { lat: number; lng: number }[] {
  if (coordinates.length === 0) return [];

  const samples: { lat: number; lng: number }[] = [];
  // Always include the start point
  samples.push({ lat: coordinates[0][1], lng: coordinates[0][0] });

  let accumulated = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const prevLng = coordinates[i - 1][0];
    const prevLat = coordinates[i - 1][1];
    const curLng = coordinates[i][0];
    const curLat = coordinates[i][1];

    const segmentDist = haversineDistance(prevLat, prevLng, curLat, curLng);
    accumulated += segmentDist;

    if (accumulated >= spacingMeters) {
      samples.push({ lat: curLat, lng: curLng });
      accumulated = 0;
    }
  }

  // Always include the end point
  const last = coordinates[coordinates.length - 1];
  const lastSample = samples[samples.length - 1];
  if (lastSample.lat !== last[1] || lastSample.lng !== last[0]) {
    samples.push({ lat: last[1], lng: last[0] });
  }

  return samples;
}

/**
 * Query PostGIS for incident risk at a single sample point.
 * Uses ST_DWithin with geography cast for accurate meter-based distance.
 */
async function computeRiskAtPoint(
  lat: number,
  lng: number,
  bufferMeters: number
): Promise<{
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  recent30d: number;
  recent90d: number;
}> {
  const sql = `
    SELECT 
      COUNT(*)::int AS total,
      COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END)::int AS critical,
      COUNT(CASE WHEN severity = 'HIGH' THEN 1 END)::int AS high,
      COUNT(CASE WHEN severity = 'MEDIUM' THEN 1 END)::int AS medium,
      COUNT(CASE WHEN severity = 'LOW' THEN 1 END)::int AS low,
      COUNT(CASE WHEN occurred_at > NOW() - INTERVAL '30 days' THEN 1 END)::int AS recent_30d,
      COUNT(CASE WHEN occurred_at > NOW() - INTERVAL '90 days' AND occurred_at <= NOW() - INTERVAL '30 days' THEN 1 END)::int AS recent_90d
    FROM incidents
    WHERE status = 'VERIFIED' AND is_public = true
      AND ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
  `;

  const result = await query(sql, [lng, lat, bufferMeters]);
  const row = result.rows[0];

  return {
    total: row.total || 0,
    critical: row.critical || 0,
    high: row.high || 0,
    medium: row.medium || 0,
    low: row.low || 0,
    recent30d: row.recent_30d || 0,
    recent90d: row.recent_90d || 0,
  };
}

/**
 * Compute a weighted risk score for an entire route by sampling and aggregating.
 */
async function computeRouteRisk(
  coordinates: [number, number][]
): Promise<{
  riskScore: number;
  safetyScore: number;
  incidentCountAlongRoute: number;
  breakdown: { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number };
  hotspots: { lat: number; lng: number; riskContribution: number }[];
}> {
  const samplePoints = samplePointsAlongRoute(coordinates, SAMPLE_SPACING_METERS);
  
  let totalRiskScore = 0;
  let totalIncidents = 0;
  const breakdown = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const hotspots: { lat: number; lng: number; riskContribution: number }[] = [];

  // Process sample points in parallel batches (max 10 concurrent)
  const batchSize = 10;
  for (let i = 0; i < samplePoints.length; i += batchSize) {
    const batch = samplePoints.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((pt) => computeRiskAtPoint(pt.lat, pt.lng, RISK_BUFFER_METERS))
    );

    results.forEach((risk, idx) => {
      const pt = batch[idx];
      
      // Base severity-weighted score
      let pointScore =
        risk.critical * SEVERITY_WEIGHT.CRITICAL +
        risk.high * SEVERITY_WEIGHT.HIGH +
        risk.medium * SEVERITY_WEIGHT.MEDIUM +
        risk.low * SEVERITY_WEIGHT.LOW;

      // Recency boost: recent incidents carry more weight
      const recencyBonus =
        risk.recent30d * 2.0 + risk.recent90d * 0.5;
      pointScore += recencyBonus;

      totalRiskScore += pointScore;
      totalIncidents += risk.total;

      breakdown.CRITICAL += risk.critical;
      breakdown.HIGH += risk.high;
      breakdown.MEDIUM += risk.medium;
      breakdown.LOW += risk.low;

      // Track high-risk sample points for visualization
      if (pointScore > 5) {
        hotspots.push({
          lat: pt.lat,
          lng: pt.lng,
          riskContribution: Math.round(pointScore),
        });
      }
    });
  }

  // Normalize: average risk density per sample point along corridor
  const sampleCount = Math.max(1, samplePoints.length);
  const avgRiskPerSample = totalRiskScore / sampleCount;

  // Safety score: 100 for zero incidents, smooth decay based on local incident density
  let safetyScore = 100;
  if (totalRiskScore > 0) {
    const rawScore = 100 / (1 + Math.pow(avgRiskPerSample / 6, 1.15));
    safetyScore = Math.max(8, Math.min(98, Math.round(rawScore)));
  }

  return {
    riskScore: Math.round(totalRiskScore),
    safetyScore,
    incidentCountAlongRoute: totalIncidents,
    breakdown,
    hotspots,
  };
}

// ─── Controller ─────────────────────────────────────────────────────────────

/**
 * GET /api/map/safe-route
 * Compute safest vs fastest routes between two points using OSRM + PostGIS.
 */
export async function getSafeRoute(req: Request, res: Response): Promise<void> {
  const { originLat, originLng, destLat, destLng, mode = 'walking' } = req.query;

  // Validate inputs
  if (!originLat || !originLng || !destLat || !destLng) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'originLat, originLng, destLat, and destLng are required.',
    });
    return;
  }

  const oLat = Number(originLat);
  const oLng = Number(originLng);
  const dLat = Number(destLat);
  const dLng = Number(destLng);

  if ([oLat, oLng, dLat, dLng].some(isNaN)) {
    res.status(400).json({ error: 'Bad Request', message: 'Coordinates must be valid numbers.' });
    return;
  }

  // Validate mode
  const profile = mode === 'driving' ? 'car' : 'foot';

  try {
    // 1. Fetch alternative routes from OSRM
    const osrmUrl = `${OSRM_BASE}/${profile}/${oLng},${oLat};${dLng},${dLat}?alternatives=3&overview=full&geometries=geojson&steps=false`;
    
    const osrmRes = await axios.get(osrmUrl, { timeout: 10000 });

    if (osrmRes.data.code !== 'Ok' || !osrmRes.data.routes?.length) {
      res.status(404).json({
        error: 'No Route Found',
        message: 'OSRM could not find a route between the given points.',
      });
      return;
    }

    // 2. Score each route with PostGIS risk analysis
    const scoredRoutes = await Promise.all(
      osrmRes.data.routes.map(async (route: any, index: number) => {
        const coordinates: [number, number][] = route.geometry.coordinates;
        const risk = await computeRouteRisk(coordinates);

        return {
          id: index,
          name: index === 0 ? 'Primary Route' : `Alternative ${index}`,
          geometry: route.geometry,
          distance_km: Math.round((route.distance / 1000) * 100) / 100,
          duration_min: Math.round(route.duration / 60),
          safety_score: risk.safetyScore,
          risk_score: risk.riskScore,
          incident_count_along_route: risk.incidentCountAlongRoute,
          risk_breakdown: risk.breakdown,
          hotspots: risk.hotspots,
        };
      })
    );

    // 3. Sort by safety score (safest first)
    scoredRoutes.sort((a: any, b: any) => b.safety_score - a.safety_score);

    // Label the sorted routes
    if (scoredRoutes.length >= 1) scoredRoutes[0].name = 'Safest Route';
    if (scoredRoutes.length >= 2) {
      // Find the fastest (shortest duration) among remaining
      const fastest = scoredRoutes.slice(1).reduce(
        (min: any, r: any) => (r.duration_min < min.duration_min ? r : min),
        scoredRoutes[1]
      );
      fastest.name = 'Fastest Route';
    }

    res.json({
      routes: scoredRoutes,
      origin: { lat: oLat, lng: oLng },
      destination: { lat: dLat, lng: dLng },
      mode: mode === 'driving' ? 'driving' : 'walking',
    });
  } catch (err: any) {
    if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'OSRM routing service is temporarily unavailable. Please try again.',
      });
      return;
    }
    console.error('getSafeRoute error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to compute safe route.',
    });
  }
}
