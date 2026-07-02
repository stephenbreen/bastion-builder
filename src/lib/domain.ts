import type { Domain, DomainSkill, Facility } from '../types'
import { DOMAIN_SKILLS, DOMAIN_SKILL_CAP } from '../types'

export interface DomainSkillContribution {
  source: string
  amount: number
}

export interface DomainSkillBreakdown {
  skill: DomainSkill
  base: number
  contributions: DomainSkillContribution[]
  raw: number
  total: number
  capApplied: boolean
}

export function computeDomainSkill(
  skill: DomainSkill,
  domain: Domain,
  facilities: Facility[],
): DomainSkillBreakdown {
  const base = domain.skills[skill] ?? 0
  // Only active facilities contribute. Damaged / disabled / under-construction
  // don't pull their weight in the domain layer.
  const contributions: DomainSkillContribution[] = facilities
    .filter((f) => f.state === 'active')
    .flatMap((f) =>
      (f.domainSkillBoosts ?? [])
        .filter((b) => b.skill === skill)
        .map((b) => ({ source: f.name, amount: b.amount })),
    )
  const sum = contributions.reduce((s, c) => s + c.amount, base)
  const total = Math.min(sum, DOMAIN_SKILL_CAP)
  return {
    skill,
    base,
    contributions,
    raw: sum,
    total,
    capApplied: sum > DOMAIN_SKILL_CAP,
  }
}

export function computeDomainSkills(
  domain: Domain,
  facilities: Facility[],
): Record<DomainSkill, DomainSkillBreakdown> {
  return DOMAIN_SKILLS.reduce(
    (acc, skill) => {
      acc[skill] = computeDomainSkill(skill, domain, facilities)
      return acc
    },
    {} as Record<DomainSkill, DomainSkillBreakdown>,
  )
}
