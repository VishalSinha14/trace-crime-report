# TRACE paper audit

## Confirmed from repository

- React/Vite/TypeScript frontend with Leaflet, marker clustering, and a
  heatmap dependency.
- Node.js/Express/TypeScript backend with authentication, validation,
  incidents, map, analytics, notifications, admin, safe-route, and
  corroboration route groups.
- PostgreSQL/PostGIS schema with WGS84 incident points, GiST spatial index,
  incident lifecycle state, public visibility, AI analysis, notifications,
  audit logs, and corroboration support.
- Python FastAPI AI service.
- Separate TF-IDF plus Logistic Regression pipelines for category and
  severity.
- Synthetic template-generated training data with manually assigned
  category-to-severity labels.
- Socket.IO real-time update surface.

## Partially established

- The application includes a safe-route implementation surface, but a
  validated road-risk experiment, road-disruption labels, and benchmark
  results were not found.
- The map includes a heatmap dependency and map-layer code, but a controlled
  visualization evaluation and a complete parameter record were not found.

## Not evidenced and intentionally excluded

- ERA5 data, rainfall features, temporal weather lags, 30-model Random Forest
  ensemble, 16-block spatial validation, +30/+60 minute lead-time results,
  typhoon stress testing, or approximately 3.9 million weather samples.
- Approximately 153,000 OSM road segments or a verified road-network
  vulnerability experiment.
- External labelled crime corpus, human annotation study, calibrated
  production probabilities, police integration, emergency dispatch, or field
  deployment.
- Measured latency, throughput, usability, fairness, security, or operational
  impact results.

## Required before submission

- Run the paper's functional endpoint/database tests and preserve outputs.
- Create an independent, governed labelled test set for category and
  severity.
- Report class definitions, splits, confusion matrices, macro metrics, and
  calibration only after measurement.
- Measure map query/rendering performance with documented fixtures.
- Perform privacy, threat-model, security, accessibility, and usability
  review.
- Verify each bibliographic record against the publisher or official source
  before venue submission.

