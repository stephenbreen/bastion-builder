import type { Aspect, Bastion, LogEntry } from '../../types'
import { ASPECT_LIST } from '../../types'
import { newId } from '../../lib/id'

// Per REQUIREMENTS §4: 500 gp + 1 in-game week of downtime, no roll.
export const ASPECT_SWITCH_COST = 500

export type SwitchAspectResult =
  | { ok: true; bastion: Bastion }
  | { ok: false; bastion: Bastion; reason: string }

export function switchAspect(bastion: Bastion, target: Aspect): SwitchAspectResult {
  if (!ASPECT_LIST.includes(target)) {
    return { ok: false, bastion, reason: `Unknown Aspect: ${target}.` }
  }
  if (target === bastion.aspect) {
    return { ok: false, bastion, reason: `Already aligned with the ${target} Aspect.` }
  }
  if (bastion.pendingAspect) {
    return {
      ok: false,
      bastion,
      reason: `An Aspect switch to ${bastion.pendingAspect.aspect} is already in progress.`,
    }
  }
  if (bastion.treasury < ASPECT_SWITCH_COST) {
    return {
      ok: false,
      bastion,
      reason: `Insufficient treasury (need ${ASPECT_SWITCH_COST} gp).`,
    }
  }

  const log: LogEntry = {
    id: newId(),
    week: bastion.inGameWeek,
    type: 'system',
    outcome: `Aspect switch initiated: ${bastion.aspect} → ${target} (${ASPECT_SWITCH_COST} gp). Effective next week.`,
    payload: { from: bastion.aspect, to: target, cost: ASPECT_SWITCH_COST },
  }

  return {
    ok: true,
    bastion: {
      ...bastion,
      treasury: bastion.treasury - ASPECT_SWITCH_COST,
      pendingAspect: { aspect: target, queuedAtWeek: bastion.inGameWeek },
      log: [...bastion.log, log],
    },
  }
}

export function cancelAspectSwitch(bastion: Bastion): Bastion {
  if (!bastion.pendingAspect) return bastion

  const cancelled = bastion.pendingAspect.aspect
  const { pendingAspect: _drop, ...rest } = bastion
  const log: LogEntry = {
    id: newId(),
    week: bastion.inGameWeek,
    type: 'system',
    outcome: `Aspect switch cancelled (${cancelled} reverted). ${ASPECT_SWITCH_COST} gp refunded.`,
    payload: { cancelled, refund: ASPECT_SWITCH_COST },
  }

  return {
    ...rest,
    treasury: rest.treasury + ASPECT_SWITCH_COST,
    log: [...rest.log, log],
  }
}
