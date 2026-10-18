# 🤝 Citizen Corroboration System — Full Implementation Plan

## What This Feature Is

Citizens who were present near an incident can **corroborate** it — confirming it happened, adding witness context, or flagging it as false. This creates a **community-powered verification layer** that boosts report credibility, assists moderators, and makes TRACE uniquely interactive.

---

## Architecture Overview

```
Citizen clicks "I Witnessed This" on incident card / map popup
  │
  ▼
CorroborateModal (new) — select type, write statement, submit
  │
  ▼
POST /api/incidents/:id/corroborate   (new endpoint)
  │
  ├── Validate: not your own incident, not duplicate, user logged in
  ├── Insert into corroborations table
  ├── Recompute incident's credibility_score
  ├── If credibility >= threshold → bump moderation priority (socket event)
  └── Notify original reporter
  │
  ▼
Incident cards + popup updated with live corroboration badge/count
```

---

## Bug Fix (Must Do First)

**`audit_logs` table is missing the `user_agent` column** — causing a logged error on every login and status update.

**Fix:** Add the column via a `ALTER TABLE` migration in psql.

---

## Files to Create / Modify

### 🆕 New Files

| File | Purpose |
|:---|:---|
| `backend/src/controllers/corroboration.controller.ts` | POST submit corroboration, GET list corroborations for incident |
| `backend/src/routes/corroboration.routes.ts` | Mount on `/api/incidents/:id/corroborate` |
| `frontend/src/components/CorroborateModal.tsx` | Modal with corroboration type picker + statement textarea |

### ✏️ Modified Files

| File | What Changes |
|:---|:---|
| `backend/src/index.ts` | Register corroboration route |
| `backend/src/services/api.ts` (frontend) | Add `submitCorroboration()` and `getCorroborations()` methods |
| `frontend/src/App.tsx` | Add corroboration state + handlers, wire to modal |
| `frontend/src/components/SafetyMap.tsx` | Add "Witness This" button inside incident map popup |
| `frontend/src/index.css` | Styles for corroboration badge, modal, timeline |

---

## Phase 1 — Database Fix (audit_logs)

**Action:** Fix the missing `user_agent` column so the error stops.

```sql
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
```

---

## Phase 2 — Database Schema (corroborations table)

```sql
CREATE TABLE IF NOT EXISTS corroborations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id  UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('WITNESSED', 'AFFECTED', 'FALSE_REPORT')),
  statement    TEXT NOT NULL CHECK (char_length(statement) BETWEEN 10 AND 500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One corroboration per user per incident
  UNIQUE (incident_id, user_id)
);

-- Also add credibility_score to incidents table
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS credibility_score INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_corroborations_incident 
  ON corroborations(incident_id);
```

---

## Phase 3 — Backend Controller (`corroboration.controller.ts`)

### Endpoints

