import type { Bastion, WeeklyCosts } from '../types'
import { emptyWeeklyCosts } from '../types'

export interface CostLine {
  key: string
  label: string
  amount: number
  /** True when the value is computed (e.g. hireling salary sum) and not directly editable. */
  computed?: boolean
  detail?: string
}

export interface WeeklyTotal {
  costs: WeeklyCosts
  hirelingTotal: number
  total: number
  lines: CostLine[]
}

export function getWeeklyCosts(bastion: Bastion): WeeklyCosts {
  return bastion.weeklyCosts ?? emptyWeeklyCosts()
}

export function computeHirelingSalaries(bastion: Bastion): number {
  return bastion.hirelings.reduce((sum, h) => sum + (h.salaryGp ?? 0), 0)
}

export function computeWeeklyTotal(bastion: Bastion): WeeklyTotal {
  const costs = getWeeklyCosts(bastion)
  const hirelingTotal = computeHirelingSalaries(bastion)

  const lines: CostLine[] = [
    {
      key: 'partyLifestyle',
      label: 'Party lifestyle',
      amount: costs.partyLifestyle,
      detail: 'Per-PC living + retainers',
    },
    {
      key: 'hirelings',
      label: 'Hireling salaries',
      amount: hirelingTotal,
      computed: true,
      detail: `Auto-summed from ${bastion.hirelings.length} hireling${bastion.hirelings.length === 1 ? '' : 's'}`,
    },
    {
      key: 'defenderUpkeep',
      label: 'Defender upkeep',
      amount: costs.defenderUpkeep,
      detail: 'Bastion Defenders + retainer pay',
    },
    {
      key: 'miscellaneous',
      label: 'Miscellaneous',
      amount: costs.miscellaneous,
      detail: 'Catch-all weekly outlays',
    },
  ]

  const total = lines.reduce((s, l) => s + l.amount, 0)
  return { costs, hirelingTotal, total, lines }
}
