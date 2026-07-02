import { describe, it, expect } from 'vitest'
import { seedManor } from '../../data/seed'
import { DEFAULT_FLOORS } from '../../types'
import { getFloorLabel, getFloorOrder, getFloors } from '../../lib/floors'
import {
  addFloor,
  moveFloor,
  removeFloor,
  resetFloors,
  setFloorLabel,
} from './floors'

describe('setFloorLabel', () => {
  it('sets a custom label and materialises the floors array', () => {
    const after = setFloorLabel(seedManor(), 'cellar', 'Crypt')
    expect(after.floors).toBeDefined()
    expect(getFloorLabel(after, 'cellar')).toBe('Crypt')
  })

  it('trims input', () => {
    const after = setFloorLabel(seedManor(), 'tower', '  Spire  ')
    expect(getFloorLabel(after, 'tower')).toBe('Spire')
  })

  it('clears the label override when given an empty string (default floor)', () => {
    const named = setFloorLabel(seedManor(), 'cellar', 'Crypt')
    const cleared = setFloorLabel(named, 'cellar', '   ')
    // Label reverts to the default — and since nothing else changed, the
    // canonical-detection drops the floors array back to undefined.
    expect(cleared.floors).toBeUndefined()
    expect(getFloorLabel(cleared, 'cellar')).toBe('Cellar')
  })

  it('returns the same bastion when nothing changed', () => {
    const before = seedManor()
    expect(setFloorLabel(before, 'tower', 'Tower')).toBe(before)
  })
})

describe('moveFloor', () => {
  it('swaps a floor with the one above it', () => {
    const after = moveFloor(seedManor(), 'first', 'up')
    expect(getFloorOrder(after)).toEqual(['tower', 'first', 'second', 'ground', 'cellar'])
  })

  it('swaps a floor with the one below it', () => {
    const after = moveFloor(seedManor(), 'first', 'down')
    expect(getFloorOrder(after)).toEqual(['tower', 'second', 'ground', 'first', 'cellar'])
  })

  it('is a no-op at the boundary', () => {
    const before = seedManor()
    expect(moveFloor(before, 'tower', 'up')).toBe(before)
    expect(moveFloor(before, 'cellar', 'down')).toBe(before)
  })

  it('clears overrides when the move restores canonical order', () => {
    const moved = moveFloor(seedManor(), 'first', 'up')
    expect(moved.floors).toBeDefined()
    const restored = moveFloor(moved, 'first', 'down')
    expect(restored.floors).toBeUndefined()
    expect(getFloors(restored)).toBe(DEFAULT_FLOORS)
  })
})

describe('addFloor', () => {
  it('appends a new floor with a generated id', () => {
    const result = addFloor(seedManor())
    expect(result.bastion.floors).toBeDefined()
    expect(result.bastion.floors).toHaveLength(DEFAULT_FLOORS.length + 1)
    const added = result.bastion.floors!.find((f) => f.id === result.id)
    expect(added).toBeDefined()
    expect(added!.label).toMatch(/^Floor \d+$/)
  })

  it('honours a custom label when provided', () => {
    const result = addFloor(seedManor(), '  Mezzanine  ')
    const added = result.bastion.floors!.find((f) => f.id === result.id)
    expect(added!.label).toBe('Mezzanine')
  })

  it('produces unique ids when called multiple times', () => {
    const a = addFloor(seedManor())
    const b = addFloor(a.bastion)
    expect(a.id).not.toBe(b.id)
    expect(b.bastion.floors).toHaveLength(DEFAULT_FLOORS.length + 2)
  })
})

describe('removeFloor', () => {
  it('removes a vacant floor', () => {
    // Tower is empty in the seed.
    const result = removeFloor(seedManor(), 'tower')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(getFloorOrder(result.bastion)).not.toContain('tower')
  })

  it('refuses to remove an occupied floor', () => {
    // Ground has 3 rooms in the seed.
    const result = removeFloor(seedManor(), 'ground')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toMatch(/3 rooms?/)
  })

  it('refuses to remove an unknown floor', () => {
    const result = removeFloor(seedManor(), 'nope')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toMatch(/unknown/i)
  })

  it('refuses to remove the last remaining floor', () => {
    // Build a bastion with only one (vacant) floor.
    const seed = seedManor()
    const single = {
      ...seed,
      facilities: [],
      floors: [{ id: 'only', label: 'The Only Floor' }],
    }
    const result = removeFloor(single, 'only')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toMatch(/at least one/i)
  })
})

describe('resetFloors', () => {
  it('drops the override array', () => {
    const after = setFloorLabel(seedManor(), 'cellar', 'Crypt')
    expect(after.floors).toBeDefined()
    const reset = resetFloors(after)
    expect(reset.floors).toBeUndefined()
  })

  it('is a no-op when nothing was overridden', () => {
    const before = seedManor()
    expect(resetFloors(before)).toBe(before)
  })
})

describe('getFloors', () => {
  it('falls back to DEFAULT_FLOORS when the bastion has no overrides', () => {
    const before = seedManor()
    expect(getFloors(before)).toBe(DEFAULT_FLOORS)
  })
})
