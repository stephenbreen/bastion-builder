# Bastion Planner — Multiplayer Migration Plan

This document outlines how to evolve Bastion Planner from a local-only, single-player (DM) tool into a multiplayer web app with user accounts, persistent cloud state, and role-based access control. The target deployment platform is **Vercel Hobby (free tier)**.

---

## 1. Goals

- Players can log in (OAuth via Google/Discord).
- A DM creates a **campaign** and invites players with a share code.
- Players see the bastion in read+write mode (issue orders, update hireling notes, record activities).
- The DM retains exclusive control over week advancement, treasury edits, and construction.
- State persists in a database, survives page refreshes, and syncs across devices.
- The existing domain model, reducers, and tests are preserved with minimal rewrites.

---

## 2. Recommended Stack (Vercel Hobby)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | **Next.js 15** (App Router) | Native API routes on Vercel. Natural upgrade path from Vite + React. |
| **Database** | **Neon Postgres** | 500 MB storage + 190 compute hours/mo on free tier. Serverless-friendly via the `@neondatabase/serverless` driver. |
| **ORM** | **Drizzle ORM** | TypeScript-first, tiny runtime, excellent Postgres/Neon support. Migrations are just SQL files. |
| **Auth** | **Clerk** | Free tier: 10k MAU. OAuth (Google, Discord) out of the box. Minimal boilerplate. |
| **Server State** | **TanStack Query** (React Query) | Caching, polling, optimistic updates, and background refetching. Replaces Zustand for server data. |
| **Client State** | **Zustand** (keep) | Only for UI state: `theme`, `selectedFacilityId`, `viewMode`, `weekHistory`. |
| **Real-time** | **Polling** (2–3 s interval) | Dead simple, works on serverless, good enough for a turn-based D&D tool. No WebSockets needed. |

### Alternatives Considered

- **Supabase**: Auth + DB + realtime in one. Rejected because it locks business logic into Supabase client SDK patterns and Edge Functions. Keeping logic in Next.js API routes preserves existing reducers.
- **Prisma**: Excellent, but heavier than Drizzle and less natural for edge/serverless runtimes. Drizzle is closer to "typed SQL."
- **Auth.js (NextAuth)**: Free and open, but requires more setup for OAuth providers and session management. Clerk is faster to get running.

---

## 3. Data Architecture: Hybrid JSONB

The bastion state is deeply nested and changes shape frequently (10 localStorage migrations already). Fully normalizing it into SQL tables would create a high maintenance burden.

Use a **hybrid approach**: relational tables for permissions and queryable streams, a JSONB document for the complex bastion state.

### 3.1 Relational Schema

```sql
-- Users (synced from Clerk; minimal local mirror)
create table users (
  clerk_id    text primary key,
  email       text not null,
  display_name text,
  created_at  timestamp default now()
);

-- A campaign = one DM + many players + one bastion
create table campaigns (
  id          serial primary key,
  name        text not null,
  dm_user_id  text not null references users(clerk_id),
  invite_code text not null unique,     -- e.g. "OLD-HILL-42"
  created_at  timestamp default now(),
  updated_at  timestamp default now()
);

-- Campaign membership + roles
create table campaign_members (
  campaign_id int references campaigns(id) on delete cascade,
  user_id     text references users(clerk_id) on delete cascade,
  role        text not null check (role in ('dm', 'player')),
  joined_at   timestamp default now(),
  primary key (campaign_id, user_id)
);

-- The bastion document (one per campaign in v1)
create table bastions (
  id          serial primary key,
  campaign_id int not null unique references campaigns(id) on delete cascade,
  name        text not null,
  state_jsonb jsonb not null default '{}',
  version     int not null default 1,   -- schema version for future migrations
  updated_at  timestamp default now()
);

-- Orders submitted by players each week (queried + deduplicated during resolution)
create table pending_orders (
  id          serial primary key,
  bastion_id  int not null references bastions(id) on delete cascade,
  facility_id text not null,
  user_id     text not null references users(clerk_id),
  order_type  text not null,
  week        int not null,             -- in-game week number
  created_at  timestamp default now(),
  unique (bastion_id, facility_id, week)  -- one order per facility per week
);

-- Append-only activity log (queryable by week, actor, type)
create table log_entries (
  id          serial primary key,
  bastion_id  int not null references bastions(id) on delete cascade,
  week        int not null,
  actor       text not null,            -- PC name, "Bastion", "Domain"
  type        text not null,            -- bastion-order | xanathar-activity | project-roll | domain-action | bastion-event | intrigue-turn
  payload     jsonb not null default '{}',
  outcome     text,
  created_at  timestamp default now()
);

-- Indexes for common queries
create index idx_pending_orders_bastion on pending_orders(bastion_id, week);
create index idx_log_entries_bastion_week on log_entries(bastion_id, week);
```