#### `POST /api/incidents/:id/corroborate`
- **Auth:** Required (citizen)
- **Body:** `{ type: 'WITNESSED' | 'AFFECTED' | 'FALSE_REPORT', statement: string }`
- **Logic:**
  1. Fetch incident — ensure it's public and not REJECTED
  2. Reject if user is the incident reporter (can't witness your own report)
  3. Insert into `corroborations` (UNIQUE constraint prevents dupes)
  4. Recompute credibility: `WITNESSED = +3`, `AFFECTED = +2`, `FALSE_REPORT = -2` (capped 0–100)
  5. `UPDATE incidents SET credibility_score = $score WHERE id = $id`
  6. If score ≥ 15 and incident is SUBMITTED → emit socket `incident:high_credibility` to MODERATOR role
  7. Notify original reporter via `createNotification()`
  8. Return `{ success: true, credibility_score, corroboration_count }`

#### `GET /api/incidents/:id/corroborations`
- **Auth:** Required
- **Logic:** Return paginated list of corroborations for an incident (type, statement, created_at, user name redacted to first name only for privacy)

---

## Phase 4 — Backend Route (`corroboration.routes.ts`)

```
POST   /api/incidents/:id/corroborate        → submitCorroboration
GET    /api/incidents/:id/corroborations     → getCorroborations
```

Mount this inside `incident.routes.ts` (nested route) or as a standalone registered in `index.ts`.

---

## Phase 5 — Frontend API Service (`api.ts`)

Add two new methods:

```typescript
async submitCorroboration(
  incidentId: string,
  type: 'WITNESSED' | 'AFFECTED' | 'FALSE_REPORT',
  statement: string
) → Promise<{ credibility_score: number; corroboration_count: number }>

async getCorroborations(incidentId: string) → Promise<Corroboration[]>
```

Also add `Corroboration` interface to `api.ts`.

---

## Phase 6 — Frontend Modal (`CorroborateModal.tsx`)

### UI Layout

```
┌─────────────────────────────────────────┐
│  🤝 Corroborate This Incident           │
│  ─────────────────────────────────────  │
│  "Theft Snatching · MG Road · HIGH"     │
│                                         │
│  How are you connected to this event?  │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ 👁 I Witnessed This              │   │  ← selected state = glowing border
│  │   I was physically present       │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ 💔 I Was Affected Too            │   │
│  │   This also happened to me       │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ 🚩 This Seems False              │   │
│  │   I have reason to dispute this  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  Your statement (min 10 characters):   │
│  ┌──────────────────────────────────┐   │
│  │ I was walking on MG Road at...   │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ⚠️ Your name will not be shown.        │
│     Statements help moderators verify. │
│                                         │
│  [ Cancel ]  [ Submit Corroboration → ] │
└─────────────────────────────────────────┘
```

### After submission:
- Button on incident card changes to "✓ You corroborated" (disabled)
- Credibility badge updates live

---

## Phase 7 — Incident Cards + Map Popup Enhancements

### Incident cards in sidebar stream (App.tsx):
- Add a `🤝 Witness` button below each card (only for VERIFIED incidents, only when logged in)
- Show credibility badge: e.g., `⭐ 3 corroborations` in small pill
- On click → open `CorroborateModal`

### Map popup (SafetyMap.tsx):
- Add a "Witness This" link inside the Leaflet popup HTML
- Since Leaflet popups are plain HTML, dispatch a custom event or use a global callback to trigger modal from the map

---

## Phase 8 — Moderator Queue Enhancement (ModeratorQueue.tsx)

Show corroboration count and credibility score next to each submitted incident:
- `⭐ Credibility: 24/100`  
- `🤝 7 witness statements`
- Clicking expands to show the anonymized witness statements inline

---

## Execution Checklist

| # | Task | Layer | Status |
|:---:|:---|:---:|:---:|
| 0 | Fix audit_logs missing user_agent column (psql migration) | DB | ⬜ |
| 1 | Create corroborations table + credibility_score on incidents | DB | ⬜ |
| 2 | Create `corroboration.controller.ts` — submit + list endpoints | Backend | ⬜ |
| 3 | Create `corroboration.routes.ts` — mount routes | Backend | ⬜ |
| 4 | Register route in `index.ts` | Backend | ⬜ |
| 5 | Add `submitCorroboration()` + `getCorroborations()` to `api.ts` | Frontend | ⬜ |
| 6 | Create `CorroborateModal.tsx` — type picker + statement form | Frontend | ⬜ |
| 7 | Add corroboration state + handlers in `App.tsx` | Frontend | ⬜ |
| 8 | Add "Witness This" button + credibility badge to incident stream cards | Frontend | ⬜ |
| 9 | Add "Witness This" to map popup (Leaflet HTML + global callback) | Frontend | ⬜ |
| 10 | Enhance `ModeratorQueue.tsx` with credibility score + statement preview | Frontend | ⬜ |
| 11 | Add CSS for modal, badges, corroboration type cards | Frontend | ⬜ |
| 12 | TypeScript check — zero errors | Full stack | ⬜ |
| 13 | End-to-end test — submit corroboration → see badge update live | Full stack | ⬜ |

---

## Key Design Decisions

| Decision | Choice | Rationale |
|:---|:---|:---|
| **One per user per incident** | DB UNIQUE constraint | Prevents spam voting. Each citizen voice counts once. |
| **Privacy** | Show first name only on corroborations list | Encourages participation without exposing identity |
| **Scoring formula** | WITNESSED=+3, AFFECTED=+2, FALSE=-2 | Positive corroborations outweigh a single dispute |
| **Threshold for priority bump** | credibility_score ≥ 15 | Needs ~5 witnesses — noise resistant |
| **Socket event for high credibility** | `incident:high_credibility` to MODERATORs | Real-time moderator awareness of viral/credible incidents |
| **No media uploads** | Text-only in this phase | Keeps scope manageable; can add later |

---

## What Does NOT Change

- ❌ No changes to auth/RBAC beyond checking `req.user` in the new controller
- ❌ No new npm packages — uses existing pg/express/socket infrastructure
- ❌ No changes to Safe Route Navigator
- ❌ No changes to AI classification service
