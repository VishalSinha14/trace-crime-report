/**
 * TRACE Database Seed Script
 * Generates 10,000+ realistic incidents around Pune, India
 * Plus demo users (citizen, moderator, admin)
 *
 * Run: npx tsx database/seeds/seed.ts
 */

import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'backend/.env');
dotenv.config({ path: envPath });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'trace_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// ─── Configuration ──────────────────────────────────────────────────────────

const TOTAL_INCIDENTS = 10000;
const BATCH_SIZE = 500;

// Pune, India - center coordinates and bounding box
const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };
const PUNE_BOUNDS = {
  minLat: 18.42, maxLat: 18.65,
  minLng: 73.75, maxLng: 74.00,
};

// Named areas in Pune for realistic location_area values
const PUNE_AREAS = [
  'Shivajinagar', 'Koregaon Park', 'Kothrud', 'Deccan Gymkhana',
  'FC Road', 'JM Road', 'MG Road', 'Camp', 'Swargate',
  'Hadapsar', 'Viman Nagar', 'Aundh', 'Baner', 'Hinjewadi',
  'Wakad', 'Pimpri', 'Chinchwad', 'Kharadi', 'Magarpatta',
  'Kalyani Nagar', 'Yerawada', 'Mundhwa', 'Wanowrie', 'Kondhwa',
  'Bibwewadi', 'Katraj', 'Dhankawadi', 'Salisbury Park', 'Boat Club Road',
  'Law College Road', 'Prabhat Road', 'Senapati Bapat Road', 'Model Colony',
  'Pashan', 'Bavdhan', 'Warje', 'Karve Nagar', 'Pune Station Area',
  'Laxmi Road', 'Tulshibagwale Colony', 'Sahakarnagar', 'Parvati',
];

