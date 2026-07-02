import { describe, it, expect } from 'vitest'
import { seedManor } from '../data/seed'
import { computeHirelingSalaries, computeWeeklyTotal } from './costs'

describe('computeHirelingSalaries', () => {
  it('sums salaryGp across hirelings', () => {
    const seed = seedManor()
    // Seed has 2 hirelings at 5 gp/wk each.
    expect(computeHirelingSalaries(seed)).toBe(10)
  })

  it('returns 0 when there are no hirelings', () => {
    const seed = seedManor()
    expect(computeHirelingSalaries({ ...seed, hirelings: [] })).toBe(0)
  })
})

describe('computeWeeklyTotal', () => {
  it('breaks down all four lines and totals them', () => {
    const seed = seedManor()
    const b = {
      ...seed,
      weeklyCosts: { partyLifestyle: 50, defenderUpkeep: 25, miscellaneous: 5 },
    }
    const result = computeWeeklyTotal(b)
    expect(result.lines.map((l) => l.key)).toEqual([
      'partyLifestyle',
      'hirelings',
      'defenderUpkeep',
      'miscellaneous',
    ])
    expect(result.total).toBe(50 + 10 + 25 + 5)
    expect(result.hirelingTotal).toBe(10)
  })

  it('treats missing weeklyCosts as zero', () => {
    const seed = seedManor()
    const result = computeWeeklyTotal(seed)
    expect(result.total).toBe(10) // hirelings only
  })
})
