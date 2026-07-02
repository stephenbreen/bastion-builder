import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getActiveBastion, useBastionStore } from './useBastionStore'

const initial = useBastionStore.getState()

beforeEach(() => {
  localStorage.clear()
  useBastionStore.setState(initial, true)
  useBastionStore.getState().reset()
})

afterEach(() => {
  localStorage.clear()
})

function active() {
  return getActiveBastion(useBastionStore.getState())
}

function getFacility(id: string) {
  return active().facilities.find((f) => f.id === id)
}

describe('useBastionStore selection', () => {
  it('starts with no facility selected', () => {
    expect(useBastionStore.getState().selectedFacilityId).toBeNull()
  })

  it('selectFacility records a known facility id', () => {
    useBastionStore.getState().selectFacility('library')
    expect(useBastionStore.getState().selectedFacilityId).toBe('library')
  })

  it('selectFacility ignores unknown ids', () => {
    useBastionStore.getState().selectFacility('not-a-real-facility')
    expect(useBastionStore.getState().selectedFacilityId).toBeNull()
  })

  it('selectFacility replaces an existing selection', () => {
    const { selectFacility } = useBastionStore.getState()
    selectFacility('library')
    selectFacility('poison-garden')
    expect(useBastionStore.getState().selectedFacilityId).toBe('poison-garden')
  })

  it('clearSelection nulls out the selection', () => {
    useBastionStore.getState().selectFacility('library')
    useBastionStore.getState().clearSelection()
    expect(useBastionStore.getState().selectedFacilityId).toBeNull()
  })

  it('reset clears any active selection', () => {
    useBastionStore.getState().selectFacility('library')
    useBastionStore.getState().reset()
    expect(useBastionStore.getState().selectedFacilityId).toBeNull()
  })
})

describe('useBastionStore setOrder', () => {
  it('sets a valid pending order on a special facility', () => {
    useBastionStore.getState().setOrder('library', 'Research')
    expect(getFacility('library')?.pendingOrder).toBe('Research')
  })

  it('clears the pending order when passed null', () => {
    useBastionStore.getState().setOrder('library', 'Research')
    useBastionStore.getState().setOrder('library', null)
    expect(getFacility('library')?.pendingOrder).toBeUndefined()
  })

  it('replaces an existing pending order', () => {
    useBastionStore.getState().setOrder('poison-garden', 'Harvest')
    useBastionStore.getState().setOrder('poison-garden', 'Craft')
    expect(getFacility('poison-garden')?.pendingOrder).toBe('Craft')
  })

  it('ignores unknown facility ids', () => {
    useBastionStore.getState().setOrder('no-such-thing', 'Research')
    expect(active().facilities.every((f) => f.pendingOrder === undefined)).toBe(true)
  })

  it('ignores orders that are not in facility.orders', () => {
    useBastionStore.getState().setOrder('library', 'Trade')
    expect(getFacility('library')?.pendingOrder).toBeUndefined()
  })

  it('ignores facilities with no orders (basic facilities)', () => {
    useBastionStore.getState().setOrder('kitchen', 'Maintain')
    expect(getFacility('kitchen')?.pendingOrder).toBeUndefined()
  })

  it('ignores facilities that are not active', () => {
    useBastionStore.setState((s) => {
      const b = s.bastions[s.activeBastionId]
      return {
        bastions: {
          ...s.bastions,
          [s.activeBastionId]: {
            ...b,
            facilities: b.facilities.map((f) =>
              f.id === 'library' ? { ...f, state: 'damaged' as const } : f,
            ),
          },
        },
      }
    })
    useBastionStore.getState().setOrder('library', 'Research')
    expect(getFacility('library')?.pendingOrder).toBeUndefined()
  })

  it('reset clears any pending orders', () => {
    useBastionStore.getState().setOrder('library', 'Research')
    useBastionStore.getState().setOrder('poison-garden', 'Harvest')
    useBastionStore.getState().reset()
    expect(active().facilities.every((f) => f.pendingOrder === undefined)).toBe(true)
  })
})

describe('multi-bastion CRUD', () => {
  it('starts with exactly one bastion', () => {
    const s = useBastionStore.getState()
    expect(Object.keys(s.bastions)).toHaveLength(1)
    expect(s.bastions[s.activeBastionId]).toBeDefined()
  })

  it('createBastion adds and switches', () => {
    const before = useBastionStore.getState()
    const id = before.createBastion('Hammerhall')
    const after = useBastionStore.getState()
    expect(Object.keys(after.bastions)).toHaveLength(2)
    expect(after.activeBastionId).toBe(id)
    expect(after.bastions[id].name).toBe('Hammerhall')
  })

  it('switchBastion changes active and clears selection + history', () => {
    const original = useBastionStore.getState().activeBastionId
    useBastionStore.getState().createBastion('A') // creates + switches to A
    useBastionStore.getState().selectFacility('library')
    useBastionStore.getState().switchBastion(original)
    expect(useBastionStore.getState().activeBastionId).toBe(original)
    expect(useBastionStore.getState().selectedFacilityId).toBeNull()
    expect(useBastionStore.getState().weekHistory).toEqual([])
  })

  it('renameBastion sets the name', () => {
    const id = useBastionStore.getState().activeBastionId
    useBastionStore.getState().renameBastion(id, 'New Name')
    expect(active().name).toBe('New Name')
  })

  it('renameBastion ignores empty names', () => {
    const id = useBastionStore.getState().activeBastionId
    const before = active().name
    useBastionStore.getState().renameBastion(id, '   ')
    expect(active().name).toBe(before)
  })

  it('duplicateBastion deep-clones, names with " (copy)", switches', () => {
    const id = useBastionStore.getState().activeBastionId
    const dupId = useBastionStore.getState().duplicateBastion(id)
    expect(dupId).not.toBe(id)
    const after = useBastionStore.getState()
    expect(after.activeBastionId).toBe(dupId)
    expect(after.bastions[dupId].name).toMatch(/\(copy\)/)
    // Mutating the copy doesn't touch the original.
    useBastionStore.getState().setTreasury(9999)
    expect(after.bastions[id].treasury).not.toBe(9999)
  })

  it('deleteBastion refuses to delete the last bastion', () => {
    const id = useBastionStore.getState().activeBastionId
    const result = useBastionStore.getState().deleteBastion(id)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/last bastion/i)
    expect(Object.keys(useBastionStore.getState().bastions)).toHaveLength(1)
  })

  it('deleteBastion drops the bastion and switches to another', () => {
    const id1 = useBastionStore.getState().activeBastionId
    const id2 = useBastionStore.getState().createBastion('Second')
    const result = useBastionStore.getState().deleteBastion(id2)
    expect(result.ok).toBe(true)
    expect(Object.keys(useBastionStore.getState().bastions)).toEqual([id1])
    expect(useBastionStore.getState().activeBastionId).toBe(id1)
  })

  it('importBastion adds a new bastion and switches to it', () => {
    const before = useBastionStore.getState()
    const json = JSON.stringify({
      version: 10,
      exportedAt: new Date().toISOString(),
      bastion: { ...active(), name: 'Imported' },
    })
    const result = useBastionStore.getState().importBastion(json)
    expect(result.ok).toBe(true)
    const after = useBastionStore.getState()
    expect(Object.keys(after.bastions).length).toBe(Object.keys(before.bastions).length + 1)
    expect(active().name).toBe('Imported')
  })
})
