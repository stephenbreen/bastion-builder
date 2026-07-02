import type {
  Bastion,
  Domain,
  DomainDefense,
  Facility,
  LogEntry,
} from '../../types'
import { DOMAIN_DEFENSES } from '../../types'
import { newId } from '../../lib/id'
import { defaultRng, rollD100, type Rng } from '../../lib/dice'
import { lookupEvent } from '../../data/event-table'
import { computeWeeklyTotal } from '../../lib/costs'

const DAYS_PER_WEEK = 7

export function advanceWeek(bastion: Bastion, rng: Rng = defaultRng): Bastion {
  const newWeek = bastion.inGameWeek + 1
  const newLogs: LogEntry[] = []

  // Resolve a pending Aspect switch first — it doesn't depend on facilities.
  let working: Bastion = bastion
  if (bastion.pendingAspect) {
    const incoming = bastion.pendingAspect.aspect
    newLogs.push({
      id: newId(),
      week: newWeek,
      type: 'system',
      outcome: `Aspect switch complete: ${bastion.aspect} → ${incoming}.`,
      payload: { from: bastion.aspect, to: incoming },
    })
    const { pendingAspect: _drop, ...rest } = bastion
    working = { ...rest, aspect: incoming }
  }

  // Deduct weekly costs (warn-and-allow — treasury can go negative).
  const weeklyTotal = computeWeeklyTotal(working)
  if (weeklyTotal.total > 0) {
    const newTreasury = working.treasury - weeklyTotal.total
    const breakdown = weeklyTotal.lines
      .filter((l) => l.amount > 0)
      .map((l) => `${l.label} ${l.amount}`)
      .join(', ')
    newLogs.push({
      id: newId(),
      week: newWeek,
      type: 'system',
      outcome:
        `Weekly costs −${weeklyTotal.total} gp` +
        (breakdown ? ` (${breakdown})` : '') +
        `. Treasury: ${working.treasury} → ${newTreasury}` +
        (newTreasury < 0 ? ' (in arrears)' : '') +
        '.',
      payload: {
        total: weeklyTotal.total,
        before: working.treasury,
        after: newTreasury,
        lines: weeklyTotal.lines,
      },
    })
    working = { ...working, treasury: newTreasury }
  }

  const facilities = working.facilities.map((f) =>
    tickFacility(f, newWeek, newLogs, rng),
  )

  // Tick the domain layer: intrigue counter when active, defense drift when
  // not. They are mutually exclusive — the moment an intrigue auto-ends, this
  // tick is its concluding turn; drift starts on the next call.
  const domain = tickDomain(working.domain, newWeek, newLogs)

  return {
    ...working,
    inGameWeek: newWeek,
    facilities,
    domain,
    log: [...bastion.log, ...newLogs],
  }
}

function tickDomain(domain: Domain, newWeek: number, logs: LogEntry[]): Domain {
  if (domain.intrigueActive) {
    const remaining = domain.intrigueTurnsRemaining - 1
    if (remaining <= 0) {
      logs.push({
        id: newId(),
        week: newWeek,
        type: 'intrigue-turn',
        outcome: 'Intrigue concluded — defenses will drift toward 0.',
        payload: { event: 'auto-end' },
      })
      return {
        ...domain,
        intrigueActive: false,
        intrigueTurnsRemaining: 0,
        lastIntrigueEndedWeek: newWeek,
      }
    }
    logs.push({
      id: newId(),
      week: newWeek,
      type: 'intrigue-turn',
      outcome: `Intrigue turn — ${remaining} turns remaining.`,
      payload: { event: 'tick', remaining },
    })
    return { ...domain, intrigueTurnsRemaining: remaining }
  }

  // Drift each defense one step toward 0.
  const drifted: Record<DomainDefense, number> = { ...domain.defenses }
  const drifts: { defense: DomainDefense; from: number; to: number }[] = []
  for (const defense of DOMAIN_DEFENSES) {
    const value = drifted[defense]
    if (value === 0) continue
    const next = value > 0 ? value - 1 : value + 1
    drifted[defense] = next
    drifts.push({ defense, from: value, to: next })
  }
  if (drifts.length === 0) return domain

  logs.push({
    id: newId(),
    week: newWeek,
    type: 'system',
    outcome:
      'Defenses drift toward 0: ' +
      drifts.map((d) => `${d.defense} ${d.from}→${d.to}`).join(', ') +
      '.',
    payload: { drifts },
  })
  return { ...domain, defenses: drifted }
}

function tickFacility(
  facility: Facility,
  newWeek: number,
  logs: LogEntry[],
  rng: Rng,
): Facility {
  let next = facility

  // Resolve any pending order on an active facility, then clear the choice.
  // setOrder already prevents non-active facilities from holding an order, but
  // we re-check here to make the reducer total — defending against any future
  // path that bypasses the action.
  if (next.state === 'active' && next.pendingOrder) {
    const issuedOrder = next.pendingOrder
    logs.push({
      id: newId(),
      week: newWeek,
      actor: next.id,
      type: 'bastion-order',
      outcome: `${next.name}: ${issuedOrder} order issued.`,
      payload: { order: issuedOrder, hirelingId: next.hirelingId ?? null },
    })

    // DMG: each Maintain order issued this turn triggers one roll on the
    // Bastion Events table. Phase 1 logs the result narratively — the DM
    // resolves any mechanical follow-up at the table.
    if (issuedOrder === 'Maintain') {
      const roll = rollD100(rng)
      const event = lookupEvent(roll)
      logs.push({
        id: newId(),
        week: newWeek,
        actor: next.id,
        type: 'bastion-event',
        outcome: `Bastion event (rolled ${roll}): ${event.name} — ${event.description}`,
        payload: { roll, event: event.name, triggeredBy: next.id },
      })
    }

    const { pendingOrder: _drop, ...rest } = next
    next = rest
  }

  // Tick the build queue. A week burns 7 build days; completion flips state to
  // active and drops the daysRemaining field entirely.
  if (next.state === 'under-construction' && next.daysRemaining != null) {
    const remaining = next.daysRemaining - DAYS_PER_WEEK
    if (remaining <= 0) {
      const { daysRemaining: _drop, ...rest } = next
      next = { ...rest, state: 'active' }
      logs.push({
        id: newId(),
        week: newWeek,
        actor: next.id,
        type: 'construction',
        outcome: `${next.name} construction complete.`,
      })
    } else {
      next = { ...next, daysRemaining: remaining }
    }
  }

  return next
}
