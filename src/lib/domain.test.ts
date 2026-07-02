import { describe, it, expect } from 'vitest'
import type { Facility } from '../types'
import { emptyDomain } from '../types'
import { computeDomainSkill, computeDomainSkills } from './domain'

const facility = (
  id: string,
  state: Facility['state'],
  boosts: Facility['domainSkillBoosts'],
): Facility => ({
  id,
  name: id,
  class: 'special',
  size: 'roomy',
  cost: 2500,
  buildTimeDays: 45,
  orders: [],
  state,
  domainSkillBoosts: boosts,
})

describe('computeDomainSkill', () => {
  it('returns 0 with no contributors', () => {
    const result = computeDomainSkill('lore', emptyDomain(), [])
    expect(result.total).toBe(0)
    expect(result.contributions).toEqual([])
    expect(result.capApplied).toBe(false)
  })

  it('sums boosts from active facilities', () => {
    const facilities = [
      facility('library', 'active', [
        { skill: 'lore', amount: 1 },
        { skill: 'espionage', amount: 1 },
      ]),
      facility('garden', 'active', [{ skill: 'espionage', amount: 1 }]),
    ]
    expect(computeDomainSkill('lore', emptyDomain(), facilities).total).toBe(1)
    expect(computeDomainSkill('espionage', emptyDomain(), facilities).total).toBe(2)
    expect(computeDomainSkill('diplomacy', emptyDomain(), facilities).total).toBe(0)
  })

  it('ignores damaged / disabled / under-construction facilities', () => {
    const facilities = [
      facility('library', 'damaged', [{ skill: 'lore', amount: 1 }]),
      facility('garden', 'disabled', [{ skill: 'espionage', amount: 1 }]),
      facility('archive', 'under-construction', [{ skill: 'lore', amount: 1 }]),
    ]
    const result = computeDomainSkills(emptyDomain(), facilities)
    expect(result.lore.total).toBe(0)
    expect(result.espionage.total).toBe(0)
  })

  it('caps the total at +5 and flags capApplied', () => {
    const facilities = Array.from({ length: 8 }).map((_, i) =>
      facility(`f${i}`, 'active', [{ skill: 'operations', amount: 1 }]),
    )
    const result = computeDomainSkill('operations', emptyDomain(), facilities)
    expect(result.raw).toBe(8)
    expect(result.total).toBe(5)
    expect(result.capApplied).toBe(true)
  })

  it('includes contributing source names', () => {
    const facilities = [
      facility('Library', 'active', [{ skill: 'lore', amount: 1 }]),
    ]
    const result = computeDomainSkill('lore', emptyDomain(), facilities)
    expect(result.contributions).toEqual([{ source: 'Library', amount: 1 }])
  })
})
