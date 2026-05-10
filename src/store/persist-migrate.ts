import type { Bastion } from '../types'
import { FLOOR_LABELS, FLOOR_RENDER_ORDER } from '../types/facility'
import { seedManor } from '../data/seed'
import { newId } from '../lib/id'

/**
 * Theme name kept loose here so this module doesn't depend on the store.
 * Validation/clamping happens where it's consumed.
 */
export type ThemeName = string

export interface MigratedPersistedState {
  bastions: Record<string, Bastion>
  activeBastionId: string
  theme: ThemeName
}

function makeBastionId(): string {
  return newId().slice(0, 8)
}

/**
 * Migrate a persisted Zustand `bastion-planner` payload through the v8→v9→v10
 * transitions. Returns `null` when the input is not an object-like payload so
 * callers can decide what to do (the Zustand consumer treats `null` as "leave
 * it"; the import route treats it as an error).
 */
export function migratePersistedState(
  persisted: unknown,
  version: number,
): MigratedPersistedState | null {
  if (!persisted || typeof persisted !== 'object') return null

  let state = persisted as {
    bastion?: Bastion
    bastions?: Record<string, Bastion>
    activeBastionId?: string
    theme?: ThemeName
  }

  // v8 → v9: single bastion → multi-bastion record.
  if (version < 9) {
    const id = makeBastionId()
    const bastion = state.bastion ?? seedManor()
    state = {
      bastions: { [id]: bastion },
      activeBastionId: id,
      theme: state.theme ?? 'heraldic',
    }
  }

  // v9 → v10: collapse customFloorLabels + floorOrder into floors: Floor[].
  if (version < 10 && state.bastions) {
    for (const bid of Object.keys(state.bastions)) {
      const b = state.bastions[bid] as Bastion & {
        customFloorLabels?: Partial<Record<string, string>>
        floorOrder?: string[]
      }
      const hadOverrides = !!(b.customFloorLabels || b.floorOrder)
      if (hadOverrides) {
        const order = b.floorOrder ?? [...FLOOR_RENDER_ORDER]
        b.floors = order.map((id) => ({
          id,
          label:
            b.customFloorLabels?.[id] ??
            FLOOR_LABELS[id as keyof typeof FLOOR_LABELS] ??
            id,
        }))
      }
      delete b.customFloorLabels
      delete b.floorOrder
    }
  }

  if (!state.bastions || !state.activeBastionId) return null

  return {
    bastions: state.bastions,
    activeBastionId: state.activeBastionId,
    theme: state.theme ?? 'heraldic',
  }
}
