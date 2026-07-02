# Bastion Planner — Requirements

A web-based tool for tracking a D&D party's stronghold/bastion, blending rules from:

- **DMG 2024 Bastions** — facilities, orders, events, weekly turn structure
- **Strongholds & Followers (MCDM)** — stronghold levels, class-tied followers, upgrade ladder
- **Kingdoms & Warfare (MCDM)** — domain skills, defenses, intrigue (warfare rules excluded)
- **Xanathar's Guide Ch. 2** — downtime activities (workweek loop)
- **Steel Compendium / Draw Steel Ch. 12** — downtime projects (milestone progress bars)

## 1. Vision

A single-page web app, GM-controlled, that gives a D&D party an at-a-glance view of their stronghold like the **XCOM 2 ant-farm base view** or **Fallout Shelter**. The GM uses it to track facilities, hirelings, followers, weekly orders, projects, renown, and domain intrigue. Players use it as a party sheet to plan and commit to weekly bastion/stronghold activities.

**Primary user:** the DM (single-user authoritative editor in v1).
**Secondary user:** the party (read + propose actions; DM resolves).

## 2. Goals & non-goals

**Goals**
- Visualise the stronghold as a 2D cutaway (rooms = facilities), with hirelings/followers populating them.
- Let the GM run a **Bastion Turn** end-to-end (weekly cadence): issue orders, resolve events, log outputs.
- Track all four downtime tracks per PC per week (Bastion order / Xanathar activity / Steel project roll / Domain action).
- Manage facilities, hirelings, followers, projects, renown, intrigue cadence in one place.
- Persist state between sessions (local storage at minimum; cloud sync nice-to-have).

**Non-goals (Phase 1)**
- Combat / warfare resolution (Kingdoms & Warfare unit rules excluded).
- Multi-party / multi-DM accounts.
- Full character-sheet replacement (we link out / hand-track HP, spells, etc.).
- Procedural map generation. The cutaway is data-driven but artist-curated tiles.

## 3. Domain model

Eight core entities. Names below are canonical for the codebase.

### 3.1 Bastion
The top-level container. The party's stronghold.

| Field | Type | Notes |
|---|---|---|
| `name` | string | "The Manor on Old Hill" |
| `aspect` | enum class | Current class theme (see §4). Initial: **Bard**. |
| `strongholdLevel` | int 1–5 | Initial: **1**. Drives slot count and facility tier. |
| `specialSlotsTotal` | int derived | 2 / 3 / 4 / 5 / 6 by level. |
| `specialSlotsUsed` | int derived | Count of active special facilities. |
| `treasury` | int gp | Bastion's own coffers, distinct from party gold. |
| `notes` | markdown | DM scratch space. |

### 3.2 Facility
Either **basic** (flavour, no orders) or **special** (one Bastion order per turn).

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable key. |
| `name` | string | "Library", "Poison Garden". |
| `class` | enum | `basic` \| `special`. |
| `size` | enum | `cramped` \| `roomy` \| `vast`. |
| `cost` | int gp | Construction cost (see §11 manor seed). |
| `buildTimeDays` | int | RAW: 20/45/125 for cramped/roomy/vast basic. |
| `orders` | array of `OrderType` | Empty for basic. e.g. `[Harvest, Craft, Trade, Research, Maintain]` for Poison Garden. |
| `tierUnlock` | int 1–5 | Stronghold level required (special only). |
| `domainSkillBoost` | array | e.g. `[{ skill: "Lore", amount: 1 }, { skill: "Espionage", amount: 1 }]` for Library. |
| `hireling` | Hireling ref | Required for special facilities to function. |
| `state` | enum | `active` \| `damaged` \| `disabled` (e.g. after a Lost Hirelings event). |
| `notes` | markdown | |

### 3.3 Hireling
Bound to a facility. Auto-paid via the `Maintain` order. Cannot move between facilities mid-turn.

| Field | Type | Notes |
|---|---|---|
| `name` | string | Memorable NPC. |
| `role` | string | Gardener / Librarian / Armourer / etc. |
| `facilityId` | ref | One facility, one hireling. |
| `loyalty` | enum | `loyal` \| `wavering` \| `bribed` \| `lost` (event-driven). |
| `salaryGp` | int | Auto-paid; tracked for narrative only. |
| `notes` | markdown | |

