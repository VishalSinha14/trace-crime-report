import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting TRACE Backend API End-to-End Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`, err.response?.data || err.message);
      failed++;
    }
  }

  // 1. Health Check
  await test('GET /health returns 200 with DB & PostGIS connected', async () => {
    const res = await axios.get(`${API_BASE}/health`);
    if (res.data.status !== 'ok' || res.data.database !== 'connected') {
      throw new Error(`Unexpected health response: ${JSON.stringify(res.data)}`);
    }
  });

  // 2. Auth: Citizen Login
  let citizenToken = '';
  let citizenUser: any;
  await test('POST /auth/login as Citizen (citizen@trace.dev / citizen123)', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'citizen@trace.dev',
      password: 'citizen123',
    });
    if (!res.data.token || res.data.user.role !== 'CITIZEN') {
      throw new Error(`Citizen login failed: ${JSON.stringify(res.data)}`);
    }
    citizenToken = res.data.token;
    citizenUser = res.data.user;
  });

  // 3. Auth: Moderator Login
  let moderatorToken = '';
  await test('POST /auth/login as Moderator (moderator@trace.dev / mod123)', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'moderator@trace.dev',
      password: 'mod123',
    });
    if (!res.data.token || res.data.user.role !== 'MODERATOR') {
      throw new Error(`Moderator login failed: ${JSON.stringify(res.data)}`);
    }
    moderatorToken = res.data.token;
  });

  // 4. Auth: Admin Login
  let adminToken = '';
  await test('POST /auth/login as Admin (admin@trace.dev / admin123)', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@trace.dev',
      password: 'admin123',
    });
    if (!res.data.token || res.data.user.role !== 'ADMIN') {
      throw new Error(`Admin login failed: ${JSON.stringify(res.data)}`);
    }
    adminToken = res.data.token;
  });

  // 5. RBAC Enforcement: Citizen cannot access Admin endpoints (must return 403)
  await test('RBAC: Citizen accessing GET /admin/users receives 403 Forbidden', async () => {
    try {
      await axios.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${citizenToken}` },
      });
      throw new Error('Citizen was incorrectly permitted to access /admin/users!');
    } catch (err: any) {
      if (err.response?.status !== 403) {
        throw new Error(`Expected 403 Forbidden but received ${err.response?.status}`);
      }
    }
  });

  // 6. RBAC Success: Admin accessing GET /admin/users
  await test('RBAC: Admin accessing GET /admin/users succeeds', async () => {
    const res = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!Array.isArray(res.data.users) || res.data.users.length === 0) {
      throw new Error('Admin users list returned empty or invalid format');
    }
  });

  // 7. Public Map & Privacy: Citizen gets ONLY verified incidents, reporter anonymized
  await test('Privacy: Public GET /incidents returns only verified reports with masked reporter', async () => {
    const res = await axios.get(`${API_BASE}/incidents?limit=10`);
    const incidents = res.data.data;
    if (!Array.isArray(incidents) || incidents.length === 0) {
      throw new Error('No public incidents returned');
    }
    for (const inc of incidents) {
      if (inc.status !== 'VERIFIED' && !inc.is_public) {
        throw new Error(`Unverified incident leaked to public: ${inc.id}`);
      }
      if (inc.reporter_email) {
        throw new Error(`Reporter email leaked to public: ${inc.reporter_email}`);
      }
    }
  });

  // 8. Geospatial: Bounding Box Map Incidents
  await test('Geospatial: GET /map/incidents returns points within Pune envelope', async () => {
    const res = await axios.get(`${API_BASE}/map/incidents?minLat=18.50&maxLat=18.55&minLng=73.80&maxLng=73.88`);
    if (res.data.count === 0 || !Array.isArray(res.data.incidents)) {
      throw new Error('No incidents found in central Pune bounding box');
    }
  });

  // 9. Geospatial: Clusters
  await test('Geospatial: GET /map/clusters calculates spatial clusters', async () => {
    const res = await axios.get(`${API_BASE}/map/clusters?gridSize=0.02`);
    if (!Array.isArray(res.data.clusters) || res.data.clusters.length === 0) {
      throw new Error('Map clustering returned empty array');
    }
  });

  // 10. Geospatial: Heatmaps
  await test('Geospatial: GET /map/heatmap returns weighted points', async () => {
    const res = await axios.get(`${API_BASE}/map/heatmap`);
    if (!Array.isArray(res.data.points) || res.data.points.length === 0) {
      throw new Error('Heatmap returned empty points');
    }
  });

  // 11. Geospatial: Proximity Search & Safety Score
  await test('Geospatial: GET /map/nearby calculates distance & safety score', async () => {
    const res = await axios.get(`${API_BASE}/map/nearby?lat=18.5204&lng=73.8567&radiusKm=2`);
    if (typeof res.data.safetyScore !== 'number' || !Array.isArray(res.data.incidents)) {
      throw new Error('Nearby incidents query returned invalid structure');
    }
  });

  // 12. Analytics Overview
  await test('Analytics: GET /analytics/overview returns aggregate statistics', async () => {
    const res = await axios.get(`${API_BASE}/analytics/overview`);
    if (!res.data.counts || res.data.counts.total < 10000) {
      throw new Error(`Expected at least 10,000 total incidents, got: ${res.data.counts?.total}`);
    }
    if (!Array.isArray(res.data.categories) || !Array.isArray(res.data.severities)) {
      throw new Error('Analytics category/severity breakdowns missing');
    }
  });

  // 13. Incident Submission & AI Classification
  let createdIncidentId = '';
  await test('Incident Lifecycle: Citizen submits incident -> AI auto-classifies', async () => {
    const res = await axios.post(
      `${API_BASE}/incidents`,
      {
        description: 'Two men on a black motorcycle snatched a gold chain near FC Road bus stop.',
        latitude: 18.5204,
        longitude: 73.8400,
        location_area: 'FC Road',
      },
      {
        headers: { Authorization: `Bearer ${citizenToken}` },
      }
    );
    const inc = res.data.incident;
    if (!inc || inc.status !== 'SUBMITTED') {
      throw new Error(`Incident creation failed: ${JSON.stringify(res.data)}`);
    }
    createdIncidentId = inc.id;
  });

  // 14. Moderator Verifies the Incident
  await test('Incident Lifecycle: Moderator reviews and verifies the incident', async () => {
    const res = await axios.patch(
      `${API_BASE}/incidents/${createdIncidentId}/status`,
      {
        status: 'VERIFIED',
        moderation_notes: 'Verified via local CCTV footage review.',
      },
      {
        headers: { Authorization: `Bearer ${moderatorToken}` },
      }
    );
    if (res.data.incident.status !== 'VERIFIED' || !res.data.incident.is_public) {
      throw new Error(`Incident status update failed: ${JSON.stringify(res.data)}`);
    }
  });

  // 15. Notification received by Citizen
  await test('Notifications: Citizen receives notification for status update', async () => {
    const res = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    if (!Array.isArray(res.data.notifications) || res.data.notifications.length === 0) {
      throw new Error('Citizen received no notification');
    }
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
