-- ============================================================================
-- TRACE Database Verification Script
-- Verifies PostGIS, Schema, Spatial Columns, Indexes, and 10,000+ Incidents
-- ============================================================================

\echo '=== 1. POSTGIS EXTENSION VERIFICATION ==='
SELECT PostGIS_Version() AS postgis_version, PostGIS_Lib_Version() AS postgis_lib;

\echo '\n=== 2. TABLE EXISTENCE CHECK ==='
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN (
    'users', 'incidents', 'incident_media', 'incident_analysis',
    'notifications', 'audit_logs', 'hotspot_snapshots', 'risk_grid'
  )
ORDER BY table_name;

\echo '\n=== 3. SPATIAL GEOMETRY COLUMNS ==='
SELECT f_table_name AS table_name, f_geometry_column AS column_name, type, srid, coord_dimension
FROM geometry_columns
WHERE f_table_schema = 'public'
ORDER BY f_table_name;

\echo '\n=== 4. SPATIAL GIST & B-TREE INDEXES ==='
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE 'idx_%' OR indexname LIKE '%pkey%')
ORDER BY tablename, indexname;

\echo '\n=== 5. RECORD COUNTS ==='
SELECT 
  (SELECT COUNT(*) FROM users) AS users_count,
  (SELECT COUNT(*) FROM incidents) AS incidents_count,
  (SELECT COUNT(*) FROM incident_analysis) AS analysis_count,
  (SELECT COUNT(*) FROM notifications) AS notifications_count,
  (SELECT COUNT(*) FROM audit_logs) AS audit_logs_count;

\echo '\n=== 6. GEOMETRY VALIDITY CHECK (Must be 0 invalid) ==='
SELECT 
  COUNT(*) AS total_points,
  COUNT(CASE WHEN ST_IsValid(location) THEN 1 END) AS valid_points,
  COUNT(CASE WHEN NOT ST_IsValid(location) THEN 1 END) AS invalid_points
FROM incidents;

\echo '\n=== 7. PUNE GEOGRAPHIC BOUNDS CHECK ==='
SELECT 
  MIN(latitude) AS min_lat,
  MAX(latitude) AS max_lat,
  MIN(longitude) AS min_lng,
  MAX(longitude) AS max_lng,
  COUNT(DISTINCT location_area) AS distinct_named_areas
FROM incidents;

\echo '\n=== 8. PUBLIC / VERIFIED SUBSET CHECK ==='
SELECT 
  status,
  is_public,
  COUNT(*) AS count
FROM incidents
GROUP BY status, is_public
ORDER BY count DESC;
