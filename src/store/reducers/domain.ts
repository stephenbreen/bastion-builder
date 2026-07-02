import type {
  Bastion,
  Domain,
  DomainDefense,
  DomainSize,
  LogEntry,
} from '../../types'
import { DOMAIN_DEFENSE_MAX, DOMAIN_DEFENSE_MIN } from '../../types'
import { newId } from '../../lib/id'

function logEntry(week: number, outcome: string, payload?: Record<string, unknown>): LogEntry {
  return { id: newId(), week, type: 'system', outcome, payload }
}

export function setDomainSize(bastion: Bastion, target: number): Bastion {
  const trunc = Math.trunc(target)
  if (!Number.isFinite(trunc)) return bastion
  const clamped = Math.max(1, Math.min(5, trunc)) as DomainSize
  if (clamped === bastion.domain.size) return bastion

  return {
    ...bastion,
    domain: { ...bastion.domain, size: clamped },
    log: [
      ...bastion.log,
      logEntry(
        bastion.inGameWeek,
        `Domain size ${bastion.domain.size} → ${clamped}.`,
        { from: bastion.domain.size, to: clamped },
      ),
    ],
  }
}

export function setDomainDefense(
  bastion: Bastion,
  defense: DomainDefense,
  value: number,
): Bastion {
  const trunc = Math.trunc(value)
  if (!Number.isFinite(trunc)) return bastion
  const clamped = Math.max(DOMAIN_DEFENSE_MIN, Math.min(DOMAIN_DEFENSE_MAX, trunc))
  const before = bastion.domain.defenses[defense]
  if (clamped === before) return bastion

  const sign = clamped >= before ? '+' : ''
  return {
    ...bastion,
    domain: {
      ...bastion.domain,
      defenses: { ...bastion.domain.defenses, [defense]: clamped },
    },
    log: [
      ...bastion.log,
      logEntry(
        bastion.inGameWeek,
        `Defense ${defense}: ${before} → ${sign}${clamped - before === 0 ? clamped : clamped}.`,
        { defense, before, after: clamped },
      ),
    ],
  }
}

export function adjustDomainDefense(
  bastion: Bastion,
  defense: DomainDefense,
  delta: number,
): Bastion {
  return setDomainDefense(bastion, defense, bastion.domain.defenses[defense] + delta)
}

export function beginIntrigue(bastion: Bastion): Bastion {
  if (bastion.domain.intrigueActive) return bastion
  const turns = 4 + bastion.domain.size
  return {
    ...bastion,
    domain: {
      ...bastion.domain,
      intrigueActive: true,
      intrigueTurnsRemaining: turns,
    },
    log: [
      ...bastion.log,
      {
        id: newId(),
        week: bastion.inGameWeek,
        type: 'intrigue-turn',
        outcome: `Intrigue begins — ${turns} turns (4 + size ${bastion.domain.size}).`,
        payload: { event: 'begin', turns, size: bastion.domain.size },
      },
    ],
  }
}

export function endIntrigue(bastion: Bastion): Bastion {
  if (!bastion.domain.intrigueActive) return bastion
  return {
    ...bastion,
    domain: {
      ...bastion.domain,
      intrigueActive: false,
      intrigueTurnsRemaining: 0,
      lastIntrigueEndedWeek: bastion.inGameWeek,
    },
    log: [
      ...bastion.log,
      {
        id: newId(),
        week: bastion.inGameWeek,
        type: 'intrigue-turn',
        outcome: 'Intrigue concluded — defenses will drift toward 0.',
        payload: { event: 'end' },
      },
    ],
  }
}

// Re-export for convenience.
export type { Domain }
