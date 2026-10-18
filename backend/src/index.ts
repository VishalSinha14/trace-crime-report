import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { testConnection } from './utils/db';
import { initializeSockets } from './sockets';

// Route imports
import authRoutes from './routes/auth.routes';
import incidentRoutes from './routes/incident.routes';
import mapRoutes from './routes/map.routes';
import safeRouteRoutes from './routes/saferoute.routes';
import analyticsRoutes from './routes/analytics.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import corroborationRoutes from './routes/corroboration.routes';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket server
initializeSockets(server);

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  let dbOk = false;
  try {
    dbOk = await testConnection();
  } catch (err) {
    dbOk = false;
  }

  res.json({
    status: dbOk ? 'ok' : 'degraded',
    service: 'trace-backend',
    database: dbOk ? 'connected' : 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/incidents/:id', corroborationRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/map', safeRouteRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// ─── API Root ───────────────────────────────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    name: 'TRACE API',
    version: '1.0.0',
    description: 'Technology for Reporting, Analysis & Crime Evaluation',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      incidents: '/api/incidents',
      map: '/api/map',
      analytics: '/api/analytics',
      notifications: '/api/notifications',
      admin: '/api/admin',
    },
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist.',
  });
});

// ─── Error Handler ──────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong.',
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────
server.listen(PORT, async () => {
  console.log(`\n🚀 TRACE Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server active on port ${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);

  // Verify PostgreSQL + PostGIS connectivity
  await testConnection();
});

export default app;
