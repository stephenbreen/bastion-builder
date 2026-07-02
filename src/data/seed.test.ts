import { describe, it, expect } from 'vitest'
import { seedManor } from './seed'
import { totalInvested } from '../lib/format'

describe('seedManor', () => {
  it('creates The Manor on Old Hill with Bard Aspect at L1', () => {
    const m = seedManor()
    expect(m.name).toBe('The Manor on Old Hill')
    expect(m.aspect).toBe('Bard')
    expect(m.strongholdLevel).toBe(1)
    expect(m.inGameWeek).toBe(1)
  })

  it('has 8 facility entries totalling 15,000 gp invested', () => {
    const m = seedManor()
    expect(m.facilities).toHaveLength(8)
    expect(totalInvested(m.facilities)).toBe(15_000)
  })

  it('fills both stronghold L1 special facility slots', () => {
    const m = seedManor()
    const special = m.facilities.filter((f) => f.class === 'special')
    expect(special).toHaveLength(2)
    expect(special.map((f) => f.id).sort()).toEqual(['library', 'poison-garden'])
  })

  it('has 10 cramped bedrooms costing 5,000 gp total', () => {
    const m = seedManor()
    const bedrooms = m.facilities.find((f) => f.id === 'bedrooms')
    expect(bedrooms).toBeDefined()
    expect(bedrooms?.size).toBe('cramped')
    expect(bedrooms?.count).toBe(10)
    expect((bedrooms?.cost ?? 0) * (bedrooms?.count ?? 0)).toBe(5_000)
  })

  it('library boosts both Lore and Espionage', () => {
    const m = seedManor()
    const library = m.facilities.find((f) => f.id === 'library')
    expect(library?.domainSkillBoosts).toEqual(
      expect.arrayContaining([
        { skill: 'lore', amount: 1 },
        { skill: 'espionage', amount: 1 },
      ]),
    )
  })

  it('poison garden supports the expected order set', () => {
    const m = seedManor()
    const garden = m.facilities.find((f) => f.id === 'poison-garden')
    expect(garden?.orders).toEqual(
      expect.arrayContaining(['Harvest', 'Craft', 'Trade', 'Research', 'Maintain']),
    )
  })

  it('seeds one hireling per special facility', () => {
    const m = seedManor()
    const specialIds = m.facilities
      .filter((f) => f.class === 'special')
      .map((f) => f.id)
    for (const id of specialIds) {
      const hireling = m.hirelings.find((h) => h.facilityId === id)
      expect(hireling).toBeDefined()
      expect(hireling?.loyalty).toBe('loyal')
    }
  })
})