### 3.2 JSONB Document Shape

The `bastions.state_jsonb` column stores the entire `Bastion` object as exported by the current Zustand store. Example top-level keys:

```json
{
  "name": "The Manor on Old Hill",
  "aspect": "Bard",
  "strongholdLevel": 1,
  "treasury": 1250,
  "inGameWeek": 12,
  "facilities": [...],
  "hirelings": [...],
  "followers": [...],
  "projects": [...],
  "domain": {...},
  "weeklyCosts": {...},
  "dmNotes": "...",
  "floors": [...],
  "customCatalogueEntries": [...]
}
```

**Why JSONB?**
- Reads are a single query.
- Updates use Postgres row-level locking (`SELECT ... FOR UPDATE`).
- No complex schema migrations when adding new bastion features.
- Existing reducers (`advanceWeek`, `startBuild`, etc.) run unchanged against this object.

**Why not *only* JSONB?**
- `pending_orders` needs to be queryable and constrained (one order per facility per week).
- `log_entries` needs to be filterable and paginated.
- `campaign_members` needs foreign keys and `CHECK` constraints for authorization.

---

## 4. Auth & Authorization Model

### 4.1 Roles

| Role | Permissions |
|------|-------------|
| **DM (`role = 'dm'`)** | Full CRUD on bastion state. Advance/rewind week. Edit treasury. Add/remove facilities. Manage campaign members. Import/export JSON. |
| **Player (`role = 'player'`)** | View bastion. Submit orders for facilities. Update hireling notes (on assigned facilities). Record own PC activities. View log. |
| **Unauthenticated** | Nothing. All API routes require a Clerk session. |

### 4.2 Enforcement Strategy

Authorization is enforced at the **API route layer**, not in the database.

Every mutating Route Handler follows this pattern:

1. **Authenticate** — `const { userId } = await auth()` (Clerk).
2. **Authorize** — Look up `campaign_members` for the target `bastion_id`. Verify the user is a member and has the required role.
3. **Validate** — Run Zod schema validation on the request body.
4. **Execute** — Call the existing reducer or insert into the DB.
5. **Respond** — Return the updated state or a `403/404`.

**Example guard:**

```ts
// lib/server/auth.ts
export async function requireCampaignMember(bastionId: number, userId: string) {
  const member = await db.query.campaignMembers.findFirst({
    where: and(
      eq(campaignMembers.userId, userId),
      eq(campaignMembers.campaignId, bastionId)
    ),
  });
  if (!member) throw new Response('Forbidden', { status: 403 });
  return member;
}
```

### 4.3 Invite Flow

1. DM creates a campaign → app generates a random `invite_code` (e.g. `OLD-HILL-42`).
2. DM shares the code at the table.
3. Player visits `/join` and enters the code.
4. Backend verifies the code, inserts a `campaign_members` row with `role = 'player'`, and redirects to the campaign.

---

## 5. API Design (Next.js Route Handlers)

### 5.1 Campaigns

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/campaigns` | User | List campaigns I belong to. |
| `POST` | `/api/campaigns` | User | Create campaign. Caller becomes DM. |
| `POST` | `/api/campaigns/join` | User | Join a campaign by invite code. |
| `GET` | `/api/campaigns/[id]/members` | DM | List members (DM only). |
| `DELETE` | `/api/campaigns/[id]/members/[userId]` | DM | Remove a player. |

### 5.2 Bastions

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/bastions/[id]` | Member | Fetch full bastion JSONB + pending orders for current week. |
| `PATCH` | `/api/bastions/[id]` | DM | Update bastion fields (treasury, name, dmNotes, etc.). |
| `POST` | `/api/bastions/[id]/advance` | DM | Resolve pending orders, run `advanceWeek` reducer, write back JSONB, clear queue, append logs. |
| `POST` | `/api/bastions/[id]/rewind` | DM | Pop last snapshot from `weekHistory` and restore JSONB. |
| `POST` | `/api/bastions/[id]/orders` | Player | Submit an order for a facility this week. |
| `DELETE` | `/api/bastions/[id]/orders/[facilityId]` | Player | Cancel my pending order for this facility. |
| `GET` | `/api/bastions/[id]/log` | Member | Paginated log entries. |
| `POST` | `/api/bastions/[id]/import` | DM | Import JSON dump (replaces state_jsonb). |
| `POST` | `/api/bastions/[id]/export` | Member | Export current state_jsonb as downloadable JSON. |

