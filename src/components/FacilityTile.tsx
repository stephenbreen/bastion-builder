import type { KeyboardEvent } from 'react'
import type { Facility, FacilityCategory, Hireling, Size } from '../types'
import { formatGp } from '../lib/format'

// Larger sizes claim more grid cells: vast = 2×2, roomy = 1×2 (taller),
// cramped = 1×1. Sticks to whole-cell counts so the grid stays orderly.
const SIZE_SPAN_CLASSES: Record<Size, string> = {
  cramped: '',
  roomy: 'row-span-2',
  vast: 'col-span-2 row-span-2',
}

// Subtle category accent: a coloured left edge + faint same-tone wash.
// Keeps parchment as the dominant tone so the manor still reads as paper.
interface CategoryStyle {
  stripeColor: string
  washClass: string
  label: string
}

const CATEGORY_STYLES: Record<FacilityCategory, CategoryStyle> = {
  production: {
    stripeColor: 'var(--color-bastion-verdant)',
    washClass: 'bg-bastion-verdant/10',
    label: 'Production',
  },
  knowledge: {
    stripeColor: 'var(--color-bastion-azure)',
    washClass: 'bg-bastion-azure/10',
    label: 'Knowledge',
  },
  social: {
    stripeColor: 'var(--color-bastion-gold)',
    washClass: 'bg-bastion-gold/10',
    label: 'Social',
  },
  quarters: {
    stripeColor: 'var(--color-bastion-oak)',
    washClass: 'bg-bastion-oak/5',
    label: 'Quarters',
  },
  defense: {
    stripeColor: 'var(--color-bastion-crimson)',
    washClass: 'bg-bastion-crimson/10',
    label: 'Defense',
  },
  storage: {
    stripeColor: 'var(--color-bastion-ink-mute)',
    washClass: 'bg-bastion-ink-mute/15',
    label: 'Storage',
  },
}

interface FacilityTileProps {
  facility: Facility
  hireling?: Hireling
  selected?: boolean
  onSelect?: (id: string) => void
}