// Category-specific data for realistic descriptions
const INCIDENT_DATA: Record<string, { descriptions: string[]; hotspotAreas: string[]; timeWeight: 'day' | 'night' | 'evening' | 'any' }> = {
  THEFT_SNATCHING: {
    descriptions: [
      'Someone snatched my phone while I was walking near {area}.',
      'My bag was stolen from the auto rickshaw stand near {area}.',
      'Chain snatching incident while riding a two-wheeler near {area}.',
      'Wallet pickpocketed in the crowded market area of {area}.',
      'Phone was snatched by two men on a bike near {area} bus stop.',
      'Laptop bag stolen from the coffee shop at {area}.',
      'Gold chain was snatched while waiting at the signal near {area}.',
      'Purse was stolen while shopping in {area} market.',
      'Phone snatching incident near {area} metro station.',
      'Someone took my bag from the parked vehicle near {area}.',
      'Two people on a motorcycle snatched my earphones and phone near {area}.',
      'My wallet was pickpocketed in the bus near {area}.',
    ],
    hotspotAreas: ['FC Road', 'MG Road', 'Pune Station Area', 'Swargate', 'Laxmi Road', 'Camp'],
    timeWeight: 'evening',
  },
  ASSAULT: {
    descriptions: [
      'Was physically assaulted by unknown persons near {area}.',
      'A group of people attacked a pedestrian near {area} at night.',
      'Road rage incident led to physical assault near {area}.',
      'Was hit by an unknown person near {area} after an argument.',
      'Assault reported near {area} parking lot.',
      'Physical altercation between two groups near {area}.',
      'A delivery person was assaulted near {area}.',
      'Someone was beaten by unknown people near {area} late night.',
    ],
    hotspotAreas: ['Yerawada', 'Hadapsar', 'Camp', 'Pune Station Area', 'Swargate'],
    timeWeight: 'night',
  },
  BURGLARY: {
    descriptions: [
      'House break-in reported at residential area in {area}.',
      'Shop was broken into during the night in {area}.',
      'Burglary at a flat in {area} while the family was away.',
      'Office was broken into and electronics were stolen in {area}.',
      'Attempted break-in at the ground-floor apartment in {area}.',
      'Warehouse burglary reported near {area} industrial area.',
      'Jewelry and cash stolen during house burglary in {area}.',
    ],
    hotspotAreas: ['Kothrud', 'Aundh', 'Baner', 'Kalyani Nagar', 'Viman Nagar'],
    timeWeight: 'night',
  },
  VANDALISM: {
    descriptions: [
      'Car windows smashed in the parking area near {area}.',
      'Public property damaged near {area} bus stop.',
      'Wall graffiti and property defacement reported in {area}.',
      'Street lights broken near {area} residential colony.',
      'Someone scratched multiple parked cars in {area}.',
      'Park benches and playground equipment damaged in {area}.',
      'Shop shutters damaged overnight in {area} market.',
    ],
    hotspotAreas: ['Deccan Gymkhana', 'Model Colony', 'Sahakarnagar', 'Parvati'],
    timeWeight: 'night',
  },
  HARASSMENT: {
    descriptions: [
      'Verbal harassment reported near {area} college area.',
      'Stalking incident reported near {area}.',
      'Eve teasing reported near {area} bus stop.',
      'Harassment at workplace reported in {area} IT park.',
      'Cyber stalking complaint from resident of {area}.',
      'Group of individuals harassing pedestrians near {area}.',
      'Repeated threatening phone calls reported from {area} resident.',
    ],
    hotspotAreas: ['FC Road', 'JM Road', 'Koregaon Park', 'Hinjewadi', 'Magarpatta'],
    timeWeight: 'evening',
  },
  FRAUD: {
    descriptions: [
      'Online payment fraud reported by resident of {area}.',
      'Fake job offer scam reported from {area}.',
      'Investment fraud involving large amount reported from {area}.',
      'Credit card fraud reported by {area} resident.',
      'Real estate fraud involving fake property papers in {area}.',
      'Insurance fraud reported at office in {area}.',
      'UPI payment fraud through fake link reported from {area}.',
    ],
    hotspotAreas: ['Hinjewadi', 'Kharadi', 'Magarpatta', 'Viman Nagar', 'Baner'],
    timeWeight: 'day',
  },
  CYBERCRIME: {
    descriptions: [
      'Bank account hacked, unauthorized transactions reported from {area}.',
      'Social media account hacked and misused, victim from {area}.',
      'Ransomware attack on small business in {area}.',
      'Phishing email led to data breach for {area} company.',
      'Online extortion through compromised photos reported from {area}.',
      'Identity theft reported by {area} resident.',
    ],
    hotspotAreas: ['Hinjewadi', 'Kharadi', 'Magarpatta', 'Baner', 'Wakad'],
    timeWeight: 'any',
  },
  ROBBERY: {
    descriptions: [
      'Armed robbery at a convenience store in {area}.',
      'Robbery reported near ATM in {area} at night.',
      'Robbed at knifepoint near {area} underpass.',
      'Vehicle was stopped and valuables taken near {area}.',
      'Delivery person robbed near {area} isolated road.',
      'Group robbery reported near {area} construction site.',
    ],
    hotspotAreas: ['Hadapsar', 'Mundhwa', 'Kondhwa', 'Katraj', 'Dhankawadi'],
    timeWeight: 'night',
  },
  VEHICLE_RELATED: {
    descriptions: [
      'Two-wheeler stolen from parking near {area}.',
      'Car stolen from residential parking in {area}.',
      'Hit and run incident reported near {area}.',
      'Vehicle break-in and theft of belongings near {area}.',
      'Reckless driving causing damage to parked vehicles in {area}.',
      'Stolen vehicle parts from parking lot in {area}.',
      'Auto theft reported from the mall parking in {area}.',
    ],
    hotspotAreas: ['Pune Station Area', 'Swargate', 'Hadapsar', 'Pimpri', 'Chinchwad'],
    timeWeight: 'night',
  },
  OTHER: {
    descriptions: [
      'Suspicious activity reported near {area} school.',
      'Unidentified package found near {area} bus stop.',
      'Loud noise disturbance reported in {area} residential area.',
      'Illegal dumping of waste near {area}.',
      'Public nuisance complaint from {area} residents.',
      'Suspicious persons loitering near {area} ATM.',
    ],
    hotspotAreas: PUNE_AREAS.slice(0, 10),
    timeWeight: 'any',
  },
};

