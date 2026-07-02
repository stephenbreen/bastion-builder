export const FOLLOWER_ROLES = [
  'Project Helper',
  'Unit',
  'Retainer',
  'Artisan',
  'Ambassador',
  'Special Ally',
] as const

export type FollowerRole = (typeof FOLLOWER_ROLES)[number]

export const FOLLOWER_SOURCES = ['renown', 'stronghold'] as const

export type FollowerSource = (typeof FOLLOWER_SOURCES)[number]

export interface Follower {
  id: string
  name: string
  source: FollowerSource
  role: FollowerRole
  /** Free-form description of the bonus this follower provides. */
  bonus?: string
  /** Free-form note on what the follower is currently assigned to. */
  assignment?: string
  notes?: string
}
