import type {
  Bastion,
  CatalogueEntry,
  DomainSkillBoost,
  FacilityCategory,
  FacilityClass,
  OrderType,
  Size,
} from '../../types'
import { FACILITY_CATEGORIES } from '../../types'
import { newId } from '../../lib/id'

/**
 * Per-size cost overrides. The form may produce a partial object, e.g. only
 * cramped is overridden — sizes without an entry fall back to SIZE_COSTS.
 */
export type CostOverrideMap = Partial<Record<Size, { cost: number; days: number }>>

/** Shape used by the authoring form. The reducer normalises and slugs. */
export interface HomebrewDraft {
  name: string
  class: FacilityClass
  category: FacilityCategory
  sizes: Size[]
  notes?: string
  costOverride?: CostOverrideMap
  orders?: OrderType[]
  domainSkillBoosts?: DomainSkillBoost[]
  hirelingLabel?: string
}

export type HomebrewPatch = Partial<HomebrewDraft>

export type HomebrewResult =
  | { ok: true; bastion: Bastion; entry: CatalogueEntry }
  | { ok: false; bastion: Bastion; reason: string }

const VALID_CLASSES: FacilityClass[] = ['basic', 'special']
const VALID_SIZES: Size[] = ['cramped', 'roomy', 'vast']

function makeHomebrewId(name: string): string {
  const slug =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'room'
  return `hb-${slug}-${newId().slice(0, 6)}`
}

/**
 * Strip empty/zero entries from an override map and clamp to non-negative
 * integers. Returns undefined when nothing remains.
 */
function normaliseCostOverride(
  raw: CostOverrideMap | undefined,
  allowedSizes: Size[],
): CostOverrideMap | undefined {
  if (!raw) return undefined
  const out: CostOverrideMap = {}
  for (const size of allowedSizes) {
    const v = raw[size]
    if (!v) continue
    const cost = Math.max(0, Math.trunc(Number(v.cost)))
    const days = Math.max(1, Math.trunc(Number(v.days)))
    if (!Number.isFinite(cost) || !Number.isFinite(days)) continue
    out[size] = { cost, days }
  }
  return Object.keys(out).length === 0 ? undefined : out
}

function normaliseDraft(draft: HomebrewDraft): { ok: true; clean: HomebrewDraft } | { ok: false; reason: string } {
  const name = draft.name.trim()
  if (!name) return { ok: false, reason: 'Name is required.' }
  if (!VALID_CLASSES.includes(draft.class)) {
    return { ok: false, reason: 'Class must be basic or special.' }
  }
  if (!FACILITY_CATEGORIES.includes(draft.category)) {
    return { ok: false, reason: 'Category is not recognised.' }
  }
  const sizes = VALID_SIZES.filter((s) => draft.sizes.includes(s))
  if (sizes.length === 0) {
    return { ok: false, reason: 'Pick at least one size.' }
  }

  const orders = draft.class === 'special' ? (draft.orders ?? []).slice() : undefined
  const domainSkillBoosts =
    draft.class === 'special' && draft.domainSkillBoosts && draft.domainSkillBoosts.length > 0
      ? draft.domainSkillBoosts
          .filter((b) => Number.isFinite(b.amount) && b.amount !== 0)
          .map((b) => ({ skill: b.skill, amount: Math.trunc(b.amount) }))
      : undefined
  const hirelingLabel =
    draft.class === 'special' && draft.hirelingLabel?.trim()
      ? draft.hirelingLabel.trim()
      : undefined
  const notes = draft.notes?.trim() || undefined
  const costOverride = normaliseCostOverride(draft.costOverride, sizes)

  return {
    ok: true,
    clean: {
      name,
      class: draft.class,
      category: draft.category,
      sizes,
      orders,
      domainSkillBoosts,
      hirelingLabel,
      notes,
      costOverride,
    },
  }
}

function toEntry(id: string, clean: HomebrewDraft): CatalogueEntry {
  return {
    id,
    name: clean.name,
    class: clean.class,
    category: clean.category,
    sizes: clean.sizes,
    homebrew: true,
    ...(clean.notes ? { notes: clean.notes } : {}),
    ...(clean.costOverride ? { costOverride: clean.costOverride } : {}),
    ...(clean.orders && clean.orders.length > 0 ? { orders: clean.orders } : {}),
    ...(clean.domainSkillBoosts && clean.domainSkillBoosts.length > 0
      ? { domainSkillBoosts: clean.domainSkillBoosts }
      : {}),
    ...(clean.hirelingLabel ? { hirelingLabel: clean.hirelingLabel } : {}),
  }
}

export function addCustomCatalogueEntry(
  bastion: Bastion,
  draft: HomebrewDraft,
): HomebrewResult {
  const result = normaliseDraft(draft)
  if (!result.ok) return { ok: false, bastion, reason: result.reason }
  const id = makeHomebrewId(result.clean.name)
  const entry = toEntry(id, result.clean)
  return {
    ok: true,
    entry,
    bastion: {
      ...bastion,
      customCatalogueEntries: [...(bastion.customCatalogueEntries ?? []), entry],
    },
  }
}

export function updateCustomCatalogueEntry(
  bastion: Bastion,
  id: string,
  patch: HomebrewPatch,
): HomebrewResult {
  const customs = bastion.customCatalogueEntries ?? []
  const existing = customs.find((e) => e.id === id)
  if (!existing) {
    return { ok: false, bastion, reason: `Unknown homebrew entry: ${id}` }
  }
  const merged: HomebrewDraft = {
    name: patch.name ?? existing.name,
    class: patch.class ?? existing.class,
    category: patch.category ?? existing.category,
    sizes: patch.sizes ?? existing.sizes,
    notes: patch.notes ?? existing.notes,
    costOverride: patch.costOverride ?? existing.costOverride,
    orders: patch.orders ?? existing.orders,
    domainSkillBoosts: patch.domainSkillBoosts ?? existing.domainSkillBoosts,
    hirelingLabel: patch.hirelingLabel ?? existing.hirelingLabel,
  }
  const result = normaliseDraft(merged)
  if (!result.ok) return { ok: false, bastion, reason: result.reason }
  const updated = toEntry(id, result.clean)
  return {
    ok: true,
    entry: updated,
    bastion: {
      ...bastion,
      customCatalogueEntries: customs.map((e) => (e.id === id ? updated : e)),
    },
  }
}

export function removeCustomCatalogueEntry(bastion: Bastion, id: string): Bastion {
  const customs = bastion.customCatalogueEntries
  if (!customs || customs.length === 0) return bastion
  const next = customs.filter((e) => e.id !== id)
  if (next.length === customs.length) return bastion
  return { ...bastion, customCatalogueEntries: next.length === 0 ? undefined : next }
}
