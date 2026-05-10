import type { Bastion, FacilityFloor, Floor } from '../../types'
import { DEFAULT_FLOORS } from '../../types'
import { newId } from '../../lib/id'

/** Materialise the floors list (so we can mutate a copy without losing the default). */
function ensureFloors(bastion: Bastion): Floor[] {
  return bastion.floors && bastion.floors.length > 0
    ? bastion.floors.map((f) => ({ ...f }))
    : DEFAULT_FLOORS.map((f) => ({ ...f }))
}

/** True when `floors` exactly matches DEFAULT_FLOORS — lets us drop the field to undefined. */
function isCanonical(floors: Floor[]): boolean {
  if (floors.length !== DEFAULT_FLOORS.length) return false
  return floors.every(
    (f, i) => f.id === DEFAULT_FLOORS[i].id && f.label === DEFAULT_FLOORS[i].label,
  )
}

function commit(bastion: Bastion, floors: Floor[]): Bastion {
  return { ...bastion, floors: isCanonical(floors) ? undefined : floors }
}

export function setFloorLabel(
  bastion: Bastion,
  floorId: FacilityFloor,
  label: string,
): Bastion {
  const floors = ensureFloors(bastion)
  const idx = floors.findIndex((f) => f.id === floorId)
  if (idx === -1) return bastion
  const trimmed = label.trim()
  // Empty input restores the canonical default (or no-op for custom floors).
  const fallback = DEFAULT_FLOORS.find((f) => f.id === floorId)?.label ?? floors[idx].label
  const finalLabel = trimmed || fallback
  if (floors[idx].label === finalLabel) return bastion
  floors[idx] = { ...floors[idx], label: finalLabel }
  return commit(bastion, floors)
}

export function moveFloor(
  bastion: Bastion,
  floorId: FacilityFloor,
  direction: 'up' | 'down',
): Bastion {
  const floors = ensureFloors(bastion)
  const idx = floors.findIndex((f) => f.id === floorId)
  if (idx === -1) return bastion
  const target = direction === 'up' ? idx - 1 : idx + 1
  if (target < 0 || target >= floors.length) return bastion
  ;[floors[idx], floors[target]] = [floors[target], floors[idx]]
  return commit(bastion, floors)
}

export interface AddFloorResult {
  bastion: Bastion
  /** The id assigned to the newly added floor — useful for autoselect / focus. */
  id: FacilityFloor
}

export function addFloor(bastion: Bastion, label?: string): AddFloorResult {
  const floors = ensureFloors(bastion)
  const id = `floor-${newId().slice(0, 6)}`
  const trimmed = (label ?? '').trim() || `Floor ${floors.length + 1}`
  floors.push({ id, label: trimmed })
  return { bastion: commit(bastion, floors), id }
}

export type RemoveFloorResult =
  | { ok: true; bastion: Bastion }
  | { ok: false; bastion: Bastion; reason: string }

export function removeFloor(
  bastion: Bastion,
  floorId: FacilityFloor,
): RemoveFloorResult {
  const floors = ensureFloors(bastion)
  if (floors.length <= 1) {
    return { ok: false, bastion, reason: 'Bastion must keep at least one floor.' }
  }
  if (!floors.some((f) => f.id === floorId)) {
    return { ok: false, bastion, reason: `Unknown floor: ${floorId}` }
  }
  const occupied = bastion.facilities.filter((f) => (f.floor ?? 'ground') === floorId)
  if (occupied.length > 0) {
    return {
      ok: false,
      bastion,
      reason: `${occupied.length} room${occupied.length === 1 ? '' : 's'} on this floor — move or remove them first.`,
    }
  }
  const next = floors.filter((f) => f.id !== floorId)
  return { ok: true, bastion: commit(bastion, next) }
}

export function resetFloors(bastion: Bastion): Bastion {
  if (!bastion.floors) return bastion
  return { ...bastion, floors: undefined }
}