export function FacilityTile({ facility, hireling, selected, onSelect }: FacilityTileProps) {
  const isSpecial = facility.class === 'special'
  const isUnderConstruction = facility.state === 'under-construction'
  const isDamaged = facility.state === 'damaged'
  const isDisabled = facility.state === 'disabled'
  const totalCost = facility.cost * (facility.count ?? 1)
  const hasCount = !!facility.count && facility.count > 1

  const summaryLines = [
    `${facility.class} · ${facility.size}${hasCount ? ` ×${facility.count}` : ''}`,
    `${formatGp(totalCost)} · ${facility.buildTimeDays}d build`,
    hireling ? `Hireling: ${hireling.name} (${hireling.role})` : null,
    facility.orders.length > 0 ? `Orders: ${facility.orders.join(', ')}` : null,
    facility.pendingOrder ? `This week: ${facility.pendingOrder}` : null,
    facility.notes ?? null,
  ]
    .filter(Boolean)
    .join('\n')

  const handleSelect = () => onSelect?.(facility.id)

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect()
    }
  }

  // Frame language: oak (basic) / gold thick (special) / ember dashed (build).
  const frameClasses = isUnderConstruction
    ? 'border-[3px] border-dashed border-bastion-ember'
    : isSpecial
      ? 'border-[3px] border-bastion-gold'
      : 'border-[3px] border-bastion-oak'

  const stateModifier = isDamaged
    ? 'opacity-70 saturate-50'
    : isDisabled
      ? 'opacity-40 grayscale'
      : ''

  const categoryStyle = facility.category ? CATEGORY_STYLES[facility.category] : null

  return (
    <div
      role="button"
      tabIndex={0}
      title={summaryLines}
      aria-label={`${facility.name} — ${facility.class} ${facility.size}`}
      aria-pressed={selected ?? false}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={[
        'parchment-surface group relative rounded-md p-3 min-h-[6.5rem] flex flex-col overflow-hidden',
        'cursor-pointer transition-all duration-150',
        SIZE_SPAN_CLASSES[facility.size],
        frameClasses,
        'shadow-[2px_3px_0_rgba(0,0,0,0.45)] hover:shadow-[3px_5px_0_rgba(0,0,0,0.5)]',
        'hover:-translate-y-[1px]',
        selected
          ? 'ring-4 ring-bastion-gold-bright/70 -translate-y-[1px] shadow-[3px_5px_0_rgba(0,0,0,0.55)]'
          : '',
        stateModifier,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Category accent: faint wash + 4px coloured stripe on the left edge */}
      {categoryStyle && (
        <>
          <span
            aria-hidden
            className={`absolute inset-0 pointer-events-none ${categoryStyle.washClass}`}
          />
          <span
            aria-hidden
            className="absolute top-0 bottom-0 left-0 w-1 pointer-events-none"
            style={{ backgroundColor: categoryStyle.stripeColor }}
          />
        </>
      )}

      {/* Special-facility wax seal in the upper-right */}
      {isSpecial && (
        <span aria-hidden className="heraldic-crest absolute -top-2 -right-2 shadow-md">
          ★
        </span>
      )}

      {/* Count badge in the upper-right (subordinate to the wax seal if both present) */}
      {hasCount && (
        <span
          className={[
            'absolute text-base font-semibold tracking-wider rounded-sm px-1.5 py-0.5 bg-bastion-oak text-bastion-parchment shadow-sm',
            isSpecial ? 'top-1.5 right-6' : 'top-1.5 right-1.5',
          ].join(' ')}
        >
          ×{facility.count}
        </span>
      )}

      {/* Title row */}
      <div className={`relative ${hasCount ? 'pr-12' : isSpecial ? 'pr-6' : ''}`}>
        <h3
          className={`font-display text-lg font-semibold leading-tight ${
            isSpecial ? 'text-bastion-crimson-deep' : 'text-bastion-ink'
          }`}
        >
          {facility.name}
        </h3>
      </div>

      {/* Quality + class pill row */}
      <div className="mt-1.5 relative flex flex-wrap items-center gap-1">
        <span className="rounded-sm border border-bastion-oak/60 bg-bastion-vellum/60 px-1.5 py-0.5 text-sm font-semibold uppercase tracking-[0.16em] text-bastion-ink">
          {facility.size}
        </span>
        {isSpecial && (
          <span className="rounded-sm border border-bastion-gold/60 bg-bastion-gold/15 px-1.5 py-0.5 text-sm font-semibold uppercase tracking-[0.16em] text-bastion-gold-deep">
            special
          </span>
        )}
      </div>

      {/* Occupant + status chip row at the bottom */}
      <div className="mt-auto pt-2 relative flex flex-wrap items-center gap-1.5 text-base">
        {hireling && (
          <span className="flex items-center gap-1 rounded-sm border border-bastion-oak/40 bg-bastion-parchment-warm/70 px-1.5 py-0.5 text-bastion-ink">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-bastion-crimson" aria-hidden />
            <span className="truncate max-w-[7rem]">{hireling.role}</span>
          </span>
        )}
        {facility.pendingOrder ? (
          <span className="rounded-sm bg-bastion-crimson px-1.5 py-0.5 uppercase tracking-wider text-bastion-parchment shadow-sm font-semibold">
            ▸ {facility.pendingOrder}
          </span>
        ) : facility.orders.length > 0 ? (
          <span className="rounded-sm border border-bastion-oak/40 bg-bastion-parchment-warm/40 px-1.5 py-0.5 text-bastion-ink-soft">
            {facility.orders.length} orders
          </span>
        ) : null}
        {isUnderConstruction && facility.daysRemaining != null && (
          <span className="rounded-sm border border-bastion-ember/60 bg-bastion-ember/15 px-1.5 py-0.5 text-bastion-ember font-semibold">
            {facility.daysRemaining}d left
          </span>
        )}
      </div>
    </div>
  )
}