const CATEGORIES = Object.keys(INCIDENT_DATA) as Array<keyof typeof INCIDENT_DATA>;

// Category weights for realistic distribution
const CATEGORY_WEIGHTS: Record<string, number> = {
  THEFT_SNATCHING: 0.25,
  ASSAULT: 0.08,
  BURGLARY: 0.10,
  VANDALISM: 0.10,
  HARASSMENT: 0.12,
  FRAUD: 0.12,
  CYBERCRIME: 0.06,
  ROBBERY: 0.05,
  VEHICLE_RELATED: 0.08,
  OTHER: 0.04,
};

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'FORWARDED', 'INVESTIGATING', 'RESOLVED', 'REJECTED'] as const;
const STATUS_WEIGHTS = [0.08, 0.07, 0.45, 0.05, 0.10, 0.20, 0.05];

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

// ─── Utility Functions ──────────────────────────────────────────────────────

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick<T>(items: T[], weights: number[]): T {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < items.length; i++) {
    cum += weights[i];
    if (r <= cum) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Generate a random coordinate near Pune with clustering around hotspot areas
 */
function generateCoordinate(hotspotAreas: string[]): { lat: number; lng: number; area: string } {
  // 60% chance to cluster near a hotspot area
  if (Math.random() < 0.6) {
    const area = pick(hotspotAreas);
    const areaIdx = PUNE_AREAS.indexOf(area);
    // Distribute areas roughly across Pune
    const baseLat = PUNE_CENTER.lat + (areaIdx % 7 - 3) * 0.012 + random(-0.008, 0.008);
    const baseLng = PUNE_CENTER.lng + (Math.floor(areaIdx / 7) - 3) * 0.015 + random(-0.010, 0.010);
    return {
      lat: Math.max(PUNE_BOUNDS.minLat, Math.min(PUNE_BOUNDS.maxLat, baseLat)),
      lng: Math.max(PUNE_BOUNDS.minLng, Math.min(PUNE_BOUNDS.maxLng, baseLng)),
      area,
    };
  }

  // 40% random spread
  return {
    lat: random(PUNE_BOUNDS.minLat, PUNE_BOUNDS.maxLat),
    lng: random(PUNE_BOUNDS.minLng, PUNE_BOUNDS.maxLng),
    area: pick(PUNE_AREAS),
  };
}

/**
 * Generate a realistic timestamp within the last N months
 */
function generateTimestamp(timeWeight: string): Date {
  const now = new Date();
  const monthsBack = randomInt(0, 11);
  const date = new Date(now);
  date.setMonth(date.getMonth() - monthsBack);
  date.setDate(randomInt(1, 28));

  let hour: number;
  switch (timeWeight) {
    case 'night':
      hour = Math.random() < 0.7 ? randomInt(20, 23) : randomInt(0, 5);
      break;
    case 'evening':
      hour = Math.random() < 0.6 ? randomInt(17, 22) : randomInt(8, 16);
      break;
    case 'day':
      hour = Math.random() < 0.7 ? randomInt(9, 17) : randomInt(18, 23);
      break;
    default:
      hour = randomInt(0, 23);
  }

  date.setHours(hour, randomInt(0, 59), randomInt(0, 59));
  return date;
}

function getSeverityForCategory(category: string): typeof SEVERITIES[number] {
  switch (category) {
    case 'ASSAULT':
    case 'ROBBERY':
      return weightedPick([...SEVERITIES], [0.05, 0.25, 0.45, 0.25]);
    case 'BURGLARY':
      return weightedPick([...SEVERITIES], [0.10, 0.35, 0.40, 0.15]);
    case 'THEFT_SNATCHING':
    case 'VEHICLE_RELATED':
      return weightedPick([...SEVERITIES], [0.15, 0.50, 0.30, 0.05]);
    case 'HARASSMENT':
      return weightedPick([...SEVERITIES], [0.20, 0.45, 0.30, 0.05]);
    case 'FRAUD':
    case 'CYBERCRIME':
      return weightedPick([...SEVERITIES], [0.15, 0.40, 0.35, 0.10]);
    case 'VANDALISM':
      return weightedPick([...SEVERITIES], [0.35, 0.45, 0.15, 0.05]);
    default:
      return weightedPick([...SEVERITIES], [0.30, 0.40, 0.20, 0.10]);
  }
}

// Simple password hash (for seed data only — real auth uses bcrypt)
function simpleHash(password: string): string {
  return crypto.createHash('sha256').update(password + 'trace_salt').digest('hex');
}

// ─── Seed Functions ─────────────────────────────────────────────────────────

async function seedUsers(): Promise<string[]> {
  console.log('👥 Seeding users...');

  const users = [
    { name: 'Admin User', email: 'admin@trace.dev', password: 'admin123', role: 'ADMIN' },
    { name: 'Moderator User', email: 'moderator@trace.dev', password: 'mod123', role: 'MODERATOR' },
    { name: 'Citizen User', email: 'citizen@trace.dev', password: 'citizen123', role: 'CITIZEN' },
    // Additional demo citizens
    { name: 'Rahul Sharma', email: 'rahul@example.com', password: 'test123', role: 'CITIZEN' },
    { name: 'Priya Patel', email: 'priya@example.com', password: 'test123', role: 'CITIZEN' },
    { name: 'Amit Kumar', email: 'amit@example.com', password: 'test123', role: 'CITIZEN' },
    { name: 'Sneha Joshi', email: 'sneha@example.com', password: 'test123', role: 'CITIZEN' },
    { name: 'Vikram Singh', email: 'vikram@example.com', password: 'test123', role: 'CITIZEN' },
    { name: 'Ananya Deshmukh', email: 'ananya@example.com', password: 'test123', role: 'CITIZEN' },
    { name: 'Rohan Kulkarni', email: 'rohan@example.com', password: 'test123', role: 'CITIZEN' },
  ];

  const userIds: string[] = [];

  for (const user of users) {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4::user_role)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [user.name, user.email, simpleHash(user.password), user.role]
    );
    userIds.push(result.rows[0].id);
    console.log(`  ✅ ${user.role}: ${user.email}`);
  }

  return userIds;
}

