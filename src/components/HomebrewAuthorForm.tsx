import { useEffect, useState } from 'react'
import {
  DOMAIN_SKILLS,
  FACILITY_CATEGORIES,
  type DomainSkill,
  type FacilityCategory,
  type FacilityClass,
  type OrderType,
  type Size,
} from '../types'
import { getSizeCost } from '../data/facility-catalogue'
import { formatGp } from '../lib/format'

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

export interface HomebrewFormState {
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

interface HomebrewAuthorFormProps {
  initial: HomebrewFormState
  editingId: string | null
  onSubmit: (form: HomebrewFormState) => string | null
  onCancel: () => void
}

export function HomebrewAuthorForm({
  initial,
  editingId,
  onSubmit,
  onCancel,
}: HomebrewAuthorFormProps) {
  const [form, setForm] = useState<HomebrewFormState>(initial)
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
