import { describe, it, expect } from 'vitest'
import { seedManor } from '../../data/seed'
import { recordActivity } from './activities'

const stubRng = (val: number) => () => (val - 1) / 100 + 1e-9

describe('recordActivity', () => {
  it('rejects unknown activity ids', () => {
    const before = seedManor()
    const result = recordActivity(before, {
      activityId: 'not-real',
      roller: 'Mira',
      outcome: '',
    })
    expect(result.ok).toBe(false)
    expect(result.bastion).toBe(before)
  })

  it('logs without complication when not requested', () => {
    const before = seedManor()
    const result = recordActivity(before, {
      activityId: 'carousing',
      roller: 'Astrid',
      outcome: 'Made two allied contacts at the upper-class banquet.',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.complication).toBeNull()
    const last = result.bastion.log[result.bastion.log.length - 1]
    expect(last.type).toBe('xanathar-activity')
    expect(last.actor).toBe('carousing')
    expect(last.outcome).toMatch(/Carousing.*Astrid.*allied contacts/)
    expect(last.payload).toMatchObject({ activityId: 'carousing', roller: 'Astrid' })
  })

  it('rolls the complication die when requested and emits it in the log', () => {
    const before = seedManor()
    // d6 carousing — stub rng so floor(rng()*8)+1 = 4
    const rng = () => (4 - 1) / 8 + 1e-9
    const result = recordActivity(
      before,
      { activityId: 'carousing', roller: 'Mira', outcome: '', rollComplication: true },
      rng,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.complication).not.toBeNull()
    expect(result.complication?.roll).toBe(4)
    expect(result.complication?.text).toMatch(/foe of a guild/i)

    const last = result.bastion.log[result.bastion.log.length - 1]
    expect(last.outcome).toMatch(/Complication d8=4/)
  })

  it('falls back to "unattributed" when roller is empty', () => {
    const result = recordActivity(seedManor(), {
      activityId: 'work',
      roller: '   ',
      outcome: 'Honest pay for honest work.',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.bastion.log[result.bastion.log.length - 1].outcome).toMatch(/unattributed/)
  })

  it('does not mutate the input bastion on success', () => {
    const before = seedManor()
    recordActivity(before, {
      activityId: 'work',
      roller: 'Mira',
      outcome: 'Worked the docks.',
    })
    // log array stays empty on the original
    expect(before.log).toHaveLength(0)
  })

  // Ensure unused stub helper at least imports correctly without blowing up
  it('stubRng helper produces deterministic rolls', () => {
    const rng = stubRng(50)
    expect(Math.floor(rng() * 100) + 1).toBe(50)
  })
})
