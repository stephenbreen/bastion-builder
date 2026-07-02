import { describe, it, expect } from 'vitest'
import type { Aspect } from '../../types'
import { seedManor } from '../../data/seed'
import { ASPECT_SWITCH_COST, cancelAspectSwitch, switchAspect } from './aspect'
import { advanceWeek } from './turn'

const RICH = (n = 1000) => ({ ...seedManor(), treasury: n })

describe('switchAspect', () => {
  it('rejects switching to the current aspect', () => {
    const before = RICH()
    const result = switchAspect(before, 'Bard')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/already/i)
    expect(result.bastion).toBe(before)
  })

  it('rejects an unknown aspect', () => {
    const result = switchAspect(RICH(), 'Necromancer' as unknown as Aspect)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/unknown aspect/i)
  })

  it('rejects when treasury is insufficient', () => {
    const before = { ...seedManor(), treasury: 100 }
    const result = switchAspect(before, 'Wizard')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/treasury/i)
    expect(result.bastion.treasury).toBe(100)
  })

  it('rejects when an aspect switch is already pending', () => {
    const first = switchAspect(RICH(2000), 'Wizard')
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const second = switchAspect(first.bastion, 'Cleric')
    expect(second.ok).toBe(false)
    if (!second.ok) expect(second.reason).toMatch(/already in progress/i)
  })

  it('on success: deducts cost, sets pendingAspect, leaves current aspect alone, logs', () => {
    const before = RICH()
    const result = switchAspect(before, 'Wizard')
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.bastion.treasury).toBe(before.treasury - ASPECT_SWITCH_COST)
    expect(result.bastion.aspect).toBe('Bard')
    expect(result.bastion.pendingAspect).toEqual({
      aspect: 'Wizard',
      queuedAtWeek: before.inGameWeek,
    })

    const last = result.bastion.log[result.bastion.log.length - 1]
    expect(last.type).toBe('system')
    expect(last.outcome).toMatch(/Bard.*Wizard/)
    expect(last.payload).toMatchObject({ from: 'Bard', to: 'Wizard', cost: ASPECT_SWITCH_COST })
  })
})

describe('cancelAspectSwitch', () => {
  it('is a no-op when nothing is pending', () => {
    const before = RICH()
    expect(cancelAspectSwitch(before)).toBe(before)
  })

  it('refunds the cost, clears the field, and logs', () => {
    const queued = switchAspect(RICH(), 'Wizard')
    expect(queued.ok).toBe(true)
    if (!queued.ok) return

    const after = cancelAspectSwitch(queued.bastion)
    expect(after.treasury).toBe(1000)
    expect(after.pendingAspect).toBeUndefined()
    const last = after.log[after.log.length - 1]
    expect(last.outcome).toMatch(/cancelled.*Wizard/i)
    expect(last.payload).toMatchObject({ cancelled: 'Wizard', refund: ASPECT_SWITCH_COST })
  })
})

describe('advanceWeek with pendingAspect', () => {
  it('resolves the switch on the next tick', () => {
    const queued = switchAspect(RICH(), 'Wizard')
    expect(queued.ok).toBe(true)
    if (!queued.ok) return

    const after = advanceWeek(queued.bastion)
    expect(after.aspect).toBe('Wizard')
    expect(after.pendingAspect).toBeUndefined()

    const completion = after.log.find(
      (e) => e.type === 'system' && /complete/i.test(e.outcome) && /Wizard/.test(e.outcome),
    )
    expect(completion).toBeDefined()
    expect(completion?.week).toBe(queued.bastion.inGameWeek + 1)
  })

  it('does nothing aspect-related when no switch is pending', () => {
    const before = seedManor()
    const after = advanceWeek(before)
    expect(after.aspect).toBe(before.aspect)
    expect(after.pendingAspect).toBeUndefined()
    // Aspect-specific system entries should be absent — but a weekly-cost
    // entry is still fine.
    expect(
      after.log.filter(
        (e) => e.type === 'system' && /Aspect switch/i.test(e.outcome),
      ),
    ).toHaveLength(0)
  })
})
