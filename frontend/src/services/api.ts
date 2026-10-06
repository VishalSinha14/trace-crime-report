const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CITIZEN' | 'MODERATOR' | 'ADMIN';
  avatar_url?: string;
  is_active: boolean;
}

export interface Incident {
  id: string;
  user_id: string;
  description: string;
  category: string;
  ai_category?: string;
  ai_confidence?: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'FORWARDED' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';
  latitude: number;
  longitude: number;
  location_area?: string;
  occurred_at: string;
  is_public: boolean;
  moderation_notes?: string;
  created_at: string;
  reporter_name?: string;
  reporter_email?: string;
  media_count?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  incident_id?: string;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('trace_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('trace_token', data.token);
    return data;
  },

  async register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('trace_token', data.token);
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to get current user');
    return res.json();
  },

  logout() {
    localStorage.removeItem('trace_token');
  },

  // Incidents
  async getIncidents(params: Record<string, string | number | boolean> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });

    const res = await fetch(`${API_BASE}/incidents?${query.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncident(id: string) {
    const res = await fetch(`${API_BASE}/incidents/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch incident details');
    return res.json();
  },

  async createIncident(incidentData: {
    description: string;
    category?: string | null;
    latitude: number;
    longitude: number;
    location_area?: string | null;
  }) {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(incidentData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit incident');
    return data;
  },

  async updateIncidentStatus(id: string, status: string, moderation_notes?: string) {
    const res = await fetch(`${API_BASE}/incidents/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ status, moderation_notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update status');
    return data;
  },

  // Map
  async getMapIncidents(params: Record<string, string | number> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) query.append(k, String(v));
    });
    const res = await fetch(`${API_BASE}/map/incidents?${query.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch map pins');
    return res.json();
  },

  async getMapClusters(gridSize: number = 0.015) {
    const res = await fetch(`${API_BASE}/map/clusters?gridSize=${gridSize}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch map clusters');
    return res.json();
  },

  async getNearby(lat: number, lng: number, radiusKm: number = 3) {
    const res = await fetch(`${API_BASE}/map/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch nearby incidents');
    return res.json();
  },

  // Analytics
  async getAnalyticsOverview() {
    const res = await fetch(`${API_BASE}/analytics/overview`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getHotspots() {
    const res = await fetch(`${API_BASE}/analytics/hotspots`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch hotspots');
    return res.json();
  },

  async getTemporalPatterns() {
    const res = await fetch(`${API_BASE}/analytics/temporal`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch temporal patterns');
    return res.json();
  },

  // Admin
  async getAdminUsers(params: Record<string, string | number> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => query.append(k, String(v)));
    const res = await fetch(`${API_BASE}/admin/users?${query.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async updateUserRole(userId: string, role: string) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to change user role');
    return res.json();
  },

  async getAuditLogs(page: number = 1) {
    const res = await fetch(`${API_BASE}/admin/audit-logs?page=${page}&limit=25`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getSystemStats() {
    const res = await fetch(`${API_BASE}/admin/system-stats`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch system stats');
    return res.json();
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) return { notifications: [] };
    return res.json();
  },

  async markNotificationRead(id: string) {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeader(),
    });
  },

  async markAllNotificationsRead() {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: getAuthHeader(),
    });
  },
};
