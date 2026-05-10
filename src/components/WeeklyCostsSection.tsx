'use client';
import { useEffect, useState } from 'react'
import { useBastionStore } from '../store/useBastionStore'
import { computeWeeklyTotal } from '../lib/costs'
import { formatGp } from '../lib/format'
import { usePlayerView } from '../lib/view-mode'
import type { WeeklyCostKey } from '../types'

interface CostFieldProps {
  label: string
  value: number
  onChange?: (next: number) => void
  detail?: string
  computed?: boolean
}

function CostField({ label, value, onChange, detail, computed }: CostFieldProps) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = () => {
    const parsed = Math.max(0, Number(draft))
    if (Number.isFinite(parsed)) onChange?.(parsed)
  }

  const editable = !computed && !!onChange

  return (
    <div className="rounded border border-bastion-oak/60 bg-bastion-parchment-warm/50 p-2 flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-lg text-bastion-ink font-semibold">{label}</span>
        {editable ? (
          <span className="flex items-baseline gap-1">
            <input
              type="number"
              min={0}
              step={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commit()
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              aria-label={label}
              className="w-20 rounded border border-bastion-oak bg-bastion-parchment px-1.5 py-0.5 text-xl text-bastion-ink text-right focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
            />
            <span className="text-lg text-bastion-ink-mute">gp</span>
          </span>
        ) : (
          <span className="text-xl text-bastion-ink font-semibold tabular-nums">
            {formatGp(value)}
          </span>
        )}
      </div>
      {detail && (
        <span className="text-base text-bastion-ink-mute italic">{detail}</span>
      )}
    </div>
  )
}

export function WeeklyCostsSection() {
  const isPlayer = usePlayerView()
  const bastion = useBastionStore((s) => s.bastions[s.activeBastionId])
  const setWeeklyCost = useBastionStore((s) => s.setWeeklyCost)
  const setUpkeepNotes = useBastionStore((s) => s.setUpkeepNotes)

  const breakdown = computeWeeklyTotal(bastion)
  const wouldGoNegative = bastion.treasury - breakdown.total < 0
  const upkeepNotes = bastion.weeklyCosts?.upkeepNotes ?? ''

  const [notesDraft, setNotesDraft] = useState(upkeepNotes)
  useEffect(() => setNotesDraft(upkeepNotes), [upkeepNotes])

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
        <h2 className="text-4xl font-bold heading-display font-display tracking-[0.06em]">
          Weekly costs
        </h2>
        <span className="text-lg uppercase tracking-[0.18em] text-page-muted-strong">
          {formatGp(breakdown.total)} / week
        </span>
      </div>

      <div className="parchment-surface rounded-md border-[3px] border-bastion-oak p-4 shadow-[3px_4px_0_rgba(0,0,0,0.5)] space-y-4">
        {wouldGoNegative && (
          <div className="rounded border-2 border-bastion-crimson bg-bastion-crimson/10 px-3 py-2 text-lg text-bastion-crimson font-semibold">
            ⚠ Treasury can't cover the next tick. Advancing will drop the bastion to{' '}
            {formatGp(bastion.treasury - breakdown.total)}.
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {breakdown.lines.map((line) => (
            <CostField
              key={line.key}
              label={line.label}
              value={line.amount}
              detail={line.detail}
              computed={line.computed}
              onChange={
                isPlayer || line.computed
                  ? undefined
                  : (next) => setWeeklyCost(line.key as WeeklyCostKey, next)
              }
            />
          ))}
        </div>

        <div className="border-t-2 border-bastion-oak/60 pt-3 flex items-baseline justify-between gap-3">
          <span className="text-xl uppercase tracking-[0.18em] text-bastion-oak font-bold">
            Total / week
          </span>
          <span className="text-4xl font-display font-bold text-bastion-ink tabular-nums">
            {formatGp(breakdown.total)}
          </span>
        </div>

        {!isPlayer ? (
          <div>
            <label
              htmlFor="upkeep-notes"
              className="text-base uppercase tracking-[0.2em] text-bastion-oak font-semibold"
            >
              Upkeep notes
            </label>
            <textarea
              id="upkeep-notes"
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={() => {
                if (notesDraft !== upkeepNotes) setUpkeepNotes(notesDraft)
              }}
              placeholder="What does the lifestyle / defender pay represent? Mounts, retainer wages, oat for the warhorses…"
              aria-label="Upkeep notes"
              rows={2}
              className="mt-1 w-full rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-xl text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson resize-y font-serif"
            />
          </div>
        ) : (
          upkeepNotes && (
            <div>
              <span className="text-base uppercase tracking-[0.2em] text-bastion-oak font-semibold">
                Upkeep notes
              </span>
              <p className="mt-1 text-xl text-bastion-ink leading-relaxed font-serif italic">
                {upkeepNotes}
              </p>
            </div>
          )
        )}
      </div>
    </section>
  )
}
