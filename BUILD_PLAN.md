# Build Plan — Bastion Planner Phase 1

Companion to `REQUIREMENTS.md`. This doc covers **how** we build Phase 1 (the MVP per §15 of the requirements).

## 1. Phase 1 scope (recap)

The MVP that gets the manor playable at the table:

- Bastion + facilities + hirelings + treasury (seeded with §11 data).
- Weekly **Bastion Turn** loop: issue orders, resolve outputs, optional event roll on `Maintain`.
- Static **improvements catalogue** with size picker for basic facilities; build queue ticks down per turn.
- Manual log entries for outcomes.
- Local-only persistence (JSON in localStorage, with import/export).

Out of Phase 1: followers, projects, Xanathar activities, domain/intrigue, Aspect switching, the cutaway visual. Those are Phase 2/3.

## 2. Recommended stack

| Layer | Pick | Why |
|---|---|---|
| Build tool | **Vite** | Fast dev loop, zero-config TS, easy to deploy as a static site. |
| Framework | **React 18 + TypeScript** | Type safety for the 8-entity model pays off; React component model fits the dashboard/panel UI well. |
| Styling | **Tailwind CSS** | Quick prototyping; easy to dial in the XCOM/Fallout palette later. |
| State | **Zustand** + middleware for `persist` (localStorage) | Lighter than Redux, works cleanly with TS, persistence is one line. |
| Routing | None in Phase 1 | Single-page dashboard. Add React Router in Phase 3 if we add a player view. |
| Test | **Vitest** | Native to Vite; we'll cover the turn-resolution reducer with unit tests. |
| Lint / format | ESLint + Prettier | Standard. |
| Deploy | Static host (Vercel/Netlify/GitHub Pages) | localStorage means no backend needed. |

**Alternative considered:** plain HTML + vanilla JS. Rejected because the entity graph and turn-resolution logic will get unwieldy without types and a state container.

## 3. Repo structure

```
bastion-planner/
├── REQUIREMENTS.md
├── BUILD_PLAN.md
├── source-rules/                        # move the .md/.html sources here
│   ├── Bastions Dungeon Masters Guide 2024.md
│   ├── Strongholds and Followers.md
│   ├── Kingdoms and Warfare.md
│   ├── Xanathar's Guide Ch 2.md
│   └── Steel Compendium Ch 12.html
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── types/                           # entity types (§3 of REQUIREMENTS)
    │   ├── bastion.ts
    │   ├── facility.ts
    │   ├── hireling.ts
    │   ├── pc.ts
    │   └── log.ts
    ├── data/
    │   ├── seed.ts                      # the manor seed (§11)
    │   ├── facility-catalogue.ts        # available facilities by tier
    │   └── event-table.ts               # DMG d100 event table
    ├── store/
    │   ├── useBastionStore.ts           # Zustand store + persist
    │   └── reducers/
    │       ├── turn.ts                  # advance one Bastion Turn
    │       ├── orders.ts                # issue/resolve orders
    │       ├── events.ts                # roll/resolve events
    │       └── construction.ts          # build queue ticks
    ├── components/
    │   ├── HeaderStrip.tsx              # Aspect, level, renown, treasury, week, "X weeks since intrigue"
    │   ├── FacilityGrid.tsx             # CSS-grid manor floor plan
    │   ├── FacilityTile.tsx             # one cell
    │   ├── FacilityPanel.tsx            # side panel: orders, hireling, history
    │   ├── TurnDialog.tsx               # step the week forward
    │   ├── BuildCatalogue.tsx           # browse + queue construction
    │   ├── ImportExport.tsx             # JSON dump/load
    │   └── ui/                          # tiny primitives (Button, Modal, etc.)
    └── lib/
        ├── dice.ts                      # rng + d100/d20 helpers (seedable for tests)
        └── format.ts                    # gp / day formatting
```

## 4. Data layer (Phase 1 types)

Strict subset of §3 entities for MVP — types we add now and grow into:

```ts
// types/facility.ts
export type Size = 'cramped' | 'roomy' | 'vast';
export type FacilityClass = 'basic' | 'special';
export type OrderType =
  | 'Craft' | 'Empower' | 'Harvest' | 'Maintain'
  | 'Recruit' | 'Research' | 'Trade';

export interface Facility {
  id: string;
  name: string;
  class: FacilityClass;
  size: Size;
  cost: number;
  buildTimeDays: number;
  orders: OrderType[];          // empty for basic
  tierUnlock?: 1|2|3|4|5;
  hirelingId?: string;
  state: 'active' | 'damaged' | 'disabled' | 'under-construction';
  daysRemaining?: number;       // when under-construction
  notes?: string;
}

// types/bastion.ts
export interface Bastion {
  name: string;
  aspect: 'Bard' | 'Wizard' | 'Paladin' | /* ... */ string;
  strongholdLevel: 1|2|3|4|5;
  treasury: number;
  inGameWeek: number;           // monotonic counter; date display is cosmetic
  facilities: Facility[];
  hirelings: Hireling[];
  log: LogEntry[];
}
```

