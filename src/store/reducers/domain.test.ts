import { describe, it, expect } from 'vitest'
import { seedManor } from '../../data/seed'
import {
  adjustDomainDefense,
  beginIntrigue,
  endIntrigue,
  setDomainDefense,
  setDomainSize,
} from './domain'
import { advanceWeek } from './turn'

describe('setDomainSize', () => {
  it.each([
    [0, 1],
    [1, 1],
    [3, 3],
    [5, 5],
    [9, 5],
  ])('clamps %i into [1,5] → %i', (input, expected) => {
    const after = setDomainSize(seedManor(), input)
    expect(after.domain.size).toBe(expected)
  })

  it('logs the change', () => {
    const after = setDomainSize(seedManor(), 3)
    expect(after.log[after.log.length - 1].outcome).toMatch(/size 1 → 3/)
  })

  it('is a no-op when target equals current', () => {
    const before = seedManor()
    expect(setDomainSize(before, 1)).toBe(before)
  })

  it('is a no-op for non-finite input', () => {
    const before = seedManor()
    expect(setDomainSize(before, NaN)).toBe(before)
  })
})

describe('setDomainDefense', () => {
  it.each([
    [-9, -3],
    [-3, -3],
    [0, 0],
    [3, 3],
    [9, 3],
  ])('clamps %i into [-3, +3] → %i', (input, expected) => {
    const after = setDomainDefense(seedManor(), 'resolve', input)
    expect(after.domain.defenses.resolve).toBe(expected)
  })

  it('is a no-op when value matches current', () => {
    const before = seedManor()
    expect(setDomainDefense(before, 'resolve', 0)).toBe(before)
  })

  it('logs with the defense name and arrow', () => {
    const after = setDomainDefense(seedManor(), 'resources', 2)
    expect(after.log[after.log.length - 1].outcome).toMatch(/resources/)
  })
})

describe('adjustDomainDefense', () => {
  it('delegates to setDomainDefense with delta arithmetic', () => {
    let b = seedManor()
    b = adjustDomainDefense(b, 'communications', 2)
    expect(b.domain.defenses.communications).toBe(2)
    b = adjustDomainDefense(b, 'communications', -10) // clamped to -3
    expect(b.domain.defenses.communications).toBe(-3)
  })
})

describe('beginIntrigue / endIntrigue', () => {
  it('begin sets active + turns = 4 + size and logs', () => {
    let b = seedManor()
    b = setDomainSize(b, 2)
    const after = beginIntrigue(b)
    expect(after.domain.intrigueActive).toBe(true)
    expect(after.domain.intrigueTurnsRemaining).toBe(6)
    const last = after.log[after.log.length - 1]
    expect(last.type).toBe('intrigue-turn')
    expect(last.outcome).toMatch(/begins.*6 turns/)
  })

  it('begin is a no-op when already active', () => {
    const b = beginIntrigue(seedManor())
    expect(beginIntrigue(b)).toBe(b)
  })

  it('end clears active, sets lastIntrigueEndedWeek, logs', () => {
    let b = beginIntrigue(seedManor())
    b = { ...b, inGameWeek: 5 }
    const after = endIntrigue(b)
    expect(after.domain.intrigueActive).toBe(false)
    expect(after.domain.intrigueTurnsRemaining).toBe(0)
    expect(after.domain.lastIntrigueEndedWeek).toBe(5)
    expect(after.log[after.log.length - 1].outcome).toMatch(/concluded/i)
  })

  it('end is a no-op when not active', () => {
    const b = seedManor()
    expect(endIntrigue(b)).toBe(b)
  })
})

describe('advanceWeek intrigue + drift', () => {
  it('decrements intrigue turns each week', () => {
    let b = seedManor()
    b = setDomainSize(b, 1) // 5-turn intrigue
    b = beginIntrigue(b)
    b = advanceWeek(b)
    expect(b.domain.intrigueTurnsRemaining).toBe(4)
    b = advanceWeek(b)
    expect(b.domain.intrigueTurnsRemaining).toBe(3)
  })

  it('auto-ends when turns reach 0 and stamps lastIntrigueEndedWeek', () => {
    let b = seedManor()
    b = setDomainSize(b, 1) // 5 turns total
    b = beginIntrigue(b)
    for (let i = 0; i < 5; i++) b = advanceWeek(b)
    expect(b.domain.intrigueActive).toBe(false)
    expect(b.domain.intrigueTurnsRemaining).toBe(0)
    expect(b.domain.lastIntrigueEndedWeek).toBe(b.inGameWeek)
    expect(
      b.log.some(
        (e) => e.type === 'intrigue-turn' && /concluded/i.test(e.outcome),
      ),
    ).toBe(true)
  })

  it('drifts defenses toward 0 by 1 step per week between intrigues', () => {
    let b = seedManor()
    b = adjustDomainDefense(b, 'communications', 3)
    b = adjustDomainDefense(b, 'resolve', -2)
    // resources stays at 0 — no drift expected.

    b = advanceWeek(b)
    expect(b.domain.defenses.communications).toBe(2)
    expect(b.domain.defenses.resolve).toBe(-1)
    expect(b.domain.defenses.resources).toBe(0)

    b = advanceWeek(b)
    expect(b.domain.defenses.communications).toBe(1)
    expect(b.domain.defenses.resolve).toBe(0)
  })

  it('does not drift defenses while an intrigue is active', () => {
    let b = seedManor()
    b = adjustDomainDefense(b, 'resolve', 2)
    b = beginIntrigue(b)
    const before = b.domain.defenses.resolve
    b = advanceWeek(b)
    expect(b.domain.defenses.resolve).toBe(before)
  })
})
