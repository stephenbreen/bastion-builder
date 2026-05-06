import type { Facility } from './facility'
import type { Hireling } from './hireling'
import type { LogEntry } from './log'

export type Aspect =
  | 'Bard'
  | 'Wizard'
  | 'Paladin'
  | 'Cleric'
  | 'Druid'
  | 'Fighter'
  | 'Rogue'
  | 'Ranger'
  | 'Sorcerer'
  | 'Warlock'
  | 'Barbarian'
  | 'Monk'
  | 'Artificer'

export interface Bastion {
  name: string
  aspect: Aspect
  strongholdLevel: 1 | 2 | 3 | 4 | 5
  treasury: number
  inGameWeek: number
  facilities: Facility[]
  hirelings: Hireling[]
  log: LogEntry[]
}
