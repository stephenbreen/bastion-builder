import { describe, it, expect } from 'vitest'
import { seedManor } from '../../data/seed'
import { adjustDomainRenown } from './renown'

describe('adjustDomainRenown', () => {
  it('increments and logs', () => {
    const before = seedManor()
    const after = adjustDomainRenown(before, 3, 'Friendly Visitors')
    expect(after.domain.renown).toBe(3)
    const last = after.log[after.log.length - 1]
    expect(last.type).toBe('system')
    expect(last.outcome).toMatch(/\+3.*3/)
    expect(last.outcome).toMatch(/Friendly Visitors/)
    expect(last.payload).toMatchObject({ delta: 3, before: 0, after: 3 })
  })

  it('floors at 0 when delta would push below', () => {
    const seed = seedManor()
    const before = { ...seed, domain: { ...seed.domain, renown: 2 } }
    const after = adjustDomainRenown(before, -5, 'public scandal')
    expect(after.domain.renown).toBe(0)
    const last = after.log[after.log.length - 1]
    expect(last.outcome).toMatch(/-2 → 0/)
  })

  it('is a no-op when delta is 0', () => {
    const before = seedManor()
    expect(adjustDomainRenown(before, 0)).toBe(before)
  })

  it('is a no-op when already at 0 and delta is negative', () => {
    const before = seedManor() // renown 0
    expect(adjustDomainRenown(before, -3)).toBe(before)
  })

  it('truncates non-integer deltas', () => {
    const after = adjustDomainRenown(seedManor(), 2.7)
    expect(after.domain.renown).toBe(2)
  })

  it('ignores NaN/Infinity', () => {
    const before = seedManor()
    expect(adjustDomainRenown(before, NaN)).toBe(before)
    expect(adjustDomainRenown(before, Infinity)).toBe(before)
  })
})
