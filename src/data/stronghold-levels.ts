import type { Aspect } from '../types'

export type StrongholdClass = 'keep' | 'tower' | 'temple' | 'establishment'

export interface UpgradeCost {
  /** gp cost to step into the keyed level. */
  gp: number
  /** in-game days the upgrade takes (S&F p. 16). Used for narrative reference. */
  days: number
}

/** Cost & time per stronghold class to step from L(n-1) to Ln. Indexed at 2..5. */
export const STRONGHOLD_UPGRADE_COSTS: Record<
  StrongholdClass,
  Record<2 | 3 | 4 | 5, UpgradeCost>
> = {
  keep: {
    2: { gp: 5_000, days: 50 },
    3: { gp: 10_000, days: 100 },
    4: { gp: 15_000, days: 150 },
    5: { gp: 20_000, days: 200 },
  },
  tower: {
    2: { gp: 3_000, days: 40 },
    3: { gp: 6_000, days: 80 },
    4: { gp: 12_000, days: 120 },
    5: { gp: 18_000, days: 160 },
  },
  temple: {
    2: { gp: 3_000, days: 40 },
    3: { gp: 6_000, days: 80 },
    4: { gp: 12_000, days: 120 },
    5: { gp: 18_000, days: 160 },
  },
  establishment: {
    2: { gp: 2_000, days: 30 },
    3: { gp: 4_000, days: 60 },
    4: { gp: 6_000, days: 90 },
    5: { gp: 8_000, days: 120 },
  },
}

/**
 * Map an Aspect to its underlying S&F stronghold class. Aspect labels
 * include the parenthetical (e.g. "Lodge (Keep variant)"); we collapse
 * them down to the four base classes for cost-ladder purposes.
 */
export const ASPECT_STRONGHOLD_CLASS: Record<Aspect, StrongholdClass> = {
  Bard: 'establishment',
  Wizard: 'tower',
  Paladin: 'temple',
  Cleric: 'temple',
  Druid: 'temple',
  Fighter: 'keep',
  Rogue: 'establishment',
  Ranger: 'keep',
  Sorcerer: 'tower',
  Warlock: 'tower',
  Barbarian: 'keep',
  Monk: 'temple',
  Artificer: 'tower',
}

export interface UpgradeQuote {
  fromLevel: 1 | 2 | 3 | 4
  toLevel: 2 | 3 | 4 | 5
  cost: UpgradeCost
  strongholdClass: StrongholdClass
}

/** Returns the cost & target level for the next upgrade, or null at L5. */
export function quoteNextUpgrade(
  aspect: Aspect,
  currentLevel: 1 | 2 | 3 | 4 | 5,
): UpgradeQuote | null {
  if (currentLevel >= 5) return null
  const cls = ASPECT_STRONGHOLD_CLASS[aspect]
  const fromLevel = currentLevel as 1 | 2 | 3 | 4
  const toLevel = (currentLevel + 1) as 2 | 3 | 4 | 5
  return {
    fromLevel,
    toLevel,
    cost: STRONGHOLD_UPGRADE_COSTS[cls][toLevel],
    strongholdClass: cls,
  }
}
