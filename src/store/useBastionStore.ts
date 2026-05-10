'use client';
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
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
import { migratePersistedState } from './persist-migrate'

export type ViewMode = 'dm' | 'player'

export const THEME_NAMES = ['heraldic', 'parchment', 'violet'] as const
export type ThemeName = (typeof THEME_NAMES)[number]

const MAX_HISTORY = 10

export type DeleteResult = { ok: true } | { ok: false; reason: string }

interface BastionStore {
  bastions: Record<string, Bastion>
  activeBastionId: string
  selectedFacilityId: string | null
  viewMode: ViewMode
  theme: ThemeName
  /** Snapshots taken before each advanceWeek call on the active bastion. */
  weekHistory: Bastion[]

  // UI / system
  setViewMode: (mode: ViewMode) => void
  setTheme: (theme: ThemeName) => void
  reset: () => void

  // Multi-bastion CRUD
  createBastion: (name?: string) => string
  switchBastion: (id: string) => void
  renameBastion: (id: string, name: string) => void
  duplicateBastion: (id: string, name?: string) => string
  deleteBastion: (id: string) => DeleteResult

  // Selection / facility ops (active bastion)
  selectFacility: (id: string) => void
  clearSelection: () => void
  setOrder: (facilityId: string, order: OrderType | null) => void
  setFacilityFloor: (facilityId: string, floor: FacilityFloor) => void

  // Turn engine
  advanceWeek: () => void
  rewindWeek: () => boolean

  // Construction
  startBuild: (catalogueId: string, size: Size) => BuildResult

  // Treasury / aspect
  setTreasury: (amount: number) => void
  switchAspect: (target: Aspect) => SwitchAspectResult
  cancelAspectSwitch: () => void

  // Followers
  addFollower: (input: FollowerInput) => void
  updateFollower: (id: string, patch: FollowerPatch) => void
  removeFollower: (id: string) => void

  // Renown / domain
  adjustDomainRenown: (delta: number, reason?: string) => void
  setDomainSize: (size: number) => void
  setDomainDefense: (defense: DomainDefense, value: number) => void
  adjustDomainDefense: (defense: DomainDefense, delta: number) => void
  beginIntrigue: () => void
  endIntrigue: () => void

  // Projects
  addProject: (input: ProjectInput) => void
  updateProject: (id: string, patch: ProjectPatch) => void
  removeProject: (id: string) => void
  rollProject: (id: string, input: RollProjectInput) => RollProjectResult

  // Activities + DM notes
  recordActivity: (input: RecordActivityInput) => RecordActivityResult
  setDmNotes: (text: string) => void
  setWeeklyCost: (category: WeeklyCostKey, value: number) => void
  setUpkeepNotes: (text: string) => void

  // Homebrew rooms (per-bastion catalogue entries)
  addCustomCatalogueEntry: (draft: HomebrewDraft) => HomebrewResult
  updateCustomCatalogueEntry: (id: string, patch: HomebrewPatch) => HomebrewResult
  removeCustomCatalogueEntry: (id: string) => void

  // Floor configuration (per-bastion)
  setFloorLabel: (floor: FacilityFloor, label: string) => void
  moveFloor: (floor: FacilityFloor, direction: 'up' | 'down') => void
  addFloor: (label?: string) => string
  removeFloor: (floor: FacilityFloor) => RemoveFloorResult
  resetFloors: () => void

  // Facility editing (built rooms)
  updateFacility: (id: string, patch: FacilityPatch) => UpdateFacilityResult
  removeFacility: (id: string) => void

  // PC tracker
  addPc: (input: PCInput) => PCResult
  updatePc: (id: string, patch: PCPatch) => PCResult
  removePc: (id: string) => void

  // Stronghold level-up
  levelUpStronghold: () => LevelUpResult

