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

export const RENOWN_THRESHOLDS = [3, 6, 9, 12] as const

export function nextRenownThreshold(renown: number): number | null {
  for (const t of RENOWN_THRESHOLDS) {
    if (renown < t) return t
  }
  return null
}

export function weeksSinceIntrigue(
  currentWeek: number,
  lastIntrigueEndedWeek: number | undefined,
): number | null {
  if (lastIntrigueEndedWeek === undefined) return null
  return Math.max(0, currentWeek - lastIntrigueEndedWeek)
}

export function formatWeeksSinceIntrigue(weeks: number | null): string {
  if (weeks === null) return 'No intrigue yet'
  if (weeks === 0) return 'Intrigue ended this week'
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} since last intrigue`
}

export function followerSlotsUnlocked(domainRenown: number): number {
  return RENOWN_THRESHOLDS.filter((t) => domainRenown >= t).length
}

export interface FollowerSlotUsage {
  unlocked: number
  used: number
  free: number
}

export function followerSlotUsage(
  followers: { source: 'renown' | 'stronghold' }[],
  domainRenown: number,
): FollowerSlotUsage {
  const unlocked = followerSlotsUnlocked(domainRenown)
  const used = followers.filter((f) => f.source === 'renown').length
  return { unlocked, used, free: Math.max(0, unlocked - used) }
}