async function seedIncidents(userIds: string[]): Promise<void> {
  console.log(`\n🚨 Seeding ${TOTAL_INCIDENTS.toLocaleString()} incidents...`);

  // Only citizen user IDs (index 2 onwards)
  const citizenIds = userIds.slice(2);

  let inserted = 0;

  while (inserted < TOTAL_INCIDENTS) {
    const batchCount = Math.min(BATCH_SIZE, TOTAL_INCIDENTS - inserted);
    const values: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    for (let i = 0; i < batchCount; i++) {
      const category = weightedPick(CATEGORIES, Object.values(CATEGORY_WEIGHTS));
      const catData = INCIDENT_DATA[category];
      const { lat, lng, area } = generateCoordinate(catData.hotspotAreas);
      const descTemplate = pick(catData.descriptions);
      const description = descTemplate.replace('{area}', area);
      const severity = getSeverityForCategory(category);
      const status = weightedPick([...STATUSES], STATUS_WEIGHTS);
      const isPublic = status === 'VERIFIED' || status === 'RESOLVED';
      const occurredAt = generateTimestamp(catData.timeWeight);
      const userId = pick(citizenIds);

      // AI confidence between 0.70 and 0.99
      const aiConfidence = (random(0.70, 0.99)).toFixed(4);

      values.push(
        `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}::incident_category, $${paramIdx + 3}::incident_category, $${paramIdx + 4}, $${paramIdx + 5}::incident_severity, $${paramIdx + 6}::incident_status, ST_SetSRID(ST_MakePoint($${paramIdx + 7}, $${paramIdx + 8}), 4326), $${paramIdx + 9}, $${paramIdx + 10}, $${paramIdx + 11}, $${paramIdx + 12}, $${paramIdx + 13})`
      );

      params.push(
        userId,       // user_id
        description,  // description
        category,     // category
        category,     // ai_category (same for seed)
        aiConfidence, // ai_confidence
        severity,     // severity
        status,       // status
        lng,          // longitude (ST_MakePoint takes X=lng, Y=lat)
        lat,          // latitude
        lat,          // latitude (denormalized)
        lng,          // longitude (denormalized)
        area,         // location_area
        occurredAt,   // occurred_at
        isPublic,     // is_public
      );

      paramIdx += 14;
    }

    const sql = `
      INSERT INTO incidents (user_id, description, category, ai_category, ai_confidence, severity, status, location, latitude, longitude, location_area, occurred_at, is_public)
      VALUES ${values.join(', ')}
    `;

    await pool.query(sql, params);
    inserted += batchCount;

    const pct = ((inserted / TOTAL_INCIDENTS) * 100).toFixed(0);
    process.stdout.write(`\r  📊 Progress: ${inserted.toLocaleString()} / ${TOTAL_INCIDENTS.toLocaleString()} (${pct}%)`);
  }

  console.log('\n  ✅ All incidents seeded');
}