  // Import (creates a new bastion and switches to it)
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

export const useBastionStore = create<BastionStore>()(
  persist(
    (set, get) => {
      const initial = freshSeed()

      // Helper: apply fn to the active bastion. fn returns a new Bastion.
      const mutateActive = (fn: (b: Bastion) => Bastion) => {
        const s = get()
        const active = s.bastions[s.activeBastionId]
        if (!active) return
        const next = fn(active)
        if (next === active) return
        set({ bastions: { ...s.bastions, [s.activeBastionId]: next } })
      }

      const getActive = (): Bastion => {
        const s = get()
        return s.bastions[s.activeBastionId]
      }

      return {
        bastions: { [initial.id]: initial.bastion },
        activeBastionId: initial.id,
        selectedFacilityId: null,
        viewMode: 'dm',
        theme: 'heraldic',
        weekHistory: [],

        setViewMode: (mode) => set({ viewMode: mode }),
        setTheme: (theme) => set({ theme }),
        reset: () => {
          const s = get()
          mutateActive(() => {
            // Fully replace this bastion with a fresh seed of the same name.
            const fresh = seedManor()
            fresh.name = s.bastions[s.activeBastionId]?.name ?? fresh.name
            return fresh
          })
          set({ selectedFacilityId: null, weekHistory: [] })
        },

        createBastion: (name) => {
          const { id, bastion } = freshSeed(name)
          set((s) => ({
            bastions: { ...s.bastions, [id]: bastion },
            activeBastionId: id,
            selectedFacilityId: null,
            weekHistory: [],
          }))
          return id
        },
        switchBastion: (id) => {
          const s = get()
          if (!s.bastions[id] || id === s.activeBastionId) return
          set({
            activeBastionId: id,
            selectedFacilityId: null,
            weekHistory: [],
          })
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
            selectedFacilityId: null,
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
            selectedFacilityId: null,
            weekHistory: [],
          })
          return { ok: true }
        },

        selectFacility: (id) => {
          const exists = getActive().facilities.some((f) => f.id === id)
          if (!exists) return
          set({ selectedFacilityId: id })
        },
        clearSelection: () => set({ selectedFacilityId: null }),
        setOrder: (facilityId, order) => {
          mutateActive((bastion) => {
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
        setFacilityFloor: (facilityId, floor) => {
          mutateActive((bastion) => {
            const facility = bastion.facilities.find((f) => f.id === facilityId)
            if (!facility) return bastion
            if ((facility.floor ?? 'ground') === floor) return bastion
            const facilities = bastion.facilities.map((f) =>
              f.id === facilityId ? { ...f, floor } : f,
            )
            return { ...bastion, facilities }
          })
        },

        advanceWeek: () => {
          const s = get()
          const active = s.bastions[s.activeBastionId]
          const history = [...s.weekHistory, active].slice(-MAX_HISTORY)
          set({
            bastions: { ...s.bastions, [s.activeBastionId]: advanceWeek(active) },
            weekHistory: history,
          })
        },
        rewindWeek: () => {
          const s = get()
          if (s.weekHistory.length === 0) return false
          const last = s.weekHistory[s.weekHistory.length - 1]
          set({
            bastions: { ...s.bastions, [s.activeBastionId]: last },
            weekHistory: s.weekHistory.slice(0, -1),
            selectedFacilityId: null,
          })
          return true
        },

        startBuild: (catalogueId, size) => {
          const result = startBuild(getActive(), { catalogueId, size })
          if (result.ok) mutateActive(() => result.bastion)
          return result
        },

        setTreasury: (amount) => {
          // Allow negative balances (warn-and-allow on weekly cost ticks).
          const treasury = Math.trunc(amount)
          if (!Number.isFinite(treasury)) return
          mutateActive((b) => ({ ...b, treasury }))
        },
        switchAspect: (target) => {
          const result = switchAspect(getActive(), target)
          if (result.ok) mutateActive(() => result.bastion)
          return result
        },
        cancelAspectSwitch: () => mutateActive((b) => cancelAspectSwitch(b)),

        addFollower: (input) => mutateActive((b) => addFollower(b, input)),
        updateFollower: (id, patch) =>
          mutateActive((b) => updateFollower(b, id, patch)),
        removeFollower: (id) => mutateActive((b) => removeFollower(b, id)),

        adjustDomainRenown: (delta, reason) =>
          mutateActive((b) => adjustDomainRenown(b, delta, reason)),
        setDomainSize: (size) => mutateActive((b) => setDomainSize(b, size)),
        setDomainDefense: (defense, value) =>
          mutateActive((b) => setDomainDefense(b, defense, value)),
        adjustDomainDefense: (defense, delta) =>
          mutateActive((b) => adjustDomainDefense(b, defense, delta)),
        beginIntrigue: () => mutateActive((b) => beginIntrigue(b)),
        endIntrigue: () => mutateActive((b) => endIntrigue(b)),

        addProject: (input) => mutateActive((b) => addProject(b, input)),
        updateProject: (id, patch) =>
          mutateActive((b) => updateProject(b, id, patch)),
        removeProject: (id) => mutateActive((b) => removeProject(b, id)),
        rollProject: (id, input) => {
          const result = rollProject(getActive(), id, input)
          if (result.ok) mutateActive(() => result.bastion)
          return result
        },

        recordActivity: (input) => {
          const result = recordActivity(getActive(), input)
          if (result.ok) mutateActive(() => result.bastion)
          return result
        },
        setDmNotes: (text) => {
          mutateActive((b) => {
            if ((b.dmNotes ?? '') === text) return b
            return { ...b, dmNotes: text }
          })
        },
        setWeeklyCost: (category, value) => {
          const truncated = Math.max(0, Math.trunc(value))
          if (!Number.isFinite(truncated)) return
          mutateActive((b) => {
            const current = b.weeklyCosts ?? emptyWeeklyCosts()
            if (current[category] === truncated) return b
            return { ...b, weeklyCosts: { ...current, [category]: truncated } }
          })
        },
        setUpkeepNotes: (text) => {
          mutateActive((b) => {
            const current = b.weeklyCosts ?? emptyWeeklyCosts()
            const trimmed = text.trim() || undefined
            if ((current.upkeepNotes ?? '') === (trimmed ?? '')) return b
            return {
              ...b,
              weeklyCosts: { ...current, upkeepNotes: trimmed },
            }
          })
        },

        addCustomCatalogueEntry: (draft) => {
          const result = addCustomCatalogueEntry(getActive(), draft)
          if (result.ok) mutateActive(() => result.bastion)
          return result
        },
        updateCustomCatalogueEntry: (id, patch) => {
          const result = updateCustomCatalogueEntry(getActive(), id, patch)
          if (result.ok) mutateActive(() => result.bastion)
          return result
        },
        removeCustomCatalogueEntry: (id) =>
          mutateActive((b) => removeCustomCatalogueEntry(b, id)),

        setFloorLabel: (floor, label) =>
          mutateActive((b) => setFloorLabel(b, floor, label)),
        moveFloor: (floor, direction) =>
          mutateActive((b) => moveFloor(b, floor, direction)),
        addFloor: (label) => {
          const result = addFloor(getActive(), label)
          mutateActive(() => result.bastion)
          return result.id
        },
        removeFloor: (floor) => {
          const result = removeFloor(getActive(), floor)
          if (result.ok) mutateActive(() => result.bastion)
          return result
        },
        resetFloors: () => mutateActive((b) => resetFloors(b)),

        updateFacility: (id, patch) => {
          const result = updateFacility(getActive(), id, patch)
          if (result.ok) mutateActive(() => result.bastion)
          return result
        },
        removeFacility: (id) => mutateActive((b) => removeFacility(b, id)),

        addPc: (input) => {
          const result = addPc(getActive(), input)
          if (result.ok) mutateActive(() => result.bastion)
          return result
        },
        updatePc: (id, patch) => {
          const result = updatePc(getActive(), id, patch)
          if (result.ok) mutateActive(() => result.bastion)
          return result
        },
        removePc: (id) => mutateActive((b) => removePc(b, id)),

        levelUpStronghold: () => {
          const result = levelUpStronghold(getActive())
          if (result.ok) mutateActive(() => result.bastion)
          return result
        },

        importBastion: (text) => {
          const result = parseImportJSON(text)
          if (result.ok) {
            const newId2 = makeBastionId()
            set((s) => ({
              bastions: { ...s.bastions, [newId2]: result.bastion },
              activeBastionId: newId2,
              selectedFacilityId: null,
              weekHistory: [],
            }))
          }
          return result
        },
      }
    },
    {
      name: 'bastion-planner',
      version: 10,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        bastions: state.bastions,
        activeBastionId: state.activeBastionId,
        theme: state.theme,
      }),
      migrate: (persisted, version) =>
        (migratePersistedState(persisted, version) ?? persisted) as BastionStore,
    },
  ),
)

/** Convenience hook — subscribes to the active bastion only. */
export function useActiveBastion(): Bastion {
  return useBastionStore((s) => s.bastions[s.activeBastionId])
}

/** Pure selector — for use inside reducers/tests where there's no React subscription. */
export function getActiveBastion(state: BastionStore): Bastion {
  return state.bastions[state.activeBastionId]
}
