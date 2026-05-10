import { describe, it, expect } from 'vitest'
import { BASTION_EVENT_TABLE, lookupEvent } from './event-table'

describe('BASTION_EVENT_TABLE', () => {
  it('covers every roll from 1 to 100 exactly once', () => {
    for (let r = 1; r <= 100; r++) {
      const matches = BASTION_EVENT_TABLE.filter(
        (e) => r >= e.range[0] && r <= e.range[1],
      )
      expect(matches, `roll ${r}`).toHaveLength(1)
    }
  })

  it('ranges are non-decreasing and contiguous', () => {
    let prevHigh = 0
    for (const event of BASTION_EVENT_TABLE) {
      expect(event.range[0]).toBe(prevHigh + 1)
      expect(event.range[1]).toBeGreaterThanOrEqual(event.range[0])
      prevHigh = event.range[1]
    }
    expect(prevHigh).toBe(100)
  })
})

describe('lookupEvent', () => {
  it.each([
    [1, 'All Is Well'],
    [50, 'All Is Well'],
    [51, 'Attack'],
    [55, 'Attack'],
    [56, 'Criminal Hireling'],
    [58, 'Criminal Hireling'],
    [59, 'Extraordinary Opportunity'],
    [63, 'Extraordinary Opportunity'],
    [64, 'Friendly Visitors'],
    [72, 'Friendly Visitors'],
    [73, 'Guest'],
    [76, 'Guest'],
    [77, 'Lost Hirelings'],
    [79, 'Lost Hirelings'],
    [80, 'Magical Discovery'],
    [83, 'Magical Discovery'],
    [84, 'Refugees'],
    [91, 'Refugees'],
    [92, 'Request for Aid'],
    [98, 'Request for Aid'],
    [99, 'Treasure'],
    [100, 'Treasure'],
  ])('roll %i maps to %s', (roll, name) => {
    expect(lookupEvent(roll).name).toBe(name)
  })

  it('throws on out-of-range rolls', () => {
    expect(() => lookupEvent(0)).toThrow()
    expect(() => lookupEvent(101)).toThrow()
  })
})
