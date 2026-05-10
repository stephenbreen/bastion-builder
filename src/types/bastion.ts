import type { Domain } from './domain'
import type { CatalogueEntry, Facility, Floor } from './facility'
import type { Follower } from './follower'
import type { Hireling } from './hireling'
import type { LogEntry } from './log'
import type { Project } from './project'

export const ASPECT_LIST = [
  'Bard',
  'Wizard',
  'Paladin',
  'Cleric',
  'Druid',
  'Fighter',
  'Rogue',
  'Ranger',
  'Sorcerer',
  'Warlock',
  'Barbarian',
  'Monk',
  'Artificer',
] as const

export type Aspect = (typeof ASPECT_LIST)[number]

export interface PendingAspect {
  aspect: Aspect
  queuedAtWeek: number
}

export interface WeeklyCosts {
  /** Party-side lifestyle / mounts / per-PC retainers, gp/week. */
  partyLifestyle: number
  /** Bastion Defender upkeep + occasional retainer pay, gp/week. */
  defenderUpkeep: number
  /** Catch-all for ad-hoc weekly outlays. */
  miscellaneous: number
  /** DM-side narrative line on what these costs represent. */
  upkeepNotes?: string
}

export const WEEKLY_COST_KEYS = [
  'partyLifestyle',
  'defenderUpkeep',
  'miscellaneous',
] as const

export type WeeklyCostKey = (typeof WEEKLY_COST_KEYS)[number]

export function emptyWeeklyCosts(): WeeklyCosts {
  return { partyLifestyle: 0, defenderUpkeep: 0, miscellaneous: 0 }
}

export interface Bastion {
  name: string
  aspect: Aspect
  /** Set while a switch is in flight; resolves on the next advanceWeek. */
  pendingAspect?: PendingAspect
  strongholdLevel: 1 | 2 | 3 | 4 | 5
  treasury: number
  inGameWeek: number
  /** K&W domain layer — promoted out of Bastion in Phase 3. */
  domain: Domain
  facilities: Facility[]
  hirelings: Hireling[]
  followers: Follower[]
  projects: Project[]
  log: LogEntry[]
  /** Weekly costs auto-deducted on advance week. Optional — defaults to zeros. */
  weeklyCosts?: WeeklyCosts
  /** DM-only notes — hidden in player view. */
  dmNotes?: string
  /** Per-bastion homebrew catalogue entries (basic-style or special-style). */
  customCatalogueEntries?: CatalogueEntry[]
  /**
   * The floors of the bastion, top-to-bottom in the cutaway. When undefined,
   * the app falls back to DEFAULT_FLOORS — so existing data without an
   * explicit list still renders the canonical 5 floors.
   */
  floors?: Floor[]
}
