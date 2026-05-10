import type { CatalogueEntry, Size } from '../types'

export type { CatalogueEntry } from '../types'

// Adding Basic Facilities — DMG (2024) Ch. 8.
export const SIZE_COSTS: Record<Size, { cost: number; days: number }> = {
  cramped: { cost: 500, days: 20 },
  roomy: { cost: 1000, days: 45 },
  vast: { cost: 3000, days: 125 },
}

// Canonical DMG basic facilities. Specials and homebrew rooms live elsewhere —
// specials are gained on level-up; homebrew rooms are stored on each bastion.
export const BASIC_FACILITIES_CATALOGUE: CatalogueEntry[] = [
  { id: 'bedroom', name: 'Bedroom', class: 'basic', category: 'quarters', sizes: ['cramped', 'roomy', 'vast'] },
  { id: 'dining-room', name: 'Dining Room', class: 'basic', category: 'social', sizes: ['cramped', 'roomy', 'vast'] },
  { id: 'parlor', name: 'Parlor', class: 'basic', category: 'social', sizes: ['cramped', 'roomy', 'vast'] },
  { id: 'courtyard', name: 'Courtyard', class: 'basic', category: 'social', sizes: ['cramped', 'roomy', 'vast'] },
  { id: 'kitchen', name: 'Kitchen', class: 'basic', category: 'production', sizes: ['cramped', 'roomy', 'vast'] },
  { id: 'storage', name: 'Storage', class: 'basic', category: 'storage', sizes: ['cramped', 'roomy', 'vast'] },
]

export function lookupCatalogueEntry(id: string): CatalogueEntry | undefined {
  return BASIC_FACILITIES_CATALOGUE.find((e) => e.id === id)
}

/** Look up a catalogue entry, preferring per-bastion homebrew over canonical basics. */
export function findCatalogueEntry(
  id: string,
  customs?: CatalogueEntry[],
): CatalogueEntry | undefined {
  return customs?.find((e) => e.id === id) ?? lookupCatalogueEntry(id)
}

/** Resolve {cost, days} for a (size on a) catalogue entry, honouring overrides. */
export function getSizeCost(
  entry: CatalogueEntry,
  size: Size,
): { cost: number; days: number } {
  return entry.costOverride?.[size] ?? SIZE_COSTS[size]
}
