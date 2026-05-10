import { useEffect, useMemo, useState } from 'react'
import { useBastionStore } from '../store/useBastionStore'
import { usePlayerView } from '../lib/view-mode'
import { getSizeCost } from '../data/facility-catalogue'
import { formatGp } from '../lib/format'
import {
  DOMAIN_SKILLS,
  FACILITY_CATEGORIES,
  type CatalogueEntry,
  type DomainSkill,
  type FacilityCategory,
  type FacilityClass,
  type OrderType,
  type Size,
} from '../types'
import type {
  CostOverrideMap,
  HomebrewDraft,
} from '../store/reducers/homebrew-rooms'

const SIZES: Size[] = ['cramped', 'roomy', 'vast']
const ORDER_TYPES: OrderType[] = [
  'Craft',
  'Empower',
  'Harvest',
  'Maintain',
  'Recruit',
  'Research',
  'Trade',
]

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface FormState {
  name: string
  class: FacilityClass
  category: FacilityCategory
  sizes: Set<Size>
  costOverride: Partial<Record<Size, { cost: string; days: string }>>
  orders: Set<OrderType>
  boosts: Record<DomainSkill, string>
  hirelingLabel: string
  notes: string
}

function emptyForm(): FormState {
  return {
    name: '',
    class: 'special',
    category: 'production',
    sizes: new Set(['roomy']),
    costOverride: {},
    orders: new Set(),
    boosts: { diplomacy: '', espionage: '', lore: '', operations: '' },
    hirelingLabel: '',
    notes: '',
  }
}

function entryToForm(entry: CatalogueEntry): FormState {
  const sizes = new Set<Size>(entry.sizes)
  const costOverride: FormState['costOverride'] = {}
  for (const s of SIZES) {
    const v = entry.costOverride?.[s]
    if (v) costOverride[s] = { cost: String(v.cost), days: String(v.days) }
  }
  const boosts: Record<DomainSkill, string> = {
    diplomacy: '',
    espionage: '',
    lore: '',
    operations: '',
  }
  for (const b of entry.domainSkillBoosts ?? []) {
    boosts[b.skill] = String(b.amount)
  }
  return {
    name: entry.name,
    class: entry.class,
    category: entry.category,
    sizes,
    costOverride,
    orders: new Set(entry.orders ?? []),
    boosts,
    hirelingLabel: entry.hirelingLabel ?? '',
    notes: entry.notes ?? '',
  }
}

function formToDraft(form: FormState): HomebrewDraft {
  const overrides: CostOverrideMap = {}
  for (const size of SIZES) {
    if (!form.sizes.has(size)) continue
    const v = form.costOverride[size]
    if (!v) continue
    if (v.cost === '' && v.days === '') continue
    const cost = Number(v.cost)
    const days = Number(v.days)
    if (Number.isFinite(cost) && Number.isFinite(days)) {
      overrides[size] = { cost, days }
    }
  }
  const boosts = (Object.keys(form.boosts) as DomainSkill[])
    .map((skill) => ({ skill, amount: Number(form.boosts[skill]) }))
    .filter((b) => Number.isFinite(b.amount) && b.amount !== 0)

  return {
    name: form.name,
    class: form.class,
    category: form.category,
    sizes: SIZES.filter((s) => form.sizes.has(s)),
    notes: form.notes || undefined,
    costOverride: Object.keys(overrides).length > 0 ? overrides : undefined,
    orders: form.class === 'special' ? Array.from(form.orders) : undefined,
    domainSkillBoosts: form.class === 'special' && boosts.length > 0 ? boosts : undefined,
    hirelingLabel: form.class === 'special' ? form.hirelingLabel || undefined : undefined,
  }
}

interface AuthorFormProps {
  initial: FormState
  editingId: string | null
  onSubmit: (form: FormState) => string | null
  onCancel: () => void
}