### 5.3 Real-time Sync

TanStack Query handles the sync strategy:

```ts
// hooks/useBastion.ts
export function useBastion(bastionId: number) {
  return useQuery({
    queryKey: ['bastion', bastionId],
    queryFn: () => fetchBastion(bastionId),
    refetchInterval: 3000,        // poll every 3 seconds
    staleTime: 2000,              // treat data fresh for 2s
  });
}
```

This gives near-real-time sync without WebSockets. A D&D group of 4–6 players polling every 3 seconds generates negligible traffic and compute.

---

## 6. Handling Concurrent Edits

The hardest multiplayer problem for this app is **two players trying to order the same facility** in the same week.

**Solution: first-write-wins with facility-level locking.**

The `pending_orders` table enforces this at the database level:

```sql
unique (bastion_id, facility_id, week)
```

- Player A submits `Research` for the Library in Week 12 → succeeds.
- Player B submits `Maintain` for the Library in Week 12 → `409 Conflict`.
- The UI shows a "Ordered by Alice" badge on that facility for the rest of the week.
- This is actually *desirable* for gameplay: it forces the party to coordinate before the DM advances the week.

For non-conflicting edits (e.g., two players update notes on different hirelings), both succeed because they touch different JSONB paths or different rows.

---

## 7. Migration Phases

### Phase A — Scaffold Next.js + Auth (Est. 1 session)

**Goal**: Deployable app with login/logout, no database yet.

1. Create a new Next.js 15 project alongside the existing Vite app, or convert the repo in place.
2. Move `src/components`, `src/types`, `src/data`, `src/lib`, `src/store/reducers` into the Next.js `src/` directory.
3. Install Clerk and wrap the root layout in `<ClerkProvider>`.
4. Add a login page at `/sign-in` and a campaign list page at `/`.
5. Keep bastion state in Zustand + localStorage for now.
6. **Deploy to Vercel.** Verify OAuth login works.

**What changes:**
- `main.tsx` → `app/layout.tsx`
- `App.tsx` → `app/page.tsx`
- Vite config + `index.html` → deleted
- Add `middleware.ts` for Clerk route protection

**What doesn't change:**
- All components, types, data files, reducers, tests.

### Phase B — Add Neon + Hybrid Schema (Est. 1–2 sessions)

**Goal**: Bastion state persists in Postgres. Reads fetch from the cloud; writes update the DB.

1. Create a Neon project. Add `DATABASE_URL` to Vercel environment variables.
2. Install Drizzle ORM + Neon driver. Define the schema in `db/schema.ts`.
3. Run initial migration (`drizzle-kit migrate`).
4. Create `GET /api/bastions/[id]` → fetches `state_jsonb`.
5. Create `PATCH /api/bastions/[id]` → updates `state_jsonb` (DM only).
6. Add a seed script that inserts the output of `seedManor()` into `bastions.state_jsonb`.
7. Replace the Zustand `persist` middleware with a TanStack Query hook:
   - On mount: `useQuery` fetches the bastion from the API.
   - On mutation: `useMutation` calls `PATCH /api/bastions/[id]`.
8. Keep Zustand for `theme`, `selectedFacilityId`, `viewMode`.
9. **Deploy.** Verify state survives refresh and syncs across browsers.

**What changes:**
- `useBastionStore.ts` → stripped of persistence logic; now thin UI state only.
- New `db/` directory with schema, client, and migrations.
- New `app/api/bastions/` Route Handlers.

### Phase C — Multiplayer + Orders (Est. 2 sessions)

**Goal**: Players can join campaigns, submit orders, and the DM resolves them.

1. Create `campaigns`, `campaign_members`, `pending_orders`, and `log_entries` tables.
2. Build campaign CRUD API routes (`/api/campaigns`, `/api/campaigns/join`).
3. Build `POST /api/bastions/[id]/orders`:
   - Validates the user is a player member.
   - Validates the facility exists and the order type is allowed.
   - Inserts into `pending_orders` (fails with 409 if facility already ordered this week).
4. Modify the DM's "Advance Week" flow:
   - Browser calls `POST /api/bastions/[id]/advance`.
   - API route fetches `state_jsonb` + `pending_orders`.
   - Applies existing `advanceWeek` reducer (in Node.js) with pending orders injected.
   - Writes new `state_jsonb`, clears `pending_orders` for that week, appends to `log_entries`.
   - Returns the new state.
5. Add TanStack Query polling (`refetchInterval: 3000`) to the bastion query so players see live updates.
6. Update the UI:
   - Show "Pending: Research (Alice)" badges on facilities.
   - Disable order buttons for facilities already claimed.
   - Player view allows submitting orders; DM view shows a "Resolve Week" button.