### 3.4 Follower
People loyal to the **party**, not the building. Help with **project rolls** (+1 roll per week per follower) or fill an S&F unit/retainer/artisan/ambassador role.

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `source` | enum | `renown` (unlocked via threshold) \| `stronghold` (rolled on Aspect's S&F follower table at level-up). |
| `role` | enum | `Project Helper` \| `Unit` \| `Retainer` \| `Artisan` \| `Ambassador` \| `Special Ally`. |
| `bonus` | string | "+2 to Reason rolls on Research projects", "+1 unit of city watch", etc. |
| `assignment` | ref | A Project, a Facility, a PC, or unassigned. |
| `notes` | markdown | |

### 3.5 PC (party member)
Each PC owns a **weekly slot** (one action per in-game week) and a personal renown modifier.

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `class` | string | Their D&D class (independent of bastion Aspect). |
| `level` | int | |
| `domainTitle` | enum | K&W titles (verbatim) — Cap'n / Tactical Marshal / Deathlord / etc. |
| `weeklySlot` | object | `{ week: <date>, type: order|activity|project|domain, target: <id> }` — one per week. |
| `renownModifier` | int signed | Personal delta off the domain renown floor. Defaults 0. |
| `renownItems` | array | Items granting "+N personal" or "+N domain" — explicit. |

### 3.6 Domain (K&W)
The faction-level layer. One domain per bastion in v1.

| Field | Type | Notes |
|---|---|---|
| `size` | int 1–5 | Initial: **1** (urban manor footprint, a few city blocks). |
| `skills` | object | `{ diplomacy: 0, espionage: 0, lore: 0, operations: 0 }` — modified by facilities, followers, officer titles. |
| `defenses` | object | `{ communications: 0, resolve: 0, resources: 0 }`, range -3..+3. Drift toward 0 by 1/week between intrigues. |
| `renown` | int 0+ | The shared track. Unlocks follower slots at 3/6/9/12. |
| `lastIntrigueEnded` | date \| null | Used to render "X weeks since last intrigue" on the dashboard. |
| `intrigueActive` | bool | Toggled by the GM. Opens 5-turn intrigue (4 + size). |
| `intrigueTurnsRemaining` | int | Counts down during active intrigue. |

### 3.7 Project (Steel Compendium)
A milestone-based long task with a progress bar.

| Field | Type | Notes |
|---|---|---|
| `name` | string | "Decipher the manor's hidden ledger". |
| `category` | enum | `crafting` \| `research` \| `skill` \| `community` \| `special`. |
| `characteristic` | enum | D&D ability — STR/DEX/INT/WIS/CHA (mapped from Draw Steel — see §8.2). |
| `goal` | int | Project points required (15 / 45 / 120 / 240+ by complexity). |
| `current` | int | Accumulated points. |
| `source` | string | Lore/expert required to make rolls (e.g., "Library", "NPC mentor"). |
| `prerequisite` | string | Item/resource needed to start. |
| `contributors` | array of refs | PCs and/or Followers who have rolled. |
| `breakthroughRule` | const | Nat **20 only** grants a breakthrough (+1 free roll same week, no point bonus). Homebrew: not 19+20. |
| `events` | array | Complications fired during rolls. |
| `status` | enum | `active` \| `paused` \| `complete` \| `abandoned`. |

### 3.8 Activity / Event Log
Append-only weekly log. One entry per PC per week + one entry per Bastion event/intrigue turn.

| Field | Type | Notes |
|---|---|---|
| `week` | in-game date | |
| `actor` | ref | PC / Bastion / Domain. |
| `type` | enum | `bastion-order` \| `xanathar-activity` \| `project-roll` \| `domain-action` \| `bastion-event` \| `intrigue-turn`. |
| `payload` | object | Type-specific (order issued, activity name, roll result, event roll, etc.). |
| `outcome` | string | Narrative summary + mechanical effect. |

## 4. Aspect

Each Bastion has **one Aspect** at a time — a class theme that drives:

| Aspect drives | For Aspect = **Bard** (current) |
|---|---|
| S&F stronghold *type* mechanics (upgrade ladder, base benefits) | Establishment (urban, revenue-flavored — fits a city manor) |
| Class-specific stronghold features (per S&F class chapter) | Bardic-flavored bonuses, social/inspiration tilts |
| Which followers can be rolled when stronghold levels up | Bard's class follower table |
| Demesne flavour | Influence, reputation, cultural sway |

**Switching Aspect:** **500 gp + 1 in-game week** of downtime, no roll. Followers earned under the prior Aspect remain (loyal to people, not building).

## 5. Stronghold progression

Levels 1–5. Upgrading the stronghold:
- Adds one **special facility slot** (per §3.1 derived count).
- Allows one roll on the Aspect's **S&F class follower table** (granting a `stronghold`-source follower).
- Unlocks the next tier of available facilities (see §6).

**Cost ladder** — averages across S&F's four stronghold types (Keep / Tower / Temple / Establishment), so upgrade cost is Aspect-agnostic:

| Level | Upgrade cost (gp) | Upgrade time (days) |
|---|---|---|
| 1→2 | 3,250 | 40 |
| 2→3 | 6,500 | 80 |
| 3→4 | 11,250 | 120 |
| 4→5 | 16,000 | 160 |

Derivation: arithmetic mean of S&F per-class costs (Keep 5/10/15/20k, Tower 3/6/12/18k, Temple 3/6/12/18k, Establishment 2/4/6/8k) and matching times.

## 6. Facility tiers (slot count + tier unlocks)

| Stronghold level | Special facility slots | Tier of facility unlocked |
|---|---|---|
| 1 | 2 | RAW DMG L5-tier facilities |
| 2 | 3 | + RAW L9-tier |
| 3 | 4 | + RAW L13-tier |
| 4 | 5 | (refinements / second copies) |
| 5 | 6 | + RAW L17-tier (Demiplane, Sanctum, etc.) |

Basic facilities are **unlimited** at any stronghold level (cost/time per RAW: 500/20, 1k/45, 3k/125 for cramped/roomy/vast).

## 7. Bastion Turn (weekly loop)

One Bastion Turn = **1 in-game week**. The DM steps through:

1. **Maintenance check** — if no order is issued for a facility, it auto-Maintains.
2. **Issue orders** — for each special facility with a hireling, choose one of its allowed orders.
3. **Resolve outputs** — items crafted, gold from Trade, intel from Research, harvested resources, etc.
4. **Roll Bastion event** — d100 if any facility issued `Maintain`. Resolve the DMG event table (Attack, Friendly Visitors, Refugees, etc.). Log it.
5. **Decay defenses** — domain defenses drift toward 0 by 1 step (only between intrigues).
6. **Tick projects** — apply contributor project rolls for the week.
7. **Update intrigue counter** — increment "weeks since last intrigue" if no intrigue active.

### 7.1 Order types
Standard DMG orders, restricted per facility:

| Order | What it does |
|---|---|
| `Craft` | Produce an item using facility's craft tables. |
| `Empower` | Temporary buff to a PC or ally. |
| `Harvest` | Gather facility-specific resource. |
| `Maintain` | Rest the facility, no output. Triggers event roll. |
| `Recruit` | Attract Bastion Defenders or themed creatures. |
| `Research` | Gather information (Library, Archive, Scriptorium). |
| `Trade` | Buy/sell goods; generate gold. |

## 8. Weekly PC action menu

Each PC, each in-game week, picks **one** slot type:

| Slot type | Source | Output | Tracked as |
|---|---|---|---|
| **Issue a Bastion order** | DMG 2024 | Facility output | Bastion turn log + facility log |
| **Take a Xanathar activity** | XGtE | Gold / contacts / favors | Activity log |
| **Make a project roll** | Steel Compendium | +N project points | Project tracker |
| **Domain skill action** | K&W | Improve a defense or skill score | Domain sheet (intrigue only) |

PCs cannot double up. The DM can override (e.g. "you can squeeze in carousing on top of issuing an order this week — but at a cost"), but the system tracks one slot per PC per week by default.

### 8.1 Xanathar activity catalogue
14 activities, each with workweek cost, gold cost, skill check, and d6/d8 complication table. The app stores these as a static reference and lets the DM record outcomes per PC per week.

### 8.2 Steel Compendium project mechanics
- Roll the project's characteristic (D&D ability, mapped from Draw Steel below). Total = project points added (min 1).
- **Breakthrough**: nat 20 only → +1 free roll this week, no point bonus from the breakthrough itself (homebrew).
- Edge / bane modifiers (from items, followers): ±2.
- One personal roll per PC per week. **Followers** assigned to a project grant +1 roll per week each. **Hirelings** can be paid to add project rolls: **50 gp/week per hireling**, max 1 hireling per project.

**Draw Steel → D&D 5e ability mapping (homebrew, locked):**

| Draw Steel | D&D 5e |
|---|---|
| Might | Strength |
| Agility | Dexterity |
| Reason | Intelligence |
| Intuition | Wisdom |
| Presence | Charisma |

## 9. Followers & hirelings

Two distinct rosters. They do different things:

| | Hireling | Follower |
|---|---|---|
| Loyal to | The facility / the building | The party |
| Granted via | Building/staffing a special facility | Renown threshold (3/6/9/12) **or** stronghold level-up roll |
| Function | Lets a facility issue orders | +1 project roll per week when assigned, or fills an S&F unit/retainer/artisan/ambassador slot |
| Lost via | Bastion events (Lost Hirelings, Criminal Hireling) | Death / dismissal / story |
| Cost | Salary auto-paid via Maintain | Upkeep narrative-only |

**Renown follower slots**

| Domain Renown | Effect |
|---|---|
| 3 | +1 follower slot |
| 6 | +1 follower slot |
| 9 | +1 follower slot |
| 12 | +1 follower slot |

**Stronghold-level followers** are rolled on the current Aspect's S&F class follower chart at each stronghold upgrade.

## 10. Renown — dual track

**Domain Renown** (shared, int 0+)
- Earned: group bastion events, shared projects, DM story grants, completion of community projects.
- Spent only on **bastion-wide** moves (calling a domain favour, hosting a public event).
- The **only** track that counts toward 3/6/9/12 follower-slot unlocks.

**Personal Renown Modifier** (per PC, signed int)
- Earned: personal projects, fame items, individual carousing wins, class feats.
- Spent on personal favours / NPC reputation rolls.
- Display as: **effective personal renown = Domain Renown + modifier**.
- Spending personal renown only decrements the PC's modifier — never the domain pool.
- Spending domain renown only decrements the domain pool — never any PC's modifier.

Magic items / boons attach their effect explicitly: `+N personal` or `+N domain`, never ambiguous.

### 10.1 Renown reference table (DM discretion — guideline values)

The DM grants/deducts renown at their discretion; the app surfaces this table as a quick reference and provides a "+/− renown" button. **None of these are automatic.**

| Trigger | Suggested change |
|---|---|
| Bastion event: **Friendly Visitors** (event 64–72) | +1 domain |
| Bastion event: **Request for Aid** succeeded (event 92–98) | +1 domain |
| Bastion event: **Refugees** sheltered | +1 domain |
| Bastion event: **Treasure** publicised | +1 domain |
| Steel project: **Build Road** completed | +1 to +3 domain (per RAW) |
| Steel project: **Community Service** completed | +1 personal (or +1 domain if performed as a group project) |
| Steel project: **Spend Time With Loved Ones** | +1 personal |
| Hosting a public event / feast at the manor | +1 to +2 domain |
| Defeating a notable threat publicly | +1 to +3 domain |
| Stronghold upgrade completed (visible construction) | +1 domain |
| Fame-boosting magic item (per item description) | +N personal |
| Failed quest / public scandal | −1 to −2 domain |
| Burning a personal favour | −N personal |
| Calling in a domain favour (city watch raid, guild backup) | −1 to −3 domain |

## 11. Manor — seed data

**Aspect**: Bard. **Stronghold level**: 1. **Domain size**: 1. **Renown**: 0. **Total invested**: 15,000 gp.

| Facility | Class | Size | Cost (gp) | Notes |
|---|---|---|---|---|
| Bedrooms ×10 | basic | cramped | 5,000 | 500 gp ea. No master suites. |
| Kitchen | basic | roomy | 1,000 | |
| Dining Hall | basic | roomy | 1,000 | |
| Drawing Room | basic | roomy | 1,000 | |
| Servants' Quarters | basic | roomy | 1,000 | |
| Armoury | basic | roomy | 1,000 | Treated as basic until upgraded to special Smithy/Armory. |
| Functional Garden (Poison) | special | roomy | 2,500 | Hireling: Poisoner/Herbalist. Orders: Harvest, Craft, Trade, Research, Maintain. Boosts domain Espionage. |
| Library *(just completed)* | special | roomy | 2,500 | Hireling: Librarian. Orders: Research, Maintain (+ Craft for scrolls if Aspect allows). Boosts domain Lore **and** Espionage. |

## 12. Domain intrigue (K&W)

- Intrigues are **DM-triggered**. The dashboard shows "**X weeks since last intrigue**" prominently.
- When the DM begins an intrigue: it lasts **5 turns** (4 + domain size 1). Each turn, every officer (PC) gets 1 action + 1 bonus action + 1 reaction.
- During intrigue, a PC's weekly slot can be spent on a **Domain action** (improve a defense, attack an enemy defense, use a domain feature).
- Skill tests: DC 13 + current defense level (own); vs enemy defense (sabotage). Nat 20 = ±2 levels.
- After intrigue ends, defenses drift back toward 0 by 1 step per week.

**Domain skill modifiers from facilities (homebrew, locked):**

| Facility | Boosts |
|---|---|
| Library | Lore +1, Espionage +1 |
| Poison Garden | Espionage +1 |
| Armoury (when upgraded to special) | Operations +1 |
| (Future) Pub / Guildhall | Diplomacy +1 |
| (Future) War Room | Operations +1, Communications +1 |

Officer titles (K&W, verbatim) add a PC's proficiency bonus to one chosen domain skill per intrigue.

**Domain skill cap**: each of the four skills (Diplomacy / Espionage / Lore / Operations) is capped at **+5** total, summing all facility boosts, follower bonuses, and officer-title contributions. Excess stacks are wasted.

## 13. UI / UX requirements

### 13.1 Dashboard ("the base view")
- A 2D cutaway of the manor, **XCOM 2 / Fallout Shelter style**: each room is a tile representing a facility.
- Rooms render with their hireling sprite/avatar.
- Click a room to open the **facility panel** (orders, hireling, current week's order, history).
- Status badges: damaged, disabled, hireling lost, order issued for the week.
- Persistent header strip: bastion name, Aspect, stronghold level, domain renown, treasury, current in-game week, "X weeks since last intrigue".

### 13.2 Party sheet
- One row per PC: name, class, domain title, weekly slot status (✓ committed / pending), personal renown modifier.
- Click a PC to set their weekly slot — choose between Bastion order / Xanathar activity / project roll / domain action.

### 13.3 Improvements catalogue
- Browse-able list of available basic and special facilities (filtered by stronghold level and Aspect).
- Each entry: cost, build time, prerequisites, hireling type, orders unlocked, domain skill boosts.
- For basic facilities, the user picks the **size** (cramped / roomy / vast) at build time — cost and build time scale per RAW (500 gp / 20 days, 1,000 / 45, 3,000 / 125). Default size suggestion shown but always editable.
- "Build" button enqueues construction (consumes treasury, creates an in-progress facility entry, decrements time per week).

### 13.4 Project tracker
- One card per project: progress bar, contributors, source/prerequisite, last roll, events log.
- "Make a roll" button (opens a modal: which PC/Follower, which characteristic, +/− edge).

### 13.5 Domain & intrigue panel
- Domain skills (4) and defenses (3) with current values.
- "Begin Intrigue" button (DM only). Active-intrigue mode reveals turn counter and per-PC action queue.
- Timeline of past intrigues with notes.

### 13.6 Logs
- Filterable activity log (per PC, per facility, per week).
- Bastion event log.
- Intrigue history.

## 14. Technical considerations (informational, not deciding stack here)

- **Persistence**: localStorage for v1 (single DM, single device); JSON export/import.
- **Rendering**: tile-based 2D grid for the cutaway; static art assets per facility tile + size.
- **State shape**: a single tree mirroring §3 entities; mutations via reducer-style actions for replayability.
- **No backend in v1.** A future v2 could add Firebase/Supabase for player read-access.

## 15. Phasing

**Phase 1 (MVP)** — covers the user's immediate need:
- Bastion + facilities + hirelings + treasury.
- Bastion Turn loop with order issuance and event resolution.
- Manor seeded with §11 data.
- Manual log entries.
- Static improvements catalogue.

**Phase 2**
- Followers + Renown dual track.
- Steel Compendium project tracker.
- Xanathar activity catalogue with complication tables.
- Aspect switching.

**Phase 3**
- Domain + intrigue mechanics.
- Cutaway visual ("XCOM ant-farm") with click-through facilities.
- Player read-only view.

## 16. Resolved homebrew decisions

All v1 design questions have been answered and folded into the doc:

- **Dining hall** → roomy, 1,000 gp (§11). Builder UI lets the DM pick size for any basic facility (§13.3).
- **Master suites** → none; all 10 bedrooms are cramped (§11).
- **Stronghold upgrade ladder** → averaged across all four S&F class types, Aspect-agnostic (§5).
- **Renown earn rates** → DM discretion, with a guideline reference table surfaced in the app (§10.1).
- **Domain skill cap** → +5 per skill (§12).

## 17. Out of scope

- Kingdoms & Warfare unit / battlefield rules.
- NPC AI / autonomous bastion play (DM is always in the loop).
- Multi-bastion management.
- Character sheet replacement.
- Random encounter / adventure generation.
