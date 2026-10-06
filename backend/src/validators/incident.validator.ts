import { z } from 'zod';

export const incidentCategories = [
  'THEFT_SNATCHING',
  'ASSAULT',
  'BURGLARY',
  'VANDALISM',
  'HARASSMENT',
  'FRAUD',
  'CYBERCRIME',
  'ROBBERY',
  'VEHICLE_RELATED',
  'OTHER',
] as const;

export const incidentSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const incidentStatuses = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'FORWARDED',
  'INVESTIGATING',
  'RESOLVED',
  'REJECTED',
] as const;

export const createIncidentSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters long').max(5000),
  category: z.enum(incidentCategories).optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  location_area: z.string().max(255).optional().nullable(),
  occurred_at: z.string().datetime().optional().nullable(),
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(incidentStatuses),
  moderation_notes: z.string().max(2000).optional().nullable(),
  is_public: z.boolean().optional(),
});

export const updateIncidentModerationSchema = z.object({
  category: z.enum(incidentCategories).optional(),
  severity: z.enum(incidentSeverities).optional(),
  status: z.enum(incidentStatuses).optional(),
  moderation_notes: z.string().max(2000).optional().nullable(),
  is_public: z.boolean().optional(),
});

export const queryIncidentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  category: z.enum(incidentCategories).optional(),
  status: z.enum(incidentStatuses).optional(),
  severity: z.enum(incidentSeverities).optional(),
  search: z.string().optional(),
  minLat: z.coerce.number().optional(),
  maxLat: z.coerce.number().optional(),
  minLng: z.coerce.number().optional(),
  maxLng: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  my_reports: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;
export type UpdateIncidentModerationInput = z.infer<typeof updateIncidentModerationSchema>;
export type QueryIncidentsInput = z.infer<typeof queryIncidentsSchema>;