7. **Deploy.** Run a full Bastion Turn with multiple players.

**What changes:**
- `store/reducers/turn.ts` → runs in Node.js now; no browser dependencies.
- `HeaderStrip.tsx` → "Advance Week" calls API instead of local reducer.
- `FacilityPanel.tsx` → order buttons POST to API.

---

## 8. Code Changes Summary

| File / Area | Current | After Migration |
|-------------|---------|-----------------|
| **Framework** | Vite + React SPA | Next.js 15 App Router |
| **Entry points** | `main.tsx`, `index.html`, `App.tsx` | `app/layout.tsx`, `app/page.tsx` |
| **State (server)** | Zustand + `persist` + localStorage | TanStack Query + Neon Postgres |
| **State (client UI)** | Zustand (everything) | Zustand (theme, selection, view mode only) |
| **Reducers** | `store/reducers/*.ts` | `lib/server/reducers/*.ts` (same code, Node.js runtime) |
| **Tests** | Vitest, 268 tests | Keep Vitest. Add tests for API routes (optional). |
| **Auth** | None | Clerk (`auth()`, `<SignInButton>`, `<UserButton>`) |
| **Database** | None | Drizzle ORM + Neon Postgres |
| **API** | None | Next.js Route Handlers in `app/api/**` |
| **Build output** | `dist/` (static) | `.next/` (serverless) |

**No rewrites needed for:**
- `src/types/*`
- `src/data/*` (seed, catalogues, event tables, activities)
- `src/lib/dice.ts`, `format.ts`, `grid.ts`, `floors.ts`, `domain.ts`
- All 268 existing unit tests (only import paths may change)

---

## 9. Free Tier Limits & Mitigations

| Limit | Value | Impact | Mitigation |
|-------|-------|--------|------------|
| **Function timeout** | 10 s (Hobby) | `advanceWeek` must complete inside one request. | Keep reducers synchronous. Avoid heavy loops. 10s is generous for JSONB CRUD. |
| **Neon compute** | 190 hrs/mo | A D&D group uses this ~3–4 hrs/week. | Well within limits. |
| **Neon storage** | 500 MB | One bastion JSONB is ~50–200 KB. | Room for thousands of campaigns. |
| **Clerk MAU** | 10,000 | Unless the app goes viral. | Effectively unlimited for a hobby project. |
| **Vercel bandwidth** | 100 GB/mo | JSON blobs are tiny. | A non-issue. |
| **Build time** | 45 min (Hobby) | Next.js builds are fast. | Should be under 2 minutes for this project size. |

---

## 10. Post-Migration Feature Roadmap

Once the multiplayer core is live, these become trivial to add:

1. **PC entity tracking** — Add a `pcs` array inside `state_jsonb` and a UI section for weekly slot assignment.
2. **Stronghold level-up** — API route checks treasury, deducts cost, increments `strongholdLevel`, rolls follower.
3. **Push notifications** — Use Vercel Cron to send a weekly "Bastion Turn ready" email (or just in-app badges).
4. **Character portraits / tokens** — Upload to Vercel Blob or Cloudinary; store URLs in JSONB.
5. **SSE instead of polling** — If latency ever matters, swap `refetchInterval` for a lightweight Server-Sent Events stream on a single API route.

---

## 11. Getting Started Checklist

- [ ] Create Neon project and save connection string.
- [ ] Create Clerk application and configure OAuth providers (Google, Discord).
- [ ] Add `DATABASE_URL` and Clerk keys to Vercel Environment Variables.
- [ ] Install Next.js 15 in repo (or scaffold fresh and port files).
- [ ] Move `src/` contents to new Next.js project.
- [ ] Configure Drizzle schema and run first migration.
- [ ] Wire Clerk auth to root layout.
- [ ] Implement `GET /api/bastions/[id]` and `PATCH /api/bastions/[id]`.
- [ ] Replace Zustand persistence with TanStack Query.
- [ ] **Deploy Phase B.** Verify cloud persistence.
- [ ] Implement campaigns, members, and invite codes.
- [ ] Implement `POST /api/bastions/[id]/orders`.
- [ ] Implement `POST /api/bastions/[id]/advance` with pending order resolution.
- [ ] Add polling and optimistic UI badges.
- [ ] **Deploy Phase C.** Run a full turn with friends.

---

*This plan preserves the existing investment in types, reducers, tests, and UI components while adding the minimal necessary backend layer to support multiplayer gameplay. The hybrid JSONB approach keeps the domain model flexible; the relational layer handles the hard problems (auth, concurrency, audit logging).*
