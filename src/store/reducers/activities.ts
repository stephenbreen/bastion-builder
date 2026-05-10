import type { Bastion, LogEntry } from '../../types'
import { newId } from '../../lib/id'
import { defaultRng, type Rng } from '../../lib/dice'
import { lookupActivity } from '../../data/xanathar-activities'

export interface RecordActivityInput {
  activityId: string
  roller: string
  outcome: string
  /** When true, the reducer rolls the activity's complication die for you. */
  rollComplication?: boolean
}

export interface RecordedComplication {
  roll: number
  text: string
}

export type RecordActivityResult =
  | {
      ok: true
      bastion: Bastion
      complication: RecordedComplication | null
    }
  | { ok: false; bastion: Bastion; reason: string }

function rollDie(sides: number, rng: Rng): number {
  return Math.floor(rng() * sides) + 1
}

export function recordActivity(
  bastion: Bastion,
  input: RecordActivityInput,
  rng: Rng = defaultRng,
): RecordActivityResult {
  const activity = lookupActivity(input.activityId)
  if (!activity) {
    return { ok: false, bastion, reason: `Unknown activity: ${input.activityId}.` }
  }

  const roller = input.roller.trim() || 'unattributed'
  const outcome = input.outcome.trim()

  let complication: RecordedComplication | null = null
  if (input.rollComplication) {
    const roll = rollDie(activity.complicationDie, rng)
    const entry = activity.complications.find((c) => c.roll === roll)
    complication = { roll, text: entry?.text ?? 'No table entry.' }
  }

  const summary =
    `${activity.name} — ${roller}` +
    (outcome ? `: ${outcome}` : '') +
    (complication
      ? ` · Complication d${activity.complicationDie}=${complication.roll}: ${complication.text}`
      : '')

  const log: LogEntry = {
    id: newId(),
    week: bastion.inGameWeek,
    type: 'xanathar-activity',
    actor: input.activityId,
    outcome: summary,
    payload: {
      activityId: input.activityId,
      roller,
      outcome: outcome || undefined,
      complication,
    },
  }

  return {
    ok: true,
    complication,
    bastion: {
      ...bastion,
      log: [...bastion.log, log],
    },
  }
}
