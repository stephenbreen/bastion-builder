'use client';
import { useMemo, useState } from 'react'
import {
  BASIC_FACILITIES_CATALOGUE,
  getSizeCost,
  type CatalogueEntry,
} from '../data/facility-catalogue'
import { useActiveBastionId } from '../hooks/useActiveBastionId'
import { useBastion } from '../hooks/useBastion'
import { useBastionMutation } from '../hooks/useBastionMutation'
import { useUiStore } from '../store/useUiStore'
import { formatGp } from '../lib/format'
import type { Size } from '../types'

const SIZE_ORDER: Size[] = ['cramped', 'roomy', 'vast']

function sizeLabel(s: Size) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface CatalogueCardProps {
  entry: CatalogueEntry
  treasury: number
  onBuild: (entry: CatalogueEntry, size: Size) => void
  flashId: string | null
}

function CatalogueCard({ entry, treasury, onBuild, flashId }: CatalogueCardProps) {
  return (
    <div className="parchment-surface rounded-md border-[3px] border-bastion-oak p-3 shadow-[2px_3px_0_rgba(0,0,0,0.4)]">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-bastion-ink tracking-wide">
          {entry.name}
        </h3>
        <div className="flex items-center gap-1.5">
          {entry.homebrew && (
            <span className="rounded-sm border border-bastion-crimson/70 bg-bastion-crimson/15 px-1.5 py-0.5 text-sm uppercase tracking-[0.18em] text-bastion-crimson font-bold">
              Homebrew
            </span>
          )}
          <span className="text-sm uppercase tracking-[0.2em] text-bastion-oak">
            {entry.class}
          </span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {SIZE_ORDER.filter((s) => entry.sizes.includes(s)).map((size) => {
          const { cost, days } = getSizeCost(entry, size)
          const affordable = treasury >= cost
          const flashKey = `${entry.id}-${size}`
          const flashed = flashId === flashKey
          return (
            <button
              key={size}
              type="button"
              disabled={!affordable}
              onClick={() => onBuild(entry, size)}
              title={
                affordable
                  ? `Build ${entry.name} (${sizeLabel(size)}) — ${formatGp(cost)}, ${days} days`
                  : `Need ${formatGp(cost - treasury)} more in treasury`
              }
              className={[
                'rounded border-2 px-2 py-1.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright',
                affordable
                  ? 'border-bastion-oak bg-bastion-vellum text-bastion-ink hover:border-bastion-crimson hover:bg-bastion-gold-bright/40 hover:-translate-y-[1px] shadow-[1px_2px_0_rgba(0,0,0,0.35)]'
                  : 'border-bastion-oak/40 bg-bastion-vellum/40 text-bastion-ink-mute opacity-60 cursor-not-allowed',
                flashed
                  ? 'ring-4 ring-bastion-gold-bright border-bastion-crimson bg-bastion-gold-bright/60'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="text-base font-semibold">{sizeLabel(size)}</div>
              <div className="mt-0.5 text-base tabular-nums">
                <span className="font-semibold">{formatGp(cost)}</span>
                <span className="text-bastion-ink-mute"> · {days}d</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function BuildCatalogue() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)

  const bastionId = useActiveBastionId()
  const bastion = useBastion(bastionId).data?.state
  const treasury = bastion?.treasury ?? 0
  const customs = bastion?.customCatalogueEntries
  const { startBuild } = useBastionMutation(bastionId)
  const selectFacility = useUiStore((s) => s.selectFacility)

  const entries = useMemo<CatalogueEntry[]>(
    () => [...BASIC_FACILITIES_CATALOGUE, ...(customs ?? [])],
    [customs],
  )

  const handleBuild = (entry: CatalogueEntry, size: Size) => {
    const result = startBuild(entry.id, size)
    if (result.ok) {
      setError(null)
      setFlashId(`${entry.id}-${size}`)
      selectFacility(result.facilityId)
      window.setTimeout(() => setFlashId(null), 700)
    } else {
      setError(result.reason)
    }
  }

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v)
            setError(null)
          }}
          aria-expanded={open}
          aria-controls="build-catalogue-panel"
          className="rounded-md border-2 border-bastion-gold bg-bastion-night/60 px-4 py-2 text-lg font-display tracking-[0.06em] uppercase text-bastion-gold-bright hover:bg-bastion-night/40 hover:border-bastion-gold-bright transition-colors focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
        >
          {open ? '− Close build catalogue' : '+ Build new facility'}
        </button>
        {open && (
          <span className="text-base uppercase tracking-[0.18em] text-page-muted-strong">
            Treasury: <span className="text-bastion-gold-bright font-semibold">{formatGp(treasury)}</span>
          </span>
        )}
      </div>

      {open && (
        <div
          id="build-catalogue-panel"
          className="parchment-surface mt-3 rounded-md border-[3px] border-bastion-oak p-4 shadow-[3px_4px_0_rgba(0,0,0,0.5)]"
        >
          <p className="mb-3 text-base text-bastion-ink-soft italic">
            Basic facilities are added by spending treasury and waiting out the build time.
            Homebrew rooms (authored below in <em>Homebrew rooms</em>) appear here too.
          </p>

          {error && (
            <div className="mb-3 rounded border-2 border-bastion-crimson bg-bastion-crimson/10 px-3 py-2 text-base text-bastion-crimson font-semibold">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <CatalogueCard
                key={entry.id}
                entry={entry}
                treasury={treasury}
                onBuild={handleBuild}
                flashId={flashId}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
