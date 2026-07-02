import { describe, it, expect } from 'vitest'
import type { Bastion, Facility } from '../../types'
import { seedManor } from '../../data/seed'
import { advanceWeek } from './turn'

// Stub RNGs map directly to rollD100 outputs:
//   0   -> roll 1
//   0.5 -> roll 51
//   0.99-> roll 100
const rngFor = (...rolls: number[]) => {
  let i = 0
  return () => {
    const roll = rolls[i++ % rolls.length]
    return (roll - 1) / 100 + 1e-9 // bias slightly into the bucket
  }
}

function withFacility(b: Bastion, id: string, patch: Partial<Facility>): Bastion {
  return {
    ...b,
    facilities: b.facilities.map((f) => (f.id === id ? { ...f, ...patch } : f)),
  }
}

describe('advanceWeek', () => {
  it('increments inGameWeek by 1', () => {
    const before = seedManor()
    const after = advanceWeek(before)
    expect(after.inGameWeek).toBe(before.inGameWeek + 1)
  })

  it('leaves an idle bastion (no costs, no orders) with no new log entries', () => {
    // Strip hirelings so weekly cost is 0 — otherwise advanceWeek logs the deduction.
    const before = { ...seedManor(), hirelings: [] }
    const after = advanceWeek(before)
    expect(after.log).toHaveLength(0)
    // Facility content is unchanged (only state we touched is week)
    expect(after.facilities).toEqual(before.facilities)
  })

  it('deducts weekly costs from treasury and logs an entry', () => {
    const before = {
      ...seedManor(),
      treasury: 100,
      weeklyCosts: { partyLifestyle: 20, defenderUpkeep: 0, miscellaneous: 5 },
    }
    const after = advanceWeek(before)
    // Hireling salaries (10) + lifestyle 20 + misc 5 = 35.
    expect(after.treasury).toBe(65)
    const costLog = after.log.find((e) =>
      typeof e.outcome === 'string' && e.outcome.includes('Weekly costs −35'),
    )
    expect(costLog).toBeDefined()
  })

  it('allows treasury to go negative (warn-and-allow)', () => {
    const before = {
      ...seedManor(),
      treasury: 5,
      weeklyCosts: { partyLifestyle: 20, defenderUpkeep: 0, miscellaneous: 0 },
    }
    const after = advanceWeek(before)
    expect(after.treasury).toBe(-25) // 5 - (10 hirelings + 20 party)
    const costLog = after.log.find((e) =>
      typeof e.outcome === 'string' && e.outcome.includes('in arrears'),
    )
    expect(costLog).toBeDefined()
  })

  it('resolves a pending order, clears it, and logs the outcome', () => {
    const seed = seedManor()
    const before = withFacility(seed, 'library', { pendingOrder: 'Research' })

    const after = advanceWeek(before)
    const library = after.facilities.find((f) => f.id === 'library')

    expect(library?.pendingOrder).toBeUndefined()
    const orderLogs = after.log.filter((e) => e.type === 'bastion-order')
    expect(orderLogs).toHaveLength(1)
    expect(orderLogs[0].actor).toBe('library')
    expect(orderLogs[0].week).toBe(after.inGameWeek)
    expect(orderLogs[0].outcome).toMatch(/Library.*Research/i)
    expect(orderLogs[0].payload).toMatchObject({ order: 'Research', hirelingId: 'librarian' })
  })

  it('logs one entry per pending order across multiple facilities', () => {
    let b = seedManor()
    b = withFacility(b, 'library', { pendingOrder: 'Research' })
    b = withFacility(b, 'poison-garden', { pendingOrder: 'Harvest' })

    const after = advanceWeek(b)
    const orderLogs = after.log.filter((e) => e.type === 'bastion-order')
    expect(orderLogs).toHaveLength(2)
    expect(orderLogs.map((e) => e.actor).sort()).toEqual(['library', 'poison-garden'])
  })

  it('decrements daysRemaining by 7 for under-construction facilities', () => {
    const seed = { ...seedManor(), hirelings: [] }
    const before = withFacility(seed, 'kitchen', {
      state: 'under-construction',
      daysRemaining: 21,
    })

    const after = advanceWeek(before)
    const kitchen = after.facilities.find((f) => f.id === 'kitchen')
    expect(kitchen?.state).toBe('under-construction')
    expect(kitchen?.daysRemaining).toBe(14)
    expect(after.log).toHaveLength(0)
  })

  it('completes construction when daysRemaining reaches 0 (exactly 7d left)', () => {
    const seed = seedManor()
    const before = withFacility(seed, 'kitchen', {
      state: 'under-construction',
      daysRemaining: 7,
    })

    const after = advanceWeek(before)
    const kitchen = after.facilities.find((f) => f.id === 'kitchen')
    expect(kitchen?.state).toBe('active')
    expect(kitchen?.daysRemaining).toBeUndefined()

    const constructionLogs = after.log.filter((e) => e.type === 'construction')
    expect(constructionLogs).toHaveLength(1)
    expect(constructionLogs[0].actor).toBe('kitchen')
    expect(constructionLogs[0].outcome).toMatch(/Kitchen.*complete/i)
  })

  it('completes construction when fewer than 7 days remain', () => {
    const seed = seedManor()
    const before = withFacility(seed, 'kitchen', {
      state: 'under-construction',
      daysRemaining: 3,
    })

    const after = advanceWeek(before)
    const kitchen = after.facilities.find((f) => f.id === 'kitchen')
    expect(kitchen?.state).toBe('active')
    expect(kitchen?.daysRemaining).toBeUndefined()
  })

  it('appends new entries to the existing log', () => {
    const seed = seedManor()
    const seeded: Bastion = {
      ...seed,
      log: [
        {
          id: 'pre-existing',
          week: 1,
          type: 'system',
          outcome: 'preserved',
        },
      ],
    }
    // Drop hirelings so we don't get the weekly-cost log entry on top.
    const before = withFacility({ ...seeded, hirelings: [] }, 'library', {
      pendingOrder: 'Research',
    })

    const after = advanceWeek(before)
    expect(after.log[0].id).toBe('pre-existing')
    expect(after.log).toHaveLength(2)
  })

  it('composes across multiple weeks', () => {
    let b = seedManor()
    b = withFacility(b, 'kitchen', {
      state: 'under-construction',
      daysRemaining: 14,
    })

    b = advanceWeek(b)
    expect(b.facilities.find((f) => f.id === 'kitchen')?.daysRemaining).toBe(7)
    expect(b.facilities.find((f) => f.id === 'kitchen')?.state).toBe('under-construction')

    b = advanceWeek(b)
    const kitchen = b.facilities.find((f) => f.id === 'kitchen')
    expect(kitchen?.state).toBe('active')
    expect(kitchen?.daysRemaining).toBeUndefined()
    expect(b.inGameWeek).toBe(seedManor().inGameWeek + 2)
  })

  it('rolls a Bastion event when a facility issues Maintain', () => {
    const seed = seedManor()
    const before = withFacility(seed, 'library', { pendingOrder: 'Maintain' })

    const after = advanceWeek(before, rngFor(53)) // 51-55 = Attack
    const events = after.log.filter((e) => e.type === 'bastion-event')
    expect(events).toHaveLength(1)
    expect(events[0].actor).toBe('library')
    expect(events[0].outcome).toMatch(/53.*Attack/)
    expect(events[0].payload).toMatchObject({ roll: 53, event: 'Attack' })
  })

  it('does not roll a Bastion event when no Maintain order is pending', () => {
    const seed = seedManor()
    const before = withFacility(seed, 'library', { pendingOrder: 'Research' })

    const after = advanceWeek(before, rngFor(53))
    expect(after.log.filter((e) => e.type === 'bastion-event')).toHaveLength(0)
  })

  it('rolls once per Maintain order across multiple facilities', () => {
    let b = seedManor()
    b = withFacility(b, 'library', { pendingOrder: 'Maintain' })
    b = withFacility(b, 'poison-garden', { pendingOrder: 'Maintain' })

    const after = advanceWeek(b, rngFor(1, 99)) // All Is Well, Treasure
    const events = after.log.filter((e) => e.type === 'bastion-event')
    expect(events).toHaveLength(2)
    expect(events.map((e) => e.payload?.event).sort()).toEqual([
      'All Is Well',
      'Treasure',
    ])
  })

  it('does not roll an event for a Maintain pending on a non-active facility', () => {
    const seed = seedManor()
    const before = withFacility(seed, 'library', {
      state: 'damaged',
      pendingOrder: 'Maintain',
    })

    const after = advanceWeek(before, rngFor(53))
    expect(after.log.filter((e) => e.type === 'bastion-event')).toHaveLength(0)
  })

  it('does not resolve a pending order on a non-active facility', () => {
    // setOrder won't allow this state today, but the reducer must be defensive.
    const seed = seedManor()
    const before = withFacility(seed, 'library', {
      state: 'damaged',
      pendingOrder: 'Research',
    })

    const after = advanceWeek(before)
    const library = after.facilities.find((f) => f.id === 'library')
    expect(library?.pendingOrder).toBe('Research')
    expect(after.log.filter((e) => e.type === 'bastion-order')).toHaveLength(0)
  })
})