Phase 2 adds `pcs`, `followers`, `projects`, `domain`. Schema is forward-compatible — we just leave those branches off the store for now.

## 5. State + persistence

A single Zustand store holds the `Bastion`. Mutations go through reducer-style functions in `store/reducers/*` so we can unit-test them. `persist` middleware writes the whole tree to `localStorage` on every change, keyed by bastion name.

Import/export = `JSON.stringify(state)` and a file picker. No schema migrations in Phase 1; we'll add a `version` field and migrate later.

## 6. UI sketch (text wireframe)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ The Manor on Old Hill   ▸ Aspect: Bard   ▸ Stronghold L1   ▸ Week 12     │
│ Treasury: 1,250 gp   Domain Renown: 0   Slots: 2/2   No active intrigue  │
└──────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│  FACILITY GRID (manor cutaway)   │  │  FACILITY PANEL (right sidebar)  │
│  ┌──────┬──────┬──────┬──────┐   │  │                                  │
│  │ Bed  │ Bed  │ Bed  │ Bed  │   │  │  Library  (special, roomy)       │
│  ├──────┼──────┼──────┼──────┤   │  │  Hireling: Mira the Archivist    │
│  │ Kit  │ Din  │ Drw  │ Lib★ │   │  │  Orders available:               │
│  ├──────┼──────┼──────┼──────┤   │  │   ◉ Research                     │
│  │ Srv  │ Arm  │ Gar★ │      │   │  │   ◯ Maintain                     │
│  └──────┴──────┴──────┴──────┘   │  │  This week: Research             │
│   ★ = special facility           │  │  History: …                      │
└──────────────────────────────────┘  └──────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────┐
│  [Advance week →]   [Build catalogue]   [Import]   [Export]              │
└──────────────────────────────────────────────────────────────────────────┘
```

The grid is CSS Grid, not isometric — flat tiles for Phase 1. Phase 3 adds the XCOM ant-farm visual.

## 7. Phase 1 milestones

Ordered. Each is a stopping point where the app is demoable.

| # | Milestone | Outcome |
|---|---|---|
| **M0** | Project scaffold | Vite + React + TS + Tailwind running. Empty page. |
| **M1** | Types + store + seed | `useBastionStore` initialized with the manor seed; React renders bastion name and treasury. |
| **M2** | Header strip | Aspect, stronghold level, week, treasury, renown render. |
| **M3** | Facility grid (read-only) | All 8 facilities render as tiles in a CSS grid; hover shows the basic info; special facilities flagged. |
| **M4** | Facility panel | Click a tile → side panel with details, hireling, current state. |
| **M5** | Issue orders | For each special facility, pick this week's order; persists to state. |
| **M6** | Advance week | "Advance week →" button: increments week, ticks build queue, resolves orders to log entries (no event roll yet). |
| **M7** | Bastion event roll | If any facility is on `Maintain`, roll d100 against the DMG event table; log the result; let DM resolve narratively. |
| **M8** | Build catalogue + size picker | Browse-able list filtered by stronghold level; "Build" enqueues construction; ticks down each week. |
| **M9** | Import / export | JSON download + upload. |
| **M10** | Polish + deploy | Tailwind palette, basic styling pass, deploy to Vercel/Netlify. |

Every milestone except M0/M10 should ship with a unit test for the relevant reducer.

## 8. Definition of "Phase 1 done"

- DM can sit at the table, open the app, and run a Bastion Turn end-to-end without a spreadsheet.
- All Phase 1 manor seed data renders.
- Build catalogue lets the DM add a 11th bedroom with size picker, paying treasury, with build time ticking each turn.
- State survives a page refresh; export produces a file that re-imports cleanly.
- A nat-100 on the d100 (Treasure event) triggers a logged event the DM can read.

## 9. Open stack decisions

Worth a quick yes/no before I scaffold M0:

1. **Stack confirm**: Vite + React + TS + Tailwind + Zustand — go, or substitute anything?
2. **Repo move**: shall I move the four rules files into `source-rules/` to declutter the root? (Default: yes.)
3. **Package manager**: npm, pnpm, or bun? (Default: pnpm — fast and clean.)
4. **Deploy target**: Vercel, Netlify, or GitHub Pages? (Default: Vercel — easiest.)

Once those four are confirmed, M0 is roughly a 2-minute scaffold and I can keep going through the milestones in this same session.
