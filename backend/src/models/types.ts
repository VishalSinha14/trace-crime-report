export type UserRole = 'CITIZEN' | 'MODERATOR' | 'ADMIN';

export type IncidentCategory =
  | 'THEFT_SNATCHING'
  | 'ASSAULT'
  | 'BURGLARY'
  | 'VANDALISM'
  | 'HARASSMENT'
  | 'FRAUD'
  | 'CYBERCRIME'
  | 'ROBBERY'
  | 'VEHICLE_RELATED'
  | 'OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'FORWARDED'
  | 'INVESTIGATING'
  | 'RESOLVED'
  | 'REJECTED';

export type NotificationType =
  | 'STATUS_CHANGE'
  | 'NEARBY_INCIDENT'
  | 'HIGH_PRIORITY_ALERT'
  | 'INFO_REQUEST'
  | 'SYSTEM';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface Incident {
  id: string;
  user_id: string;
  description: string;
  category: IncidentCategory | null;
  ai_category: IncidentCategory | null;
  ai_confidence: number | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  location_area: string | null;
  occurred_at: string;
  is_public: boolean;
  moderation_notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  reporter_name?: string;
  reporter_email?: string;
  media_count?: number;
}

export interface IncidentMedia {
  id: string;
  incident_id: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  original_name?: string;
  created_at: string;
}

export interface IncidentAnalysis {
  id: string;
  incident_id: string;
  predicted_category: IncidentCategory;
  category_confidence: number;
  predicted_severity?: IncidentSeverity;
  severity_confidence?: number;
  model_version: string;
  processing_time_ms?: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  incident_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: UserRole;
}
