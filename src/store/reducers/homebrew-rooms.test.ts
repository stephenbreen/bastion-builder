import { describe, it, expect } from 'vitest'
import { seedManor } from '../../data/seed'
import {
  addCustomCatalogueEntry,
  removeCustomCatalogueEntry,
  updateCustomCatalogueEntry,
  type HomebrewDraft,
} from './homebrew-rooms'

const baseDraft = (overrides: Partial<HomebrewDraft> = {}): HomebrewDraft => ({
  name: 'Smithy of the Old Hill',
  class: 'special',
  category: 'production',
  sizes: ['roomy', 'vast'],
  orders: ['Craft', 'Maintain'],
  domainSkillBoosts: [{ skill: 'operations', amount: 1 }],
  hirelingLabel: 'Master Smith',
  ...overrides,
})

describe('addCustomCatalogueEntry', () => {
  it('appends a new homebrew entry tagged homebrew=true', () => {
    const result = addCustomCatalogueEntry(seedManor(), baseDraft())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.entry.homebrew).toBe(true)
    expect(result.entry.id.startsWith('hb-')).toBe(true)
    expect(result.bastion.customCatalogueEntries).toHaveLength(1)
  })

  it('rejects empty names', () => {
    const result = addCustomCatalogueEntry(seedManor(), baseDraft({ name: '   ' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/name/i)
  })

  it('rejects when no sizes are picked', () => {
    const result = addCustomCatalogueEntry(seedManor(), baseDraft({ sizes: [] }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/size/i)
  })

  it('strips orders/boosts/hireling for basic-class entries', () => {
    const result = addCustomCatalogueEntry(
      seedManor(),
      baseDraft({ class: 'basic' }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.entry.orders).toBeUndefined()
    expect(result.entry.domainSkillBoosts).toBeUndefined()
    expect(result.entry.hirelingLabel).toBeUndefined()
  })

  it('keeps cost overrides only for selected sizes', () => {
    const result = addCustomCatalogueEntry(
      seedManor(),
      baseDraft({
        sizes: ['roomy'],
        // cramped is not selected — should be dropped
        costOverride: {
          cramped: { cost: 250, days: 10 },
          roomy: { cost: 1500, days: 60 },
        },
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.entry.costOverride).toEqual({ roomy: { cost: 1500, days: 60 } })
  })

  it('drops zero-amount boosts', () => {
    const result = addCustomCatalogueEntry(
      seedManor(),
      baseDraft({
        domainSkillBoosts: [
          { skill: 'operations', amount: 1 },
          { skill: 'lore', amount: 0 },
        ],
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.entry.domainSkillBoosts).toEqual([{ skill: 'operations', amount: 1 }])
  })
})

describe('updateCustomCatalogueEntry', () => {
  it('rejects unknown ids', () => {
    const result = updateCustomCatalogueEntry(seedManor(), 'nope', { name: 'X' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/unknown/i)
  })

  it('preserves the id and merges patches', () => {
    const added = addCustomCatalogueEntry(seedManor(), baseDraft())
    if (!added.ok) throw new Error('expected add to succeed')
    const id = added.entry.id

    const updated = updateCustomCatalogueEntry(added.bastion, id, {
      name: 'Renamed Smithy',
    })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.entry.id).toBe(id) // id preserved
    expect(updated.entry.name).toBe('Renamed Smithy')
    expect(updated.entry.class).toBe('special') // unchanged
    expect(updated.entry.orders).toEqual(['Craft', 'Maintain']) // unchanged
  })

  it('demoting to basic strips special-only fields', () => {
    const added = addCustomCatalogueEntry(seedManor(), baseDraft())
    if (!added.ok) throw new Error('expected add to succeed')
    const id = added.entry.id

    const updated = updateCustomCatalogueEntry(added.bastion, id, { class: 'basic' })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.entry.class).toBe('basic')
    expect(updated.entry.orders).toBeUndefined()
    expect(updated.entry.domainSkillBoosts).toBeUndefined()
    expect(updated.entry.hirelingLabel).toBeUndefined()
  })
})

describe('removeCustomCatalogueEntry', () => {
  it('removes the matching entry', () => {
    const added = addCustomCatalogueEntry(seedManor(), baseDraft())
    if (!added.ok) throw new Error('expected add to succeed')
    const id = added.entry.id

    const after = removeCustomCatalogueEntry(added.bastion, id)
    expect(after.customCatalogueEntries).toBeUndefined()
  })

  it('is a no-op for unknown ids', () => {
    const before = seedManor()
    expect(removeCustomCatalogueEntry(before, 'nope')).toBe(before)
  })

  it('keeps the array when only some entries are removed', () => {
    const seed = seedManor()
    const a = addCustomCatalogueEntry(seed, baseDraft({ name: 'A' }))
    if (!a.ok) throw new Error('expected add to succeed')
    const b = addCustomCatalogueEntry(a.bastion, baseDraft({ name: 'B' }))
    if (!b.ok) throw new Error('expected add to succeed')

    const after = removeCustomCatalogueEntry(b.bastion, a.entry.id)
    expect(after.customCatalogueEntries).toHaveLength(1)
    expect(after.customCatalogueEntries?.[0].name).toBe('B')
  })
})
