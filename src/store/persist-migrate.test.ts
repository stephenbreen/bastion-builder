import { describe, expect, it } from 'vitest'
import { migratePersistedState } from './persist-migrate'
import { seedManor } from '../data/seed'

describe('migratePersistedState', () => {
  it('returns null for non-object inputs', () => {
    expect(migratePersistedState(null, 10)).toBeNull()
    expect(migratePersistedState(undefined, 10)).toBeNull()
    expect(migratePersistedState('string', 10)).toBeNull()
    expect(migratePersistedState(42, 10)).toBeNull()
  })

  it('returns null when the v10-shaped payload has no bastions', () => {
    const result = migratePersistedState({ theme: 'heraldic' }, 10)
    expect(result).toBeNull()
  })

  describe('v8 -> v9', () => {
    it('promotes a single bastion into the multi-bastion record', () => {
      const bastion = seedManor()
      const result = migratePersistedState(
        { bastion, theme: 'parchment' },
        8,
      )
      expect(result).not.toBeNull()
      expect(Object.values(result!.bastions)).toHaveLength(1)
      expect(Object.values(result!.bastions)[0]).toBe(bastion)
      // `activeBastionId` is the new bastion's id.
      expect(result!.activeBastionId).toBeTruthy()
      expect(result!.bastions[result!.activeBastionId]).toBe(bastion)
      expect(result!.theme).toBe('parchment')
    })

    it('falls back to seedManor when no bastion is present', () => {
      const result = migratePersistedState({}, 8)
      expect(result).not.toBeNull()
      const ids = Object.keys(result!.bastions)
      expect(ids).toHaveLength(1)
      expect(result!.bastions[ids[0]].name).toBe(seedManor().name)
      expect(result!.theme).toBe('heraldic') // default theme
    })

    it('also runs the v9 -> v10 floor migration when starting from v8', () => {
      const bastion = {
        ...seedManor(),
        customFloorLabels: { ground: 'Basement' },
        floorOrder: ['tower', 'ground'],
      }
      const result = migratePersistedState({ bastion }, 8)
      expect(result).not.toBeNull()
      const migrated = Object.values(result!.bastions)[0]
      expect(migrated.floors).toEqual([
        { id: 'tower', label: 'Tower' },
        { id: 'ground', label: 'Basement' },
      ])
      // Legacy fields should be stripped.
      expect((migrated as Record<string, unknown>).customFloorLabels).toBeUndefined()
      expect((migrated as Record<string, unknown>).floorOrder).toBeUndefined()
    })
  })

  describe('v9 -> v10', () => {
    it('collapses customFloorLabels + floorOrder into a floors array', () => {
      const bid = 'b1'
      const bastion = {
        ...seedManor(),
        customFloorLabels: { ground: 'Garden Level', tower: 'Spire' },
        floorOrder: ['tower', 'ground', 'cellar'],
      }
      const result = migratePersistedState(
        {
          bastions: { [bid]: bastion },
          activeBastionId: bid,
          theme: 'violet',
        },
        9,
      )
      expect(result).not.toBeNull()
      expect(result!.activeBastionId).toBe(bid)
      expect(result!.theme).toBe('violet')
      const migrated = result!.bastions[bid]
      expect(migrated.floors).toEqual([
        { id: 'tower', label: 'Spire' },
        { id: 'ground', label: 'Garden Level' },
        { id: 'cellar', label: 'Cellar' },
      ])
      expect((migrated as Record<string, unknown>).customFloorLabels).toBeUndefined()
      expect((migrated as Record<string, unknown>).floorOrder).toBeUndefined()
    })

    it('uses the default floor order when only customFloorLabels is set', () => {
      const bid = 'b2'
      const bastion = {
        ...seedManor(),
        customFloorLabels: { first: 'Mezzanine' },
      }
      const result = migratePersistedState(
        { bastions: { [bid]: bastion }, activeBastionId: bid },
        9,
      )
      const migrated = result!.bastions[bid]
      expect(migrated.floors?.map((f) => f.id)).toEqual([
        'tower',
        'second',
        'first',
        'ground',
        'cellar',
      ])
      const first = migrated.floors?.find((f) => f.id === 'first')
      expect(first?.label).toBe('Mezzanine')
    })

    it('leaves bastions without overrides untouched', () => {
      const bid = 'b3'
      const bastion = seedManor()
      const result = migratePersistedState(
        { bastions: { [bid]: bastion }, activeBastionId: bid },
        9,
      )
      // No floors array was set (no overrides => no floors injection).
      expect(result!.bastions[bid].floors).toBeUndefined()
    })
  })

  it('passes through a v10 payload unchanged', () => {
    const bid = 'kept'
    const bastion = seedManor()
    const result = migratePersistedState(
      {
        bastions: { [bid]: bastion },
        activeBastionId: bid,
        theme: 'heraldic',
      },
      10,
    )
    expect(result).not.toBeNull()
    expect(result!.activeBastionId).toBe(bid)
    expect(result!.bastions[bid]).toBe(bastion)
    expect(result!.theme).toBe('heraldic')
  })
})
