import { describe, it, expect } from 'vitest'
import { rollD100, seededRng } from './dice'

describe('rollD100', () => {
  it('returns 1 when rng() is 0', () => {
    expect(rollD100(() => 0)).toBe(1)
  })
  it('returns 51 when rng() is 0.5', () => {
    expect(rollD100(() => 0.5)).toBe(51)
  })
  it('returns 100 when rng() is just under 1', () => {
    expect(rollD100(() => 0.999999)).toBe(100)
  })
  it('always falls in [1, 100]', () => {
    const rng = seededRng(42)
    for (let i = 0; i < 1000; i++) {
      const r = rollD100(rng)
      expect(r).toBeGreaterThanOrEqual(1)
      expect(r).toBeLessThanOrEqual(100)
    }
  })
})

describe('seededRng', () => {
  it('produces a deterministic sequence for a given seed', () => {
    const a = seededRng(123)
    const b = seededRng(123)
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b())
    }
  })
  it('different seeds produce different first values', () => {
    expect(seededRng(1)()).not.toBe(seededRng(2)())
  })
})
