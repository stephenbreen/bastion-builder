export const PC_ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const
export type PCAbility = (typeof PC_ABILITIES)[number]

export interface PC {
  id: string
  name: string
  /** Free-form class label — covers homebrew without forcing the Aspect list. */
  class: string
  /** 1–20. Stored as a number so simple +/- edits stay clean. */
  level: number
  /** Optional ability scores. Stored as a partial map so DMs can fill them in over time. */
  abilityScores?: Partial<Record<PCAbility, number>>
  /** Optional player name, for tables where PCs map clearly to players. */
  player?: string
  /** Optional facility id — e.g. the room this PC is stationed at this week. */
  facilityId?: string
  notes?: string
}
