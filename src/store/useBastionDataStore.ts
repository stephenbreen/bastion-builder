'use client';
import { create } from 'zustand'
import type {
  Aspect,
  Bastion,
  DomainDefense,
  FacilityFloor,
  OrderType,
  Size,
  WeeklyCostKey,
} from '../types'
import { emptyWeeklyCosts } from '../types'
import { seedManor } from '../data/seed'
import { newId } from '../lib/id'
import { advanceWeek } from './reducers/turn'
import { startBuild, type BuildResult } from './reducers/build'
import { parseImportJSON, type ParseResult } from './reducers/transfer'
import {
  cancelAspectSwitch,
  switchAspect,
  type SwitchAspectResult,
} from './reducers/aspect'
import {
  addFollower,
  removeFollower,
  updateFollower,
  type FollowerInput,
  type FollowerPatch,
} from './reducers/followers'
import { adjustDomainRenown } from './reducers/renown'
import {
  addProject,
  removeProject,
  rollProject,
  updateProject,
  type ProjectInput,
  type ProjectPatch,
  type RollProjectInput,
  type RollProjectResult,
} from './reducers/projects'
import {
  recordActivity,
  type RecordActivityInput,
  type RecordActivityResult,
} from './reducers/activities'
import {
  adjustDomainDefense,
  beginIntrigue,
  endIntrigue,
  setDomainDefense,
  setDomainSize,
} from './reducers/domain'
import {
  addCustomCatalogueEntry,
  removeCustomCatalogueEntry,
  updateCustomCatalogueEntry,
  type HomebrewDraft,
  type HomebrewPatch,
  type HomebrewResult,
} from './reducers/homebrew-rooms'
import {
  addFloor,
  moveFloor,
  removeFloor,
  resetFloors,
  setFloorLabel,
  type RemoveFloorResult,
} from './reducers/floors'
import {
  removeFacility,
  updateFacility,
  type FacilityPatch,
  type UpdateFacilityResult,
} from './reducers/facility-edit'
import {
  addPc,
  removePc,
  updatePc,
  type PCInput,
  type PCPatch,
  type PCResult,
} from './reducers/pcs'
import {
  levelUpStronghold,
  type LevelUpResult,
} from './reducers/stronghold-level'

const MAX_HISTORY = 10

export type DeleteResult = { ok: true } | { ok: false; reason: string }

/**
 * Internal bastion data store — holds all bastion CRUD + reducer delegations
 * in-memory. Phase B uses this; Unit 7 will replace `useBastion` and
 * `useBastionMutation` with TanStack Query against `/api/bastions/[id]`.
 *
 * Components should not touch this store directly — use the hooks in
 * `src/hooks/` instead so the eventual server swap is a one-file change.
 */
export interface BastionDataStore {
  bastions: Record<string, Bastion>
  activeBastionId: string
  weekHistory: Bastion[]

  // Multi-bastion CRUD
  createBastion: (name?: string) => string
  switchBastion: (id: string) => void
  renameBastion: (id: string, name: string) => void
  duplicateBastion: (id: string, name?: string) => string
  deleteBastion: (id: string) => DeleteResult
  reset: () => void

  // Facility ops
  setOrder: (
    bastionId: string,
    facilityId: string,
    order: OrderType | null,
  ) => void
  setFacilityFloor: (
    bastionId: string,
    facilityId: string,
    floor: FacilityFloor,
  ) => void

  // Turn engine
  advanceWeek: (bastionId: string) => void
  rewindWeek: (bastionId: string) => boolean

  // Construction
  startBuild: (
    bastionId: string,
    catalogueId: string,
    size: Size,
  ) => BuildResult

  // Treasury / aspect
  setTreasury: (bastionId: string, amount: number) => void
  switchAspect: (bastionId: string, target: Aspect) => SwitchAspectResult
  cancelAspectSwitch: (bastionId: string) => void

  // Followers
  addFollower: (bastionId: string, input: FollowerInput) => void
  updateFollower: (
    bastionId: string,
    id: string,
    patch: FollowerPatch,
  ) => void
  removeFollower: (bastionId: string, id: string) => void

  // Renown / domain
  adjustDomainRenown: (bastionId: string, delta: number, reason?: string) => void
  setDomainSize: (bastionId: string, size: number) => void
  setDomainDefense: (
    bastionId: string,
    defense: DomainDefense,
    value: number,
  ) => void
  adjustDomainDefense: (
    bastionId: string,
    defense: DomainDefense,
    delta: number,
  ) => void
  beginIntrigue: (bastionId: string) => void
  endIntrigue: (bastionId: string) => void

  // Projects
  addProject: (bastionId: string, input: ProjectInput) => void
  updateProject: (bastionId: string, id: string, patch: ProjectPatch) => void
  removeProject: (bastionId: string, id: string) => void
  rollProject: (
    bastionId: string,
    id: string,
    input: RollProjectInput,
  ) => RollProjectResult

