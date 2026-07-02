import type {
  Bastion,
  FacilityCategory,
  FacilityFloor,
  FacilityState,
  LogEntry,
} from '../../types'
import { newId } from '../../lib/id'

export interface FacilityPatch {
  name?: string
  notes?: string | null
  state?: FacilityState
  category?: FacilityCategory
  floor?: FacilityFloor
}

export type UpdateFacilityResult =
  | { ok: true; bastion: Bastion }
  | { ok: false; bastion: Bastion; reason: string }

export function updateFacility(
  bastion: Bastion,
  id: string,
  patch: FacilityPatch,
): UpdateFacilityResult {
  const idx = bastion.facilities.findIndex((f) => f.id === id)
  if (idx === -1) {
    return { ok: false, bastion, reason: `Unknown facility: ${id}` }
  }
  const facility = bastion.facilities[idx]
  const trimmedName = patch.name?.trim()
  if (patch.name !== undefined && !trimmedName) {
    return { ok: false, bastion, reason: 'Name cannot be empty.' }
  }
  const next = { ...facility }
  let changed = false
  if (trimmedName !== undefined && trimmedName !== facility.name) {
    next.name = trimmedName
    changed = true
  }
  if (patch.state !== undefined && patch.state !== facility.state) {
    next.state = patch.state
    changed = true
  }
  if (patch.category !== undefined && patch.category !== facility.category) {
    next.category = patch.category
    changed = true
  }
  if (patch.floor !== undefined && patch.floor !== (facility.floor ?? 'ground')) {
    next.floor = patch.floor
    changed = true
  }
  if (patch.notes !== undefined) {
    const cleaned = patch.notes === null ? undefined : patch.notes.trim() || undefined
    if (cleaned !== facility.notes) {
      if (cleaned === undefined) delete next.notes
      else next.notes = cleaned
      changed = true
    }
  }
  if (!changed) return { ok: true, bastion }

  const facilities = [...bastion.facilities]
  facilities[idx] = next
  return { ok: true, bastion: { ...bastion, facilities } }
}

export interface RemoveFacilityOptions {
  /** Refund a portion of the build cost back to the treasury. Defaults to 0. */
  refundGp?: number
  /** Reason string used in the log entry (defaults to "demolished"). */
  reason?: string
}

export function removeFacility(
  bastion: Bastion,
  id: string,
  opts: RemoveFacilityOptions = {},
): Bastion {
  const facility = bastion.facilities.find((f) => f.id === id)
  if (!facility) return bastion

  const facilities = bastion.facilities.filter((f) => f.id !== id)

  // Drop the linked hireling, if any — the role only existed to staff this room.
  let hirelings = bastion.hirelings
  if (facility.hirelingId) {
    hirelings = bastion.hirelings.filter((h) => h.id !== facility.hirelingId)
  }

  const refund = Math.max(0, Math.trunc(opts.refundGp ?? 0))
  const reason = opts.reason ?? 'demolished'
  const log: LogEntry = {
    id: newId(),
    week: bastion.inGameWeek,
    actor: id,
    type: 'system',
    outcome:
      `${facility.name} ${reason}.` +
      (refund > 0 ? ` Treasury refund: ${refund} gp.` : ''),
    payload: {
      removedFacility: id,
      refund,
      droppedHireling: facility.hirelingId,
    },
  }

  return {
    ...bastion,
    facilities,
    hirelings,
    treasury: bastion.treasury + refund,
    log: [...bastion.log, log],
  }
}
