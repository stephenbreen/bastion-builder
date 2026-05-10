import type { Bastion, PC, PCAbility } from '../../types'
import { newId } from '../../lib/id'

export interface PCInput {
  name: string
  class: string
  level: number
  player?: string
  facilityId?: string
  abilityScores?: Partial<Record<PCAbility, number>>
  notes?: string
}

export type PCPatch = Partial<PCInput>

export type PCResult =
  | { ok: true; bastion: Bastion; pc: PC }
  | { ok: false; bastion: Bastion; reason: string }

const MIN_LEVEL = 1
const MAX_LEVEL = 20

function normaliseLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_LEVEL
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.trunc(level)))
}

function trimOrUndefined(s?: string): string | undefined {
  const t = s?.trim()
  return t ? t : undefined
}

function normaliseScores(
  raw: Partial<Record<PCAbility, number>> | undefined,
): Partial<Record<PCAbility, number>> | undefined {
  if (!raw) return undefined
  const out: Partial<Record<PCAbility, number>> = {}
  for (const k of Object.keys(raw) as PCAbility[]) {
    const v = raw[k]
    if (v === undefined || !Number.isFinite(v)) continue
    out[k] = Math.trunc(v)
  }
  return Object.keys(out).length === 0 ? undefined : out
}

function buildPc(id: string, input: PCInput): PC {
  return {
    id,
    name: input.name.trim(),
    class: input.class.trim() || 'Adventurer',
    level: normaliseLevel(input.level),
    ...(trimOrUndefined(input.player) ? { player: trimOrUndefined(input.player)! } : {}),
    ...(trimOrUndefined(input.facilityId)
      ? { facilityId: trimOrUndefined(input.facilityId)! }
      : {}),
    ...(normaliseScores(input.abilityScores)
      ? { abilityScores: normaliseScores(input.abilityScores)! }
      : {}),
    ...(trimOrUndefined(input.notes) ? { notes: trimOrUndefined(input.notes)! } : {}),
  }
}

export function addPc(bastion: Bastion, input: PCInput): PCResult {
  if (!input.name.trim()) {
    return { ok: false, bastion, reason: 'PC name is required.' }
  }
  const id = `pc-${newId().slice(0, 8)}`
  const pc = buildPc(id, input)
  return {
    ok: true,
    pc,
    bastion: { ...bastion, pcs: [...(bastion.pcs ?? []), pc] },
  }
}

export function updatePc(bastion: Bastion, id: string, patch: PCPatch): PCResult {
  const list = bastion.pcs ?? []
  const idx = list.findIndex((p) => p.id === id)
  if (idx === -1) {
    return { ok: false, bastion, reason: `Unknown PC: ${id}` }
  }
  const existing = list[idx]
  const merged: PCInput = {
    name: patch.name ?? existing.name,
    class: patch.class ?? existing.class,
    level: patch.level ?? existing.level,
    player: patch.player ?? existing.player,
    facilityId: patch.facilityId ?? existing.facilityId,
    abilityScores: patch.abilityScores ?? existing.abilityScores,
    notes: patch.notes ?? existing.notes,
  }
  if (!merged.name.trim()) {
    return { ok: false, bastion, reason: 'PC name is required.' }
  }
  const next = buildPc(id, merged)
  const pcs = [...list]
  pcs[idx] = next
  return { ok: true, pc: next, bastion: { ...bastion, pcs } }
}

export function removePc(bastion: Bastion, id: string): Bastion {
  const list = bastion.pcs ?? []
  const next = list.filter((p) => p.id !== id)
  if (next.length === list.length) return bastion
  return { ...bastion, pcs: next.length === 0 ? undefined : next }
}
