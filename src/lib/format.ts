const gpFormatter = new Intl.NumberFormat('en-GB')

export function formatGp(amount: number): string {
  return `${gpFormatter.format(amount)} gp`
}

export function totalInvested(facilities: { cost: number; count?: number }[]): number {
  return facilities.reduce((sum, f) => sum + f.cost * (f.count ?? 1), 0)
}

export function specialSlotsTotal(strongholdLevel: 1 | 2 | 3 | 4 | 5): number {
  return strongholdLevel + 1
}
