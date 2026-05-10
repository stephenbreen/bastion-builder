import { describe, it, expect } from 'vitest'
import {
  BASIC_FACILITIES_CATALOGUE,
  SIZE_COSTS,
  lookupCatalogueEntry,
} from './facility-catalogue'

describe('SIZE_COSTS', () => {
  it.each([
    ['cramped', 500, 20],
    ['roomy', 1000, 45],
    ['vast', 3000, 125],
  ] as const)('%s costs %i gp and takes %i days', (size, cost, days) => {
    expect(SIZE_COSTS[size]).toEqual({ cost, days })
  })
})

describe('BASIC_FACILITIES_CATALOGUE', () => {
  it('contains the six DMG basic facility types', () => {
    expect(BASIC_FACILITIES_CATALOGUE.map((e) => e.id).sort()).toEqual(
      ['bedroom', 'courtyard', 'dining-room', 'kitchen', 'parlor', 'storage'].sort(),
    )
  })

  it('every entry offers all three sizes', () => {
    for (const entry of BASIC_FACILITIES_CATALOGUE) {
      expect(entry.sizes).toEqual(expect.arrayContaining(['cramped', 'roomy', 'vast']))
      expect(entry.class).toBe('basic')
    }
  })
})

describe('lookupCatalogueEntry', () => {
  it('returns the matching entry by id', () => {
    expect(lookupCatalogueEntry('kitchen')?.name).toBe('Kitchen')
  })
  it('returns undefined for unknown ids', () => {
    expect(lookupCatalogueEntry('not-a-thing')).toBeUndefined()
  })
})
