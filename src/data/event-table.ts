// Bastion Events table — DMG (2024) Ch. 8.
// Each entry covers an inclusive d100 range; "00" on the dice = 100.

export type BastionEventName =
  | 'All Is Well'
  | 'Attack'
  | 'Criminal Hireling'
  | 'Extraordinary Opportunity'
  | 'Friendly Visitors'
  | 'Guest'
  | 'Lost Hirelings'
  | 'Magical Discovery'
  | 'Refugees'
  | 'Request for Aid'
  | 'Treasure'

export interface BastionEvent {
  name: BastionEventName
  range: [number, number] // inclusive
  description: string
}

export const BASTION_EVENT_TABLE: BastionEvent[] = [
  {
    name: 'All Is Well',
    range: [1, 50],
    description: 'Nothing of consequence — DM may roll d8 for colour.',
  },
  {
    name: 'Attack',
    range: [51, 55],
    description:
      'A hostile force attacks; roll 6d6, each 1 kills a Bastion Defender. No defenders → a random special facility is damaged for 1 turn.',
  },
  {
    name: 'Criminal Hireling',
    range: [56, 58],
    description:
      'Officials arrive with a warrant for one hireling. Pay 1d6×100 GP bribe to keep them, otherwise they are arrested.',
  },
  {
    name: 'Extraordinary Opportunity',
    range: [59, 63],
    description:
      'Festival, patronage, or noble favour. Pay 500 GP to roll again on the events table for a bonus event.',
  },
  {
    name: 'Friendly Visitors',
    range: [64, 72],
    description:
      'Visitors pay 1d6×100 GP to use one of your special facilities briefly; does not interrupt orders.',
  },
  {
    name: 'Guest',
    range: [73, 76],
    description: 'A friendly guest stays at the Bastion. Roll 1d4 on the Guest table.',
  },
  {
    name: 'Lost Hirelings',
    range: [77, 79],
    description:
      'A random special facility loses its hirelings; cannot be used next turn, then replaced free.',
  },
  {
    name: 'Magical Discovery',
    range: [80, 83],
    description:
      'Hirelings discover or accidentally craft an Uncommon Potion or Scroll of your choice, free.',
  },
  {
    name: 'Refugees',
    range: [84, 91],
    description:
      '2d4 refugees seek shelter and offer 1d6×100 GP. They stay until rehoused or the Bastion is attacked.',
  },
  {
    name: 'Request for Aid',
    range: [92, 98],
    description:
      'A local leader asks for help. Send Bastion Defenders, roll 1d6 each — total ≥10 succeeds (full reward), <10 still solves it but reward halved and one Defender dies.',
  },
  {
    name: 'Treasure',
    range: [99, 100],
    description: 'An art object or magic item arrives. Roll on the Treasure sub-table.',
  },
]

export function lookupEvent(roll: number): BastionEvent {
  for (const event of BASTION_EVENT_TABLE) {
    if (roll >= event.range[0] && roll <= event.range[1]) return event
  }
  throw new Error(`Roll ${roll} is outside the d100 event table (1–100).`)
}