async function seedAnalysis(): Promise<void> {
  console.log('\n🤖 Seeding AI analysis records...');

  // Create analysis records for all incidents
  await pool.query(`
    INSERT INTO incident_analysis (incident_id, predicted_category, category_confidence, predicted_severity, severity_confidence, model_version)
    SELECT
      id,
      COALESCE(ai_category, category, 'OTHER'),
      COALESCE(ai_confidence, 0.85),
      severity,
      ROUND((RANDOM() * 0.2 + 0.75)::numeric, 4),
      '1.0.0-seed'
    FROM incidents
    ON CONFLICT DO NOTHING
  `);

  console.log('  ✅ AI analysis records created');
}

async function printStats(): Promise<void> {
  console.log('\n📈 Database Statistics:');

  const tables = ['users', 'incidents', 'incident_analysis', 'notifications', 'audit_logs', 'corroborations'];
  for (const table of tables) {
    const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
    console.log(`  ${table}: ${parseInt(result.rows[0].count).toLocaleString()} rows`);
  }

  // Category breakdown
  const categories = await pool.query(`
    SELECT category, COUNT(*) as count
    FROM incidents
    GROUP BY category
    ORDER BY count DESC
  `);
  console.log('\n📊 Category Distribution:');
  for (const row of categories.rows) {
    const bar = '█'.repeat(Math.ceil(parseInt(row.count) / 200));
    console.log(`  ${row.category.padEnd(20)} ${row.count.toString().padStart(5)} ${bar}`);
  }

  // Status breakdown
  const statuses = await pool.query(`
    SELECT status, COUNT(*) as count
    FROM incidents
    GROUP BY status
    ORDER BY count DESC
  `);
  console.log('\n📋 Status Distribution:');
  for (const row of statuses.rows) {
    console.log(`  ${row.status.padEnd(20)} ${row.count.toString().padStart(5)}`);
  }

  // Spatial extent
  const extent = await pool.query(`
    SELECT
      ST_AsText(ST_Extent(location)) as extent,
      COUNT(*) FILTER (WHERE is_public = true) as public_count,
      COUNT(*) FILTER (WHERE status = 'VERIFIED') as verified_count
    FROM incidents
  `);
  console.log(`\n🌍 Spatial extent: ${extent.rows[0].extent}`);
  console.log(`🔓 Public incidents: ${extent.rows[0].public_count}`);
  console.log(`✅ Verified incidents: ${extent.rows[0].verified_count}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   TRACE Database Seed                    ║');
  console.log('║   10,000+ Incidents · Pune, India        ║');
  console.log('╚══════════════════════════════════════════╝\n');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await pool.query('TRUNCATE corroborations, audit_logs, notifications, incident_analysis, incident_media, incidents, users CASCADE');
    console.log('  ✅ Tables cleared\n');

    // Seed
    const userIds = await seedUsers();
    await seedIncidents(userIds);
    await seedAnalysis();
    await printStats();

    console.log('\n✅ Seed completed successfully!\n');
    console.log('Demo accounts:');
    console.log('  Admin:     admin@trace.dev     / admin123');
    console.log('  Moderator: moderator@trace.dev / mod123');
    console.log('  Citizen:   citizen@trace.dev   / citizen123\n');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
