import type { Bastion, FacilityFloor, Floor } from '../types'
import { DEFAULT_FLOORS, FLOOR_LABELS, type DefaultFloorId } from '../types'

/**
 * Resolve the bastion's effective floors list, falling back to DEFAULT_FLOORS
 * when the bastion hasn't authored a custom one yet (no overrides applied).
 */
export function getFloors(bastion: Pick<Bastion, 'floors'>): Floor[] {
  return bastion.floors && bastion.floors.length > 0 ? bastion.floors : DEFAULT_FLOORS
}

/** Resolve the displayed name for a floor id. */
export function getFloorLabel(
  bastion: Pick<Bastion, 'floors'>,
  floor: FacilityFloor,
): string {
  const match = getFloors(bastion).find((f) => f.id === floor)
  if (match) return match.label
  return (FLOOR_LABELS as Record<string, string>)[floor as DefaultFloorId] ?? floor
}

/** Render order — list of floor ids top-to-bottom. */
export function getFloorOrder(
  bastion: Pick<Bastion, 'floors'>,
): FacilityFloor[] {
  return getFloors(bastion).map((f) => f.id)
}