function AuthorForm({ initial, editingId, onSubmit, onCancel }: AuthorFormProps) {
  const [form, setForm] = useState<FormState>(initial)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(initial)
    setError(null)
  }, [initial])

  const toggleSize = (size: Size) => {
    setForm((f) => {
      const next = new Set(f.sizes)
      if (next.has(size)) next.delete(size)
      else next.add(size)
      return { ...f, sizes: next }
    })
  }

  const toggleOrder = (order: OrderType) => {
    setForm((f) => {
      const next = new Set(f.orders)
      if (next.has(order)) next.delete(order)
      else next.add(order)
      return { ...f, orders: next }
    })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const reason = onSubmit(form)
    if (reason) setError(reason)
    else setError(null)
  }

  const isSpecial = form.class === 'special'

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <div className="rounded border-2 border-bastion-crimson bg-bastion-crimson/10 px-3 py-2 text-base text-bastion-crimson font-semibold">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="flex flex-col gap-1">
          <span className="text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
            Name
          </span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Smithy of the Old Hill"
            className="rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-xl text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
            Class
          </span>
          <select
            value={form.class}
            onChange={(e) =>
              setForm((f) => ({ ...f, class: e.target.value as FacilityClass }))
            }
            className="rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-xl text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
          >
            <option value="basic">Basic</option>
            <option value="special">Special</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
            Category
          </span>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                category: e.target.value as FacilityCategory,
              }))
            }
            className="rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-xl text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
          >
            {FACILITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {cap(c)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="rounded border border-bastion-oak/60 bg-bastion-parchment-warm/40 p-3">
        <legend className="px-1 text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
          Sizes & costs
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {SIZES.map((size) => {
            const enabled = form.sizes.has(size)
            const fallback = getSizeCost({ id: '', name: '', class: 'basic', category: 'production', sizes: SIZES }, size)
            const override = form.costOverride[size]
            return (
              <div
                key={size}
                className={[
                  'rounded border-2 p-2 transition-colors',
                  enabled
                    ? 'border-bastion-oak bg-bastion-parchment'
                    : 'border-bastion-oak/40 bg-bastion-parchment-warm/30 opacity-70',
                ].join(' ')}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleSize(size)}
                  />
                  <span className="text-lg font-bold text-bastion-ink">
                    {cap(size)}
                  </span>
                </label>
                {enabled && (
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    <label className="flex flex-col gap-0.5">
                      <span className="text-sm uppercase tracking-[0.15em] text-bastion-ink-mute">
                        Cost (gp)
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        placeholder={String(fallback.cost)}
                        value={override?.cost ?? ''}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            costOverride: {
                              ...f.costOverride,
                              [size]: {
                                cost: e.target.value,
                                days: f.costOverride[size]?.days ?? String(fallback.days),
                              },
                            },
                          }))
                        }
                        className="w-full rounded border border-bastion-oak bg-bastion-parchment px-1 py-0.5 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
                      />
                    </label>
                    <label className="flex flex-col gap-0.5">
                      <span className="text-sm uppercase tracking-[0.15em] text-bastion-ink-mute">
                        Days
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        placeholder={String(fallback.days)}
                        value={override?.days ?? ''}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            costOverride: {
                              ...f.costOverride,
                              [size]: {
                                cost: f.costOverride[size]?.cost ?? String(fallback.cost),
                                days: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full rounded border border-bastion-oak bg-bastion-parchment px-1 py-0.5 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
                      />
                    </label>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-sm text-bastion-ink-soft italic">
          Leave overrides blank to fall back to DMG defaults
          ({formatGp(500)}/20d, {formatGp(1000)}/45d, {formatGp(3000)}/125d).
        </p>
      </fieldset>

      {isSpecial && (
        <>
          <fieldset className="rounded border border-bastion-oak/60 bg-bastion-parchment-warm/40 p-3">
            <legend className="px-1 text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
              Available orders
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {ORDER_TYPES.map((order) => (
                <label
                  key={order}
                  className="flex items-center gap-1.5 text-lg text-bastion-ink"
                >
                  <input
                    type="checkbox"
                    checked={form.orders.has(order)}
                    onChange={() => toggleOrder(order)}
                  />
                  {order}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded border border-bastion-oak/60 bg-bastion-parchment-warm/40 p-3">
            <legend className="px-1 text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
              Domain skill boosts
            </legend>
            <div className="grid gap-2 sm:grid-cols-4">
              {DOMAIN_SKILLS.map((skill) => (
                <label key={skill} className="flex flex-col gap-0.5">
                  <span className="text-sm uppercase tracking-[0.15em] text-bastion-ink-mute">
                    {cap(skill)}
                  </span>
                  <input
                    type="number"
                    step={1}
                    placeholder="0"
                    value={form.boosts[skill]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        boosts: { ...f.boosts, [skill]: e.target.value },
                      }))
                    }
                    className="rounded border border-bastion-oak bg-bastion-parchment px-1 py-0.5 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1">
            <span className="text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
              Hireling (optional)
            </span>
            <input
              type="text"
              value={form.hirelingLabel}
              onChange={(e) => setForm((f) => ({ ...f, hirelingLabel: e.target.value }))}
              placeholder="Master Smith, Loremaster, Spy-mistress…"
              className="rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-xl text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
            />
          </label>
        </>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm uppercase tracking-[0.18em] text-bastion-oak font-semibold">
          Notes
        </span>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Lore, mechanical reminders, restrictions…"
          rows={2}
          className="rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-xl text-bastion-ink resize-y font-serif focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        />
      </label>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border-2 border-bastion-oak bg-bastion-parchment-warm px-3 py-1 text-lg font-display tracking-[0.06em] uppercase text-bastion-ink hover:border-bastion-crimson focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md border-2 border-bastion-gold bg-bastion-night/60 px-3 py-1 text-lg font-display tracking-[0.06em] uppercase text-bastion-gold-bright hover:bg-bastion-night/40 hover:border-bastion-gold-bright focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright"
        >
          {editingId ? 'Save changes' : 'Add room'}
        </button>
      </div>
    </form>
  )
}

interface EntryRowProps {
  entry: CatalogueEntry
  onEdit: () => void
  onDelete: () => void
}

function EntryRow({ entry, onEdit, onDelete }: EntryRowProps) {
  const summary: string[] = []
  summary.push(cap(entry.class))
  summary.push(cap(entry.category))
  summary.push(entry.sizes.map(cap).join('/'))
  if (entry.orders && entry.orders.length > 0) {
    summary.push(`Orders: ${entry.orders.join(', ')}`)
  }
  if (entry.hirelingLabel) summary.push(`Hireling: ${entry.hirelingLabel}`)
  if (entry.domainSkillBoosts && entry.domainSkillBoosts.length > 0) {
    summary.push(
      'Boosts: ' +
        entry.domainSkillBoosts
          .map((b) => `${cap(b.skill)} ${b.amount > 0 ? '+' : ''}${b.amount}`)
          .join(', '),
    )
  }
  return (
    <li className="rounded border-2 border-bastion-oak/70 bg-bastion-parchment-warm/40 p-2.5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display text-xl font-semibold text-bastion-ink">
            {entry.name}
          </span>
          <span className="rounded-sm border border-bastion-crimson/70 bg-bastion-crimson/15 px-1.5 py-0.5 text-sm uppercase tracking-[0.18em] text-bastion-crimson font-bold">
            Homebrew
          </span>
        </div>
        <div className="mt-1 text-base text-bastion-ink-soft">
          {summary.join(' · ')}
        </div>
        {entry.notes && (
          <div className="mt-1 text-base italic text-bastion-ink-mute">
            {entry.notes}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="rounded border border-bastion-oak px-2 py-0.5 text-base uppercase tracking-[0.12em] text-bastion-ink hover:border-bastion-crimson focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded border border-bastion-crimson/70 px-2 py-0.5 text-base uppercase tracking-[0.12em] text-bastion-crimson hover:bg-bastion-crimson/10 focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
        >
          Delete
        </button>
      </div>
    </li>
  )
}

export function HomebrewRoomsSection() {
  const isPlayer = usePlayerView()
  const customs = useBastionStore(
    (s) => s.bastions[s.activeBastionId].customCatalogueEntries,
  )
  const addEntry = useBastionStore((s) => s.addCustomCatalogueEntry)
  const updateEntry = useBastionStore((s) => s.updateCustomCatalogueEntry)
  const removeEntry = useBastionStore((s) => s.removeCustomCatalogueEntry)

  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingEntry = useMemo(
    () => (editingId ? customs?.find((e) => e.id === editingId) : undefined),
    [customs, editingId],
  )

  const initialForm = useMemo<FormState>(
    () => (editingEntry ? entryToForm(editingEntry) : emptyForm()),
    [editingEntry],
  )

  if (isPlayer) return null

  const handleSubmit = (form: FormState): string | null => {
    const draft = formToDraft(form)
    if (editingId) {
      const result = updateEntry(editingId, draft)
      if (!result.ok) return result.reason
    } else {
      const result = addEntry(draft)
      if (!result.ok) return result.reason
    }
    setShowForm(false)
    setEditingId(null)
    return null
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setShowForm(true)
  }

  const handleDelete = (id: string, name: string) => {
    const ok = window.confirm(
      `Delete homebrew room “${name}”? Existing facilities already built from it stay; only the catalogue entry is removed.`,
    )
    if (ok) {
      removeEntry(id)
      if (editingId === id) {
        setEditingId(null)
        setShowForm(false)
      }
    }
  }

  const startNew = () => {
    setEditingId(null)
    setShowForm(true)
  }

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-4xl font-bold heading-display font-display tracking-[0.06em]">
            Homebrew rooms
          </h2>
          <span className="text-base uppercase tracking-[0.18em] rounded border border-bastion-crimson/70 bg-bastion-crimson/15 text-bastion-crimson px-2 py-0.5 font-bold">
            DM Only
          </span>
          <span className="text-lg uppercase tracking-[0.18em] text-page-muted-strong">
            {customs?.length ?? 0} authored
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v)
            if (open) {
              setShowForm(false)
              setEditingId(null)
            }
          }}
          aria-expanded={open}
          className="rounded-md border-2 border-bastion-gold bg-bastion-night/60 px-3 py-1 text-lg font-display tracking-[0.06em] uppercase text-bastion-gold-bright hover:bg-bastion-night/40 hover:border-bastion-gold-bright transition-colors focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright"
        >
          {open ? '− Hide rooms' : '+ Show rooms'}
        </button>
      </div>

      {open && (
        <div className="parchment-surface rounded-md border-[3px] border-bastion-oak p-4 shadow-[3px_4px_0_rgba(0,0,0,0.5)] space-y-4">
          <p className="text-lg text-bastion-ink-soft italic leading-relaxed">
            Author rooms specific to this campaign. They appear in the build
            catalogue alongside the DMG basics, badged{' '}
            <span className="not-italic font-semibold">Homebrew</span>. Special
            entries can carry orders, domain boosts, and a hireling that's
            auto-created on build.
          </p>

          {customs && customs.length > 0 && (
            <ul className="space-y-2">
              {customs.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onEdit={() => handleEdit(entry.id)}
                  onDelete={() => handleDelete(entry.id, entry.name)}
                />
              ))}
            </ul>
          )}

          {showForm ? (
            <div className="rounded-md border-2 border-bastion-oak/70 bg-bastion-parchment p-3">
              <div className="text-base uppercase tracking-[0.18em] text-bastion-oak font-bold mb-2">
                {editingId ? 'Edit homebrew room' : 'New homebrew room'}
              </div>
              <AuthorForm
                initial={initialForm}
                editingId={editingId}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={startNew}
              className="rounded-md border-2 border-bastion-gold bg-bastion-night/60 px-3 py-1.5 text-lg font-display tracking-[0.06em] uppercase text-bastion-gold-bright hover:bg-bastion-night/40 hover:border-bastion-gold-bright focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright"
            >
              + Author a room
            </button>
          )}
        </div>
      )}
    </section>
  )
}
