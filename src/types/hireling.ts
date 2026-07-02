export type HirelingLoyalty = 'loyal' | 'wavering' | 'bribed' | 'lost'

export interface Hireling {
  id: string
  name: string
  role: string
  facilityId: string
  loyalty: HirelingLoyalty
  salaryGp: number
  notes?: string
}