  // Activities + DM notes + costs
  recordActivity: (
    bastionId: string,
    input: RecordActivityInput,
  ) => RecordActivityResult
  setDmNotes: (bastionId: string, text: string) => void
  setWeeklyCost: (
    bastionId: string,
    category: WeeklyCostKey,
    value: number,
  ) => void
  setUpkeepNotes: (bastionId: string, text: string) => void

  // Homebrew rooms
  addCustomCatalogueEntry: (
    bastionId: string,
    draft: HomebrewDraft,
  ) => HomebrewResult
  updateCustomCatalogueEntry: (
    bastionId: string,
    id: string,
    patch: HomebrewPatch,
  ) => HomebrewResult
  removeCustomCatalogueEntry: (bastionId: string, id: string) => void

  // Floor configuration
  setFloorLabel: (bastionId: string, floor: FacilityFloor, label: string) => void
  moveFloor: (
    bastionId: string,
    floor: FacilityFloor,
    direction: 'up' | 'down',
  ) => void
  addFloor: (bastionId: string, label?: string) => string
  removeFloor: (bastionId: string, floor: FacilityFloor) => RemoveFloorResult
  resetFloors: (bastionId: string) => void

  // Facility editing
  updateFacility: (
    bastionId: string,
    id: string,
    patch: FacilityPatch,
  ) => UpdateFacilityResult
  removeFacility: (bastionId: string, id: string) => void

  // PC tracker
  addPc: (bastionId: string, input: PCInput) => PCResult
  updatePc: (bastionId: string, id: string, patch: PCPatch) => PCResult
  removePc: (bastionId: string, id: string) => void

  // Stronghold level-up
  levelUpStronghold: (bastionId: string) => LevelUpResult

  // Import
  importBastion: (text: string) => ParseResult
}

function makeBastionId(): string {
  return newId().slice(0, 8)
}

function freshSeed(name?: string): { id: string; bastion: Bastion } {
  const id = makeBastionId()
  const bastion = seedManor()
  if (name && name.trim()) {
    bastion.name = name.trim()
  }
  return { id, bastion }
}

