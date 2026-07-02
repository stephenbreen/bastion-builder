import type { DomainSkill } from './domain'

export type Size = 'cramped' | 'roomy' | 'vast'

/**
 * Floor ids are arbitrary strings — bastions ship with five defaults below
 * but DMs can add custom floors at runtime. Kept as a plain string alias so
 * persisted facility data continues to deserialise without coercion.
 */
export type FacilityFloor = string

/** Canonical default floor ids — used as the seed list and for migration. */
export const DEFAULT_FLOOR_IDS = [
  'cellar',
  'ground',
  'first',
  'second',
  'tower',
] as const

export type DefaultFloorId = (typeof DEFAULT_FLOOR_IDS)[number]

export interface Floor {
  id: FacilityFloor
  label: string
}

/** The seed list — top-to-bottom in the cutaway. */
export const DEFAULT_FLOORS: Floor[] = [
  { id: 'tower', label: 'Tower' },
  { id: 'second', label: 'Second floor' },
  { id: 'first', label: 'First floor' },
  { id: 'ground', label: 'Ground floor' },
  { id: 'cellar', label: 'Cellar' },
]

/** Default label lookup — used for migration and as a placeholder in the UI. */
export const FLOOR_LABELS: Record<DefaultFloorId, string> = {
  cellar: 'Cellar',
  ground: 'Ground floor',
  first: 'First floor',
  second: 'Second floor',
  tower: 'Tower',
}

/** @deprecated kept for back-compat; prefer DEFAULT_FLOORS. */
export const FACILITY_FLOORS = DEFAULT_FLOOR_IDS

/** @deprecated kept for back-compat; prefer DEFAULT_FLOORS map order. */
export const FLOOR_RENDER_ORDER: DefaultFloorId[] = [
  'tower',
  'second',
  'first',
  'ground',
  'cellar',
]

export type FacilityClass = 'basic' | 'special'

export const FACILITY_CATEGORIES = [
  'production',
  'knowledge',
  'social',
  'quarters',
  'defense',
  'storage',
] as const

export type FacilityCategory = (typeof FACILITY_CATEGORIES)[number]

export type OrderType =
  | 'Craft'
  | 'Empower'
  | 'Harvest'
  | 'Maintain'
  | 'Recruit'
  | 'Research'
  | 'Trade'

export type FacilityState =
  | 'active'
  | 'damaged'
  | 'disabled'
  | 'under-construction'

export interface DomainSkillBoost {
  skill: DomainSkill
  amount: number
}

export interface Facility {
  id: string
  name: string
  class: FacilityClass
  size: Size
  count?: number
  cost: number
  buildTimeDays: number
  orders: OrderType[]
  pendingOrder?: OrderType
  tierUnlock?: 1 | 2 | 3 | 4 | 5
  hirelingId?: string
  state: FacilityState
  daysRemaining?: number
  domainSkillBoosts?: DomainSkillBoost[]
  /** Which floor the room sits on. Defaults to 'ground' when missing. */
  floor?: FacilityFloor
  /** Functional category — drives floor-plan color coding. */
  category?: FacilityCategory
  notes?: string
}

/**
 * A row in the build catalogue. Both canonical DMG basics and per-bastion
 * homebrew entries share this shape. Homebrew entries set `homebrew: true`
 * and may also carry orders, domain boosts, a hireling label, and per-size
 * cost overrides — i.e. they can author either basic or special facilities.
 */
export interface CatalogueEntry {
  id: string
  name: string
  class: FacilityClass
  category: FacilityCategory
  sizes: Size[]
  tierUnlock?: 1 | 2 | 3 | 4 | 5
  notes?: string
  /** Per-bastion authored entries set this so the UI can badge them. */
  homebrew?: true
  /** Cost / build-time overrides per size; falls back to SIZE_COSTS. */
  costOverride?: Partial<Record<Size, { cost: number; days: number }>>
  /** If set, the new facility starts with these orders (otherwise []). */
  orders?: OrderType[]
  /** Domain-skill boosts copied onto the new facility on build. */
  domainSkillBoosts?: DomainSkillBoost[]
  /** When set, building this room also creates a Hireling with this label. */
  hirelingLabel?: string
}
