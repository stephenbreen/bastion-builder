export const PROJECT_CATEGORIES = [
  'crafting',
  'research',
  'skill',
  'community',
  'special',
] as const

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]

export const ABILITIES = ['STR', 'DEX', 'INT', 'WIS', 'CHA'] as const
export type Ability = (typeof ABILITIES)[number]

export const PROJECT_STATUSES = [
  'active',
  'paused',
  'complete',
  'abandoned',
] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export type Edge = -2 | 0 | 2

export interface ProjectRollEvent {
  id: string
  week: number
  d20: number
  modifier: number
  edge: Edge
  pointsAdded: number
  breakthrough: boolean
  rollerNote?: string
}

export interface Project {
  id: string
  name: string
  category: ProjectCategory
  characteristic: Ability
  goal: number
  current: number
  source?: string
  prerequisite?: string
  /** Free-form list of contributors. Will become PC/Follower refs once PCs land. */
  contributors?: string
  status: ProjectStatus
  events: ProjectRollEvent[]
}
