# JARVIS TASK MATRIX: SYSTEM ARCHITECTURE & INTEGRATION SPECIFICATION

## 1. Domain Modeling & Rating Scales

### 1.1 Importance Scale (1-5)
The importance scale measures existential and strategic significance:
- **Level 5 — Vital Life Objective**: "My life will not be complete if this is not done. Absolute highest priority."
- **Level 4 — Critical Enabler**: "Lifelong regret or necessary for the execution of a Level 5 objective."
- **Level 3 — Standard Operational**: "Work tasks, routine responsibilities, minor social commitments."
- **Level 2 — Low Consideration**: "Entirely avoidable, but warrants minor consideration or deferred action."
- **Level 1 — Incidental / Optional**: "Maybe do this, maybe do not. Negligible consequence if omitted."

### 1.2 Urgency Recommendation Algorithm
Urgency levels (1-5) are calculated autonomously relative to current epoch:
- `Δt <= 24 hours` or overdue: **Level 5 (Immediate Crisis)**
- `24 hours < Δt <= 48 hours`: **Level 4 (High Velocity)**
- `48 hours < Δt <= 96 hours`: **Level 3 (Active Runway)**
- `96 hours < Δt <= 168 hours`: **Level 2 (Planned Horizon)**
- `Δt > 168 hours` or `null`: **Level 1 (Distant / Undated)**

### 1.3 Importance, Urgency, Impact & Effort Scales (1-5)
- **Importance (`IMPT 1-5`, Icon: Star)**:
  * Measures existential, strategic, and core value significance.
  * Level 5: Vital Life Objective ("My life will not be complete if this is not done.")
  * Level 4: Critical Enabler ("Lifelong regret or necessary for the execution of a Level 5.")
  * Level 3: Standard Operational ("Work tasks, routine responsibilities, minor social commitments.")
  * Level 2: Low Consideration ("Avoidable, but warrants minor consideration.")
  * Level 1: Incidental / Optional ("Maybe do this, maybe not.")
- **Urgency (`URG 1-5`, Icon: Clock)**:
  * Measures proximity to deadline or time window decay.
- **Impact (`IMPACT 1-5`, Icon: Zap)**:
  * Evaluates output leverage and systemic multiplier effect upon completion.
  * Level 5: Transformational | Level 4: High Leverage | Level 3: Moderate Progress | Level 2: Incremental Gain | Level 1: Negligible
- **Effort (`EFFORT 1-5`, Icon: Gauge)**:
  * Evaluates operational friction, time investment, and cognitive drain.
  * Level 5: Exhaustive | Level 4: Substantial Drag | Level 3: Standard Effort | Level 2: Low Friction | Level 1: Quick Win (< 30m)

---

## 2. Multi-Criteria Sorting Engine

Tasks are partitioned deterministically across four operational views:

### 2.1 Strategic View (Eisenhower Principle)
1. **Quadrant 1 (High Importance & High Urgency)**: `Importance >= 3 && Urgency >= 3`
2. **Quadrant 2 (High Importance & Low Urgency)**: `Importance >= 3 && Urgency < 3`
3. **Quadrant 3 (Low Importance & High Urgency)**: `Importance < 3 && Urgency >= 3`
4. **Quadrant 4 (Low Importance & Low Urgency)**: `Importance < 3 && Urgency < 3`

### 2.2 Deadline View (Deadline Acceleration)
1. **Urgent & Important**: `Importance >= 3 && Urgency >= 3`
2. **Urgent (Low Importance)**: `Importance < 3 && Urgency >= 3`
3. **Important (Low Urgency)**: `Importance >= 3 && Urgency < 3`
4. **Low on Both**: `Importance < 3 && Urgency < 3`

### 2.3 Eisenhower 2x2 Matrix View
Spatial layout mapping tasks into Q1, Q2, Q3, and Q4 buckets.

### 2.4 Impact-Effort 2x2 Matrix View (Action Priority)
1. **Priority 1 (Quick Wins)**: High Impact (`>= 3`) & Low Effort (`<= 2`)
2. **Priority 2 (Major Projects)**: High Impact (`>= 3`) & High Effort (`>= 3`)
3. **Priority 3 (Fill-Ins / Maintenance)**: Low Impact (`< 3`) & Low Effort (`<= 2`)
4. **Priority 4 (Time Sinks / Thankless)**: Low Impact (`< 3`) & High Effort (`>= 3`) - De-prioritize or Eliminate.

