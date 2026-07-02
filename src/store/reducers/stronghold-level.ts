import type { Bastion, LogEntry } from '../../types'
import {
  quoteNextUpgrade,
  type UpgradeQuote,
} from '../../data/stronghold-levels'
import { newId } from '../../lib/id'

export type LevelUpResult =
  | { ok: true; bastion: Bastion; quote: UpgradeQuote }
  | { ok: false; bastion: Bastion; reason: string }

/**
 * Apply the next stronghold level immediately: deducts the gp cost, bumps
 * strongholdLevel, and logs a system entry that nudges the DM to roll on
 * the Aspect's class follower table (S&F ch. 7). The S&F days-to-build
 * value is included in the log for narrative reference but doesn't gate
 * the level change — DMs can interpret that downtime as in-fiction
 * however they want without blocking gameplay state.
 */
export function levelUpStronghold(bastion: Bastion): LevelUpResult {
  const quote = quoteNextUpgrade(bastion.aspect, bastion.strongholdLevel)
  if (!quote) {
    return {
      ok: false,
      bastion,
      reason: 'Stronghold is already at the highest level (5).',
    }
  }
  if (bastion.treasury < quote.cost.gp) {
    return {
      ok: false,
      bastion,
      reason: `Insufficient treasury (${bastion.treasury} < ${quote.cost.gp} gp).`,
    }
  }

  const log: LogEntry = {
    id: newId(),
    week: bastion.inGameWeek,
    type: 'system',
    outcome:
      `Stronghold upgraded: L${quote.fromLevel} → L${quote.toLevel} ` +
      `(${quote.cost.gp} gp, ~${quote.cost.days} days). ` +
      `Roll on the ${bastion.aspect} class follower table to grant a follower.`,
    payload: {
      from: quote.fromLevel,
      to: quote.toLevel,
      cost: quote.cost.gp,
      days: quote.cost.days,
      strongholdClass: quote.strongholdClass,
    },
  }

  return {
    ok: true,
    quote,
    bastion: {
      ...bastion,
      strongholdLevel: quote.toLevel,
      treasury: bastion.treasury - quote.cost.gp,
      log: [...bastion.log, log],
    },
  }
}
