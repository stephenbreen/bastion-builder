import { describe, it, expect } from 'vitest'
import { seedManor } from '../../data/seed'
import { ASPECT_STRONGHOLD_CLASS } from '../../data/stronghold-levels'
import { levelUpStronghold } from './stronghold-level'

describe('levelUpStronghold', () => {
  it('rejects when stronghold is already L5', () => {
    const before = { ...seedManor(), strongholdLevel: 5 as const, treasury: 100_000 }
    const result = levelUpStronghold(before)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/highest level/i)
  })

  it('rejects when treasury cannot cover the cost', () => {
    // Bard establishment L1→L2 costs 2000 gp.
    const before = { ...seedManor(), treasury: 100 }
    const result = levelUpStronghold(before)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/insufficient treasury/i)
    expect(result.bastion.strongholdLevel).toBe(1)
    expect(result.bastion.treasury).toBe(100)
  })

  it('on success: deducts cost, bumps level, logs an entry that names the follower table', () => {
    const before = { ...seedManor(), treasury: 5000 }
    const result = levelUpStronghold(before)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.bastion.strongholdLevel).toBe(2)
    // Bard = establishment, L1→L2 = 2000 gp.
    expect(result.bastion.treasury).toBe(3000)
    expect(result.quote.cost.gp).toBe(2000)
    expect(result.quote.strongholdClass).toBe('establishment')

    const log = result.bastion.log[result.bastion.log.length - 1]
    expect(log.type).toBe('system')
    expect(log.outcome).toMatch(/L1.*L2/)
    expect(log.outcome).toMatch(/Bard.*follower table/i)
    expect(log.payload).toMatchObject({ from: 1, to: 2, cost: 2000 })
  })

  it('uses the right cost ladder per aspect', () => {
    // Wizard = tower; L1→L2 = 3000 gp.
    const before = { ...seedManor(), aspect: 'Wizard' as const, treasury: 5000 }
    const result = levelUpStronghold(before)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.bastion.treasury).toBe(2000)
    expect(result.quote.cost.gp).toBe(3000)
    expect(result.quote.strongholdClass).toBe('tower')
  })

  it('every aspect maps to one of the four S&F classes', () => {
    const classes = new Set(Object.values(ASPECT_STRONGHOLD_CLASS))
    expect(classes).toEqual(new Set(['keep', 'tower', 'temple', 'establishment']))
  })

  it('composes through L5', () => {
    let b = { ...seedManor(), treasury: 100_000 }
    // Bard establishment ladder: 2000, 4000, 6000, 8000 = 20,000 total.
    for (const expected of [2, 3, 4, 5] as const) {
      const result = levelUpStronghold(b)
      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error('upgrade failed')
      b = result.bastion
      expect(b.strongholdLevel).toBe(expected)
    }
    expect(b.treasury).toBe(100_000 - 20_000)
    // Now at L5, the next call should refuse.
    const beyond = levelUpStronghold(b)
    expect(beyond.ok).toBe(false)
  })
})