export const useBastionDataStore = create<BastionDataStore>()((set, get) => {
  const initial = freshSeed()

  // Helper: apply fn to one bastion. fn returns a new Bastion.
  const mutate = (bastionId: string, fn: (b: Bastion) => Bastion) => {
    const s = get()
    const target = s.bastions[bastionId]
    if (!target) return
    const next = fn(target)
    if (next === target) return
    set({ bastions: { ...s.bastions, [bastionId]: next } })
  }

  const getBastion = (bastionId: string): Bastion | undefined => {
    return get().bastions[bastionId]
  }

  return {
    bastions: { [initial.id]: initial.bastion },
    activeBastionId: initial.id,
    weekHistory: [],

    reset: () => {
      const s = get()
      const id = s.activeBastionId
      const current = s.bastions[id]
      if (!current) return
      const fresh = seedManor()
      fresh.name = current.name
      set({
        bastions: { ...s.bastions, [id]: fresh },
        weekHistory: [],
      })
    },

    createBastion: (name) => {
      const { id, bastion } = freshSeed(name)
      set((s) => ({
        bastions: { ...s.bastions, [id]: bastion },
        activeBastionId: id,
        weekHistory: [],
      }))
      return id
    },
    switchBastion: (id) => {
      const s = get()
      if (!s.bastions[id] || id === s.activeBastionId) return
      set({ activeBastionId: id, weekHistory: [] })
    },
    renameBastion: (id, name) => {
      const trimmed = name.trim()
      if (!trimmed) return
      const s = get()
      const target = s.bastions[id]
      if (!target || target.name === trimmed) return
      set({
        bastions: { ...s.bastions, [id]: { ...target, name: trimmed } },
      })
    },
    duplicateBastion: (id, name) => {
      const s = get()
      const source = s.bastions[id]
      if (!source) return ''
      const newId2 = makeBastionId()
      const cloned: Bastion = {
        ...JSON.parse(JSON.stringify(source)),
        name: name?.trim() || `${source.name} (copy)`,
      }
      set({
        bastions: { ...s.bastions, [newId2]: cloned },
        activeBastionId: newId2,
        weekHistory: [],
      })
      return newId2
    },
    deleteBastion: (id) => {
      const s = get()
      if (!s.bastions[id]) return { ok: false, reason: 'Unknown bastion.' }
      const remainingIds = Object.keys(s.bastions).filter((bid) => bid !== id)
      if (remainingIds.length === 0) {
        return {
          ok: false,
          reason: 'Cannot delete the last bastion. Create another first.',
        }
      }
      const { [id]: _drop, ...rest } = s.bastions
      const nextActive =
        id === s.activeBastionId ? (remainingIds[0] ?? '') : s.activeBastionId
      set({
        bastions: rest,
        activeBastionId: nextActive,
        weekHistory: [],
      })
      return { ok: true }
    },

    setOrder: (bastionId, facilityId, order) => {
      mutate(bastionId, (bastion) => {
        const facility = bastion.facilities.find((f) => f.id === facilityId)
        if (!facility) return bastion
        if (facility.state !== 'active') return bastion
        if (facility.orders.length === 0) return bastion
        if (order !== null && !facility.orders.includes(order)) return bastion

        const facilities = bastion.facilities.map((f) => {
          if (f.id !== facilityId) return f
          if (order === null) {
            const { pendingOrder: _drop, ...withoutPending } = f
            return withoutPending
          }
          return { ...f, pendingOrder: order }
        })
        return { ...bastion, facilities }
      })
    },
    setFacilityFloor: (bastionId, facilityId, floor) => {
      mutate(bastionId, (bastion) => {
        const facility = bastion.facilities.find((f) => f.id === facilityId)
        if (!facility) return bastion
        if ((facility.floor ?? 'ground') === floor) return bastion
        const facilities = bastion.facilities.map((f) =>
          f.id === facilityId ? { ...f, floor } : f,
        )
        return { ...bastion, facilities }
      })
    },

    advanceWeek: (bastionId) => {
      const s = get()
      const target = s.bastions[bastionId]
      if (!target) return
      const history = [...s.weekHistory, target].slice(-MAX_HISTORY)
      set({
        bastions: { ...s.bastions, [bastionId]: advanceWeek(target) },
        weekHistory: history,
      })
    },
    rewindWeek: (bastionId) => {
      const s = get()
      if (s.weekHistory.length === 0) return false
      const last = s.weekHistory[s.weekHistory.length - 1]
      set({
        bastions: { ...s.bastions, [bastionId]: last },
        weekHistory: s.weekHistory.slice(0, -1),
      })
      return true
    },

    startBuild: (bastionId, catalogueId, size) => {
      const target = getBastion(bastionId)
      if (!target) {
        return { ok: false, reason: 'Unknown bastion.' } as BuildResult
      }
      const result = startBuild(target, { catalogueId, size })
      if (result.ok) mutate(bastionId, () => result.bastion)
      return result
    },

    setTreasury: (bastionId, amount) => {
      const treasury = Math.trunc(amount)
      if (!Number.isFinite(treasury)) return
      mutate(bastionId, (b) => ({ ...b, treasury }))
    },
    switchAspect: (bastionId, target) => {
      const current = getBastion(bastionId)
      if (!current) {
        return { ok: false, reason: 'Unknown bastion.' } as SwitchAspectResult
      }
      const result = switchAspect(current, target)
      if (result.ok) mutate(bastionId, () => result.bastion)
      return result
    },
    cancelAspectSwitch: (bastionId) =>
      mutate(bastionId, (b) => cancelAspectSwitch(b)),

    addFollower: (bastionId, input) =>
      mutate(bastionId, (b) => addFollower(b, input)),
    updateFollower: (bastionId, id, patch) =>
      mutate(bastionId, (b) => updateFollower(b, id, patch)),
    removeFollower: (bastionId, id) =>
      mutate(bastionId, (b) => removeFollower(b, id)),

    adjustDomainRenown: (bastionId, delta, reason) =>
      mutate(bastionId, (b) => adjustDomainRenown(b, delta, reason)),
    setDomainSize: (bastionId, size) =>
      mutate(bastionId, (b) => setDomainSize(b, size)),
    setDomainDefense: (bastionId, defense, value) =>
      mutate(bastionId, (b) => setDomainDefense(b, defense, value)),
    adjustDomainDefense: (bastionId, defense, delta) =>
      mutate(bastionId, (b) => adjustDomainDefense(b, defense, delta)),
    beginIntrigue: (bastionId) => mutate(bastionId, (b) => beginIntrigue(b)),
    endIntrigue: (bastionId) => mutate(bastionId, (b) => endIntrigue(b)),

    addProject: (bastionId, input) =>
      mutate(bastionId, (b) => addProject(b, input)),
    updateProject: (bastionId, id, patch) =>
      mutate(bastionId, (b) => updateProject(b, id, patch)),
    removeProject: (bastionId, id) =>
      mutate(bastionId, (b) => removeProject(b, id)),
    rollProject: (bastionId, id, input) => {
      const current = getBastion(bastionId)
      if (!current) {
        return { ok: false, reason: 'Unknown bastion.' } as RollProjectResult
      }
      const result = rollProject(current, id, input)
      if (result.ok) mutate(bastionId, () => result.bastion)
      return result
    },

    recordActivity: (bastionId, input) => {
      const current = getBastion(bastionId)
      if (!current) {
        return { ok: false, reason: 'Unknown bastion.' } as RecordActivityResult
      }
      const result = recordActivity(current, input)
      if (result.ok) mutate(bastionId, () => result.bastion)
      return result
    },
    setDmNotes: (bastionId, text) => {
      mutate(bastionId, (b) => {
        if ((b.dmNotes ?? '') === text) return b
        return { ...b, dmNotes: text }
      })
    },
    setWeeklyCost: (bastionId, category, value) => {
      const truncated = Math.max(0, Math.trunc(value))
      if (!Number.isFinite(truncated)) return
      mutate(bastionId, (b) => {
        const current = b.weeklyCosts ?? emptyWeeklyCosts()
        if (current[category] === truncated) return b
        return { ...b, weeklyCosts: { ...current, [category]: truncated } }
      })
    },
    setUpkeepNotes: (bastionId, text) => {
      mutate(bastionId, (b) => {
        const current = b.weeklyCosts ?? emptyWeeklyCosts()
        const trimmed = text.trim() || undefined
        if ((current.upkeepNotes ?? '') === (trimmed ?? '')) return b
        return {
          ...b,
          weeklyCosts: { ...current, upkeepNotes: trimmed },
        }
      })
    },

    addCustomCatalogueEntry: (bastionId, draft) => {
      const current = getBastion(bastionId)
      if (!current) {
        return { ok: false, reason: 'Unknown bastion.' } as HomebrewResult
      }
      const result = addCustomCatalogueEntry(current, draft)
      if (result.ok) mutate(bastionId, () => result.bastion)
      return result
    },
    updateCustomCatalogueEntry: (bastionId, id, patch) => {
      const current = getBastion(bastionId)
      if (!current) {
        return { ok: false, reason: 'Unknown bastion.' } as HomebrewResult
      }
      const result = updateCustomCatalogueEntry(current, id, patch)
      if (result.ok) mutate(bastionId, () => result.bastion)
      return result
    },
    removeCustomCatalogueEntry: (bastionId, id) =>
      mutate(bastionId, (b) => removeCustomCatalogueEntry(b, id)),

    setFloorLabel: (bastionId, floor, label) =>
      mutate(bastionId, (b) => setFloorLabel(b, floor, label)),
    moveFloor: (bastionId, floor, direction) =>
      mutate(bastionId, (b) => moveFloor(b, floor, direction)),
    addFloor: (bastionId, label) => {
      const current = getBastion(bastionId)
      if (!current) return ''
      const result = addFloor(current, label)
      mutate(bastionId, () => result.bastion)
      return result.id
    },
    removeFloor: (bastionId, floor) => {
      const current = getBastion(bastionId)
      if (!current) {
        return { ok: false, reason: 'Unknown bastion.' } as RemoveFloorResult
      }
      const result = removeFloor(current, floor)
      if (result.ok) mutate(bastionId, () => result.bastion)
      return result
    },
    resetFloors: (bastionId) => mutate(bastionId, (b) => resetFloors(b)),

    updateFacility: (bastionId, id, patch) => {
      const current = getBastion(bastionId)
      if (!current) {
        return {
          ok: false,
          reason: 'Unknown bastion.',
        } as UpdateFacilityResult
      }
      const result = updateFacility(current, id, patch)
      if (result.ok) mutate(bastionId, () => result.bastion)
      return result
    },
    removeFacility: (bastionId, id) =>
      mutate(bastionId, (b) => removeFacility(b, id)),

    addPc: (bastionId, input) => {
      const current = getBastion(bastionId)
      if (!current) return { ok: false, reason: 'Unknown bastion.' } as PCResult
      const result = addPc(current, input)
      if (result.ok) mutate(bastionId, () => result.bastion)
      return result
    },
    updatePc: (bastionId, id, patch) => {
      const current = getBastion(bastionId)
      if (!current) return { ok: false, reason: 'Unknown bastion.' } as PCResult
      const result = updatePc(current, id, patch)
      if (result.ok) mutate(bastionId, () => result.bastion)
      return result
    },
    removePc: (bastionId, id) => mutate(bastionId, (b) => removePc(b, id)),

    levelUpStronghold: (bastionId) => {
      const current = getBastion(bastionId)
      if (!current) {
        return { ok: false, reason: 'Unknown bastion.' } as LevelUpResult
      }
      const result = levelUpStronghold(current)
      if (result.ok) mutate(bastionId, () => result.bastion)
      return result
    },

    importBastion: (text) => {
      const result = parseImportJSON(text)
      if (result.ok) {
        const newId2 = makeBastionId()
        set((s) => ({
          bastions: { ...s.bastions, [newId2]: result.bastion },
          activeBastionId: newId2,
          weekHistory: [],
        }))
      }
      return result
    },
  }
})
