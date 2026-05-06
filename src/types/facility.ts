export type Size = 'cramped' | 'roomy' | 'vast'

export type FacilityClass = 'basic' | 'special'

export type OrderType =
  | 'Craft'
  | 'Empower'
  | 'Harvest'
  | 'Maintain'
  | 'Recruit'
  | 'Research'
  | 'Trade'

export type FacilityState =
  | 'active'
  | 'damaged'
  | 'disabled'
  | 'under-construction'

export type DomainSkill =
  | 'diplomacy'
  | 'espionage'
  | 'lore'
  | 'operations'

export interface DomainSkillBoost {
  skill: DomainSkill
  amount: number
}

export interface Facility {
  id: string
  name: string
  class: FacilityClass
  size: Size
  count?: number
  cost: number
  buildTimeDays: number
  orders: OrderType[]
  tierUnlock?: 1 | 2 | 3 | 4 | 5
  hirelingId?: string
  state: FacilityState
  daysRemaining?: number
  domainSkillBoosts?: DomainSkillBoost[]
  notes?: string
}