### 2.5 Visual Theme & Color Systems
- **Daylight Light Mode (Default Productivity State)**:
  * Base: Luminous slate gradient mesh (`from-slate-50 via-cyan-50/25 to-indigo-50/20`) with white elevated cards (`bg-white/90`).
  * Contrast: Elimination of raw blacks in favor of deep slate (`text-slate-900`, `text-slate-700`).
  * Micro-interactions: Accent left indicator strips (Rose for Q1, Cyan for Q2, Amber for Q3), hover translations (`-translate-y-0.5`), dynamic colored shadow blooms (`shadow-cyan-500/10`), active ring animations.
- **Deep Slate Dark Mode**:
  * Base: Midnight slate backdrop (`from-slate-950 via-slate-900 to-slate-950`) replacing harsh monochrome black with rich cyber-indigo tones.

### 2.3 Tie-Breaker Resolution
- Secondary sort: `dueDate ASC` (earliest deadline first, unassigned deadlines last)
- Tertiary sort: `createdAt ASC` (FIFO execution)

---

## 3. Tiered Guidance & Notification System (Phase 2 Refinement)

The system isolates alerts into distinct operational tiers to prevent visual disruption:
1. **Tier 1 — Critical Operational Banners (`CRITICAL`)**:
   - Location: Top viewport banner.
   - Triggers: Real-time network disconnects (`OFFLINE_RESILIENT`), critical system alerts.
   - Persistence: Persists until condition clears or explicit dismissal.
2. **Tier 2 — Transient Feedback Toasts (`TRANSIENT`)**:
   - Location: Bottom-right floating stack.
   - Triggers: Guest session initialization, task ingestion, parameter updates, resolution confirmations.
   - Persistence: Autonomous countdown timer (default 3000ms–6000ms) with visual linear depletion bar.
3. **Tier 3 — Ambient Header Telemetry (`INLINE`)**:
   - Location: Persistent header pill (`GUEST SANDBOX // LOCAL STORAGE` or `CLOUD SYNCED`).
   - Function: Provides persistent reminder without commandeering content space; allows one-click upgrade to authenticated account at any time.

---

## 4. Authentication & Security Architecture (Phase 3 Implemented)

### 4.1 Dual-Mode Authentication Engine (`src/services/authService.ts`)
1. **Universal Client Environment Resolution (`src/services/supabaseClient.ts`)**:
   - Automatically resolves credentials across **Vite** (`import.meta.env`), **Create React App / react-scripts** (`process.env`), and **Netlify** build pipelines.
   - Project URL Resolution Order: `VITE_SUPABASE_URL` -> `REACT_APP_SUPABASE_URL` -> `SUPABASE_URL`.
   - Client Key Resolution Order: `VITE_SUPABASE_ANON_KEY` -> `REACT_APP_SUPABASE_ANON_KEY` -> `SUPABASE_ANON_KEY` -> `REACT_APP_SUPABASE_KEY`.
   - **SECURITY ENFORCEMENT**: All `service_role` keys are purged from frontend bundles. Only public `anon` keys are accepted, ensuring all client database transactions are strictly bound to Row-Level Security (RLS) policies.
2. **Local Persistence Gateway (Guest Sandbox)**:
   - Activates when credentials are absent or user elects instant guest access.
   - Tasks and sessions reside deterministically in encrypted browser local storage.
   - One-click account elevation seamlessly binds local data to the newly initialized account.

### 4.2 Row-Level Security & Schema Migration
- Production migration located at `/supabase/migrations/001_tasks_schema.sql`.
- Strictly enforces RLS isolation: `auth.uid() = user_id` for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- Automated PostgreSQL trigger `handle_updated_at()` maintains deterministic revision tracking.

---

## 5. Storage Layer & Supabase Cloud Integration (Phase 4 Implemented)

### 5.1 Hybrid Storage Architecture (`src/services/storageAdapter.ts` & `src/services/supabaseRepository.ts`)
1. **Dynamic Routing Engine**:
   - When Supabase credentials exist and an authenticated session is active (`session && !session.isGuest`):
     * Routes all CRUD operations through `SupabaseTaskRepository`.
     * Writes to PostgreSQL `public.tasks` table with Row-Level Security checks (`auth.uid() = user_id`).
     * Keeps an offline-first read-through local cache in browser storage.
   - When running in Guest mode or credentials are absent:
     * Operates deterministically via `LocalStorageTaskRepository`.
