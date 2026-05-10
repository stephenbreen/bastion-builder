import { useMemo, useState } from 'react'
import { useBastionStore } from '../store/useBastionStore'
import { usePlayerView } from '../lib/view-mode'
import {
  type CatalogueEntry,
  type DomainSkill,
  type Size,
} from '../types'
import type {
  CostOverrideMap,
  HomebrewDraft,
} from '../store/reducers/homebrew-rooms'
import {
  HomebrewAuthorForm,
  type HomebrewFormState as FormState,
} from './HomebrewAuthorForm'

const SIZES: Size[] = ['cramped', 'roomy', 'vast']

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

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
              <HomebrewAuthorForm
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
