import { describe, it, expect } from 'vitest'
import { XANATHAR_ACTIVITIES, lookupActivity } from './xanathar-activities'

describe('XANATHAR_ACTIVITIES', () => {
  it('contains the 14 canonical XGtE activities', () => {
    expect(XANATHAR_ACTIVITIES).toHaveLength(14)
  })

  it('every entry has a unique id', () => {
    const ids = XANATHAR_ACTIVITIES.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(XANATHAR_ACTIVITIES.map((a) => [a.id, a]))(
    '%s complications table covers 1..die exhaustively',
    (_id, activity) => {
      const seen = new Set(activity.complications.map((c) => c.roll))
      for (let r = 1; r <= activity.complicationDie; r++) {
        expect(seen.has(r), `roll ${r} missing for ${activity.id}`).toBe(true)
      }
      expect(activity.complications).toHaveLength(activity.complicationDie)
    },
  )
})

describe('lookupActivity', () => {
  it('returns the matching activity', () => {
    expect(lookupActivity('carousing')?.name).toBe('Carousing')
  })
  it('returns undefined for unknown ids', () => {
    expect(lookupActivity('not-a-thing')).toBeUndefined()
  })
})
