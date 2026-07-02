export const DOMAIN_SKILLS = [
  'diplomacy',
  'espionage',
  'lore',
  'operations',
] as const

export type DomainSkill = (typeof DOMAIN_SKILLS)[number]

export const DOMAIN_DEFENSES = ['communications', 'resolve', 'resources'] as const

export type DomainDefense = (typeof DOMAIN_DEFENSES)[number]

export const DOMAIN_SKILL_CAP = 5
export const DOMAIN_DEFENSE_MIN = -3
export const DOMAIN_DEFENSE_MAX = 3

export type DomainSize = 1 | 2 | 3 | 4 | 5

export interface Domain {
  size: DomainSize
  /** Manual / officer-title contributions; computed totals add facility boosts. */
  skills: Record<DomainSkill, number>
  /** Range -3..+3. Drifts toward 0 by 1 step per week between intrigues. */
  defenses: Record<DomainDefense, number>
  renown: number
  intrigueActive: boolean
  intrigueTurnsRemaining: number
  lastIntrigueEndedWeek?: number
}

export function emptyDomain(): Domain {
  return {
    size: 1,
    skills: { diplomacy: 0, espionage: 0, lore: 0, operations: 0 },
    defenses: { communications: 0, resolve: 0, resources: 0 },
    renown: 0,
    intrigueActive: false,
    intrigueTurnsRemaining: 0,
  }
}
