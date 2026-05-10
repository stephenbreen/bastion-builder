import { describe, it, expect } from 'vitest'
import { seedManor } from '../../data/seed'
import { addPc, removePc, updatePc } from './pcs'

const baseInput = (overrides: Partial<Parameters<typeof addPc>[1]> = {}) => ({
  name: 'Mira',
  class: 'Bard',
  level: 5,
  ...overrides,
})

describe('addPc', () => {
  it('appends a new PC with a generated id', () => {
    const result = addPc(seedManor(), baseInput())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.bastion.pcs).toHaveLength(1)
    expect(result.pc.id.startsWith('pc-')).toBe(true)
    expect(result.pc.name).toBe('Mira')
    expect(result.pc.level).toBe(5)
  })

  it('rejects empty names', () => {
    const result = addPc(seedManor(), baseInput({ name: '   ' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/required/i)
  })

  it('clamps level to 1..20', () => {
    const tooLow = addPc(seedManor(), baseInput({ level: 0 }))
    if (!tooLow.ok) throw new Error('expected success')
    expect(tooLow.pc.level).toBe(1)

    const tooHigh = addPc(seedManor(), baseInput({ level: 99 }))
    if (!tooHigh.ok) throw new Error('expected success')
    expect(tooHigh.pc.level).toBe(20)
  })

  it('keeps ability scores when provided', () => {
    const result = addPc(
      seedManor(),
      baseInput({ abilityScores: { STR: 10, CHA: 18 } }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.pc.abilityScores).toEqual({ STR: 10, CHA: 18 })
  })

  it('strips empty optional fields', () => {
    const result = addPc(seedManor(), baseInput({ player: '   ', notes: '' }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.pc.player).toBeUndefined()
    expect(result.pc.notes).toBeUndefined()
  })
})

describe('updatePc', () => {
  it('rejects unknown ids', () => {
    const result = updatePc(seedManor(), 'nope', { name: 'X' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/unknown/i)
  })

  it('preserves the id and merges patches', () => {
    const added = addPc(seedManor(), baseInput())
    if (!added.ok) throw new Error('add failed')
    const id = added.pc.id

    const updated = updatePc(added.bastion, id, { level: 7 })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.pc.id).toBe(id)
    expect(updated.pc.level).toBe(7)
    expect(updated.pc.name).toBe('Mira') // unchanged
  })

  it('rejects clearing the name', () => {
    const added = addPc(seedManor(), baseInput())
    if (!added.ok) throw new Error('add failed')
    const result = updatePc(added.bastion, added.pc.id, { name: '   ' })
    expect(result.ok).toBe(false)
  })
})

describe('removePc', () => {
  it('removes a PC', () => {
    const added = addPc(seedManor(), baseInput())
    if (!added.ok) throw new Error('add failed')
    const after = removePc(added.bastion, added.pc.id)
    expect(after.pcs).toBeUndefined()
  })

  it('is a no-op for unknown ids', () => {
    const before = seedManor()
    expect(removePc(before, 'nope')).toBe(before)
  })

  it('keeps the array when only some are removed', () => {
    const a = addPc(seedManor(), baseInput({ name: 'Alice' }))
    if (!a.ok) throw new Error('add failed')
    const b = addPc(a.bastion, baseInput({ name: 'Bob' }))
    if (!b.ok) throw new Error('add failed')
    const after = removePc(b.bastion, a.pc.id)
    expect(after.pcs).toHaveLength(1)
    expect(after.pcs?.[0].name).toBe('Bob')
  })
})
