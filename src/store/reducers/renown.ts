import type { Bastion, LogEntry } from '../../types'
import { newId } from '../../lib/id'

export function adjustDomainRenown(
  bastion: Bastion,
  delta: number,
  reason?: string,
): Bastion {
  if (!Number.isFinite(delta)) return bastion
  const integer = Math.trunc(delta)
  if (integer === 0) return bastion

  const before = bastion.domain.renown
  const next = Math.max(0, before + integer)
  if (next === before) return bastion

  const actual = next - before
  const sign = actual > 0 ? '+' : ''
  const reasonSuffix = reason && reason.trim() ? ` (${reason.trim()})` : ''
  const log: LogEntry = {
    id: newId(),
    week: bastion.inGameWeek,
    type: 'system',
    outcome: `Domain renown ${sign}${actual} → ${next}${reasonSuffix}.`,
    payload: { delta: actual, before, after: next, reason: reason?.trim() },
  }
  return {
    ...bastion,
    domain: { ...bastion.domain, renown: next },
    log: [...bastion.log, log],
  }
}
