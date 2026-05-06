import { describe, it, expect } from 'vitest'
import {
  formatGp,
  formatWeeksSinceIntrigue,
  nextRenownThreshold,
  specialSlotsTotal,
  totalInvested,
  weeksSinceIntrigue,
} from './format'

describe('formatGp', () => {
  it('formats with thousands separators and gp suffix', () => {
    expect(formatGp(0)).toBe('0 gp')
    expect(formatGp(1500)).toBe('1,500 gp')
    expect(formatGp(15_000)).toBe('15,000 gp')
  })
})

describe('totalInvested', () => {
  it('multiplies by count when provided', () => {
    expect(totalInvested([{ cost: 500, count: 10 }])).toBe(5000)
  })
  it('treats missing count as 1', () => {
    expect(totalInvested([{ cost: 1000 }, { cost: 2500 }])).toBe(3500)
  })
})

describe('specialSlotsTotal', () => {
  it.each([
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ])('level %i grants %i slots', (level, expected) => {
    expect(specialSlotsTotal(level as 1 | 2 | 3 | 4 | 5)).toBe(expected)
  })
})

describe('nextRenownThreshold', () => {
  it('returns the next unlock target', () => {
    expect(nextRenownThreshold(0)).toBe(3)
    expect(nextRenownThreshold(2)).toBe(3)
    expect(nextRenownThreshold(3)).toBe(6)
    expect(nextRenownThreshold(8)).toBe(9)
    expect(nextRenownThreshold(11)).toBe(12)
  })
  it('returns null past the final threshold', () => {
    expect(nextRenownThreshold(12)).toBeNull()
    expect(nextRenownThreshold(20)).toBeNull()
  })
})

describe('weeksSinceIntrigue', () => {
  it('returns null when no intrigue has ended yet', () => {
    expect(weeksSinceIntrigue(5, undefined)).toBeNull()
  })
  it('returns 0 in the same week the intrigue ended', () => {
    expect(weeksSinceIntrigue(5, 5)).toBe(0)
  })
  it('returns the difference in weeks', () => {
    expect(weeksSinceIntrigue(8, 3)).toBe(5)
  })
  it('clamps to 0 if somehow before', () => {
    expect(weeksSinceIntrigue(2, 5)).toBe(0)
  })
})

describe('formatWeeksSinceIntrigue', () => {
  it('handles all branches', () => {
    expect(formatWeeksSinceIntrigue(null)).toBe('No intrigue yet')
    expect(formatWeeksSinceIntrigue(0)).toBe('Intrigue ended this week')
    expect(formatWeeksSinceIntrigue(1)).toBe('1 week since last intrigue')
    expect(formatWeeksSinceIntrigue(7)).toBe('7 weeks since last intrigue')
  })
})
