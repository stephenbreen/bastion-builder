import { describe, it, expect } from 'vitest'
import { seedManor } from '../../data/seed'
import { removeFacility, updateFacility } from './facility-edit'

describe('updateFacility', () => {
  it('renames a facility', () => {
    const result = updateFacility(seedManor(), 'library', { name: 'Grand Archive' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.bastion.facilities.find((f) => f.id === 'library')?.name).toBe(
      'Grand Archive',
    )
  })

  it('rejects empty names', () => {
    const result = updateFacility(seedManor(), 'library', { name: '   ' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toMatch(/empty/i)
  })

  it('rejects unknown ids', () => {
    const result = updateFacility(seedManor(), 'nope', { name: 'X' })
    expect(result.ok).toBe(false)
  })

  it('changes state', () => {
    const result = updateFacility(seedManor(), 'library', { state: 'damaged' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.bastion.facilities.find((f) => f.id === 'library')?.state).toBe(
      'damaged',
    )
  })

  it('updates and clears notes', () => {
    const set = updateFacility(seedManor(), 'library', { notes: 'Restored.' })
    expect(set.ok).toBe(true)
    if (!set.ok) return
    expect(set.bastion.facilities.find((f) => f.id === 'library')?.notes).toBe(
      'Restored.',
    )
    const cleared = updateFacility(set.bastion, 'library', { notes: null })
    expect(cleared.ok).toBe(true)
    if (!cleared.ok) return
    expect(cleared.bastion.facilities.find((f) => f.id === 'library')?.notes).toBeUndefined()
  })

  it('returns the same bastion when nothing actually changed', () => {
    const before = seedManor()
    const result = updateFacility(before, 'library', { name: 'Library' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.bastion).toBe(before)
  })
})

describe('removeFacility', () => {
  it('removes the facility and its linked hireling', () => {
    const after = removeFacility(seedManor(), 'library')
    expect(after.facilities.find((f) => f.id === 'library')).toBeUndefined()
    expect(after.hirelings.find((h) => h.id === 'librarian')).toBeUndefined()
  })

  it('logs the demolition', () => {
    const after = removeFacility(seedManor(), 'library')
    const log = after.log.find(
      (e) => e.type === 'system' && e.actor === 'library',
    )
    expect(log).toBeDefined()
    expect(log?.outcome).toMatch(/Library demolished/i)
  })

  it('refunds gp when an amount is given', () => {
    const before = seedManor()
    const after = removeFacility(before, 'library', { refundGp: 1000 })
    expect(after.treasury).toBe(before.treasury + 1000)
    const log = after.log[after.log.length - 1]
    expect(log.outcome).toMatch(/Treasury refund: 1000 gp/)
  })

  it('is a no-op for unknown ids', () => {
    const before = seedManor()
    expect(removeFacility(before, 'nope')).toBe(before)
  })
})