2. **Realtime Multi-Device Synchronization**:
   - `supabaseRepository.subscribeToChanges(userId, onUpdate)` mounts a Supabase Realtime channel (`postgres_changes` on `public.tasks`).
   - Automatically synchronizes priority matrices across tabs, windows, and remote devices.
3. **Guest-to-Cloud Data Migration & UUID Standard**:
   - Primary key is defined as `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
   - Client creates RFC 4122 compliant UUIDs via `crypto.randomUUID()` in `/src/utils/uuid.ts`, ensuring zero collision and 100% type compatibility when offline tasks sync to PostgreSQL.
   - Any legacy non-UUID IDs in browser storage are automatically sanitized upon retrieval.
   - When an operator transitions from Guest mode to a signed-in account, `migrateLocalTasksToCloud()` uploads existing local tasks to the operator's Supabase account.

### 5.2 Supabase Deployment Instructions
1. Navigate to your Supabase project dashboard -> **SQL Editor**.
2. Run the script located in `/supabase/migrations/001_tasks_schema.sql`:
   - Creates the `public.tasks` table with native UUID primary key (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`) and foreign key to `auth.users(id)`.
   - Provisions composite indexes for matrix performance (`importance, urgency`, `impact, effort`, `due_date`, `mega_bucket`).
   - Configures strict Row-Level Security (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
   - Adds the table to the `supabase_realtime` publication for live synchronization.
3. In your Netlify dashboard or `.env` configuration:
   - Provide `REACT_APP_SUPABASE_URL` (or `VITE_SUPABASE_URL` / `SUPABASE_URL`).
   - Provide `REACT_APP_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY`).

---

## 6. Executive Interface & Deep Execution Engine (Phase 5 Implemented)

### 6.1 Continuous 2D Cartesian Drag-and-Drop Canvas (`src/components/CartesianScatterCanvas.tsx`)
- Provides an alternative to discrete 2x2 quadrant boxes via continuous Cartesian space ($X \in [1, 5], Y \in [1, 5]$).
- Smoothly recalculates discrete ratings as operators drag and drop task chips directly across the matrix plane.
- Available across both Eisenhower ($X$: Urgency, $Y$: Importance) and Impact-Effort ($X$: Effort, $Y$: Impact).

### 6.2 Micro-Interactions & Velocity Completion Burst (`src/components/CompletionParticleBurst.tsx`)
- High-performance HTML5 Canvas physics generating 38 radiant particles upon task completion.
- Coordinates smoothly with strikethrough typography sweeps and soundless tactile feedback.

### 6.3 Command Spotlight & Ultradian Focus Chronometer (`src/components/CommandSpotlightModal.tsx`)
- Isolates an operator's selected high-priority task with deep obsidian ambient backdrop blur (`backdrop-blur-2xl`).
- Operates on a 90-minute default deep work cycle (Ultradian rhythm) with automatic proportional rest calculations (~4.5:1 ratio).
- Continuously logs and syncs `actual_duration_seconds` to Supabase and local storage.
- Displays estimate vs. actual execution duration deltas.

### 6.4 Mindful Cognitive Workload Distribution Meter (`src/components/WorkloadDistributionMeter.tsx`)
- Evaluates total committed workload, Q1 crisis items, and high-effort drag tasks.
- Delivers supportive, calming, and non-stressful guidance even in high-capacity overload zones.

### 6.5 Mega Task Bins / Mission Stream Clusters (`src/components/MegaTaskBinBar.tsx`)
- Solves task grouping without subtask nesting friction: tasks remain atomic actions.
- Drag-and-drop assignment directly onto mission bin tabs with 1-click matrix filtering.

### 6.6 Universal Command Palette (`src/components/CommandPaletteModal.tsx`)
- Global activation via `Cmd+K`, `Ctrl+K`, or `/`.
- Natural language shorthand ingestion: `q1 [title]`, `q2 [title]`, `qw [title]`, or `add [title] due tomorrow imp 5 urg 4 bucket: "Core"`.
- Full command language documented in `/docs/COMMAND_LANGUAGE.md`.

### 6.7 Automated Urgency Decay & Escalation Daemon (`src/constants/definitions.ts`)
- Evaluates unattended high-importance tasks ($\ge 4$) that have lingered $\ge 3$ days with low urgency ($\le 2$).
- Automatically escalates priority warning with a glowing "STALE Q2 - ESCALATING" telemetry badge.

