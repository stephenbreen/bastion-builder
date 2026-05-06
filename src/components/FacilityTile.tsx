import type { Facility, Hireling } from '../types'
import { tileSpanClasses } from '../lib/grid'
import { formatGp } from '../lib/format'

interface FacilityTileProps {
  facility: Facility
  hireling?: Hireling
}

export function FacilityTile({ facility, hireling }: FacilityTileProps) {
  const isSpecial = facility.class === 'special'
  const isUnderConstruction = facility.state === 'under-construction'
  const isDamaged = facility.state === 'damaged'
  const isDisabled = facility.state === 'disabled'
  const span = tileSpanClasses(facility.size)
  const totalCost = facility.cost * (facility.count ?? 1)

  const summaryLines = [
    `${facility.class} · ${facility.size}${facility.count && facility.count > 1 ? ` ×${facility.count}` : ''}`,
    `${formatGp(totalCost)} · ${facility.buildTimeDays}d build`,
    hireling ? `Hireling: ${hireling.name} (${hireling.role})` : null,
    facility.orders.length > 0 ? `Orders: ${facility.orders.join(', ')}` : null,
    facility.notes ?? null,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div
      role="button"
      tabIndex={0}
      title={summaryLines}
      aria-label={`${facility.name} — ${facility.class} ${facility.size}`}
      className={[
        span,
        'group relative rounded p-3 min-h-[5.5rem] flex flex-col justify-between',
        'border bg-bastion-stone/40',
        'transition-colors cursor-pointer',
        'hover:bg-bastion-stone/70 hover:border-bastion-gold/40',
        'focus:outline-none focus:ring-2 focus:ring-bastion-gold/60',
        isSpecial ? 'border-bastion-gold/50' : 'border-bastion-stone',
        isDamaged ? 'opacity-60' : '',
        isDisabled ? 'opacity-30 grayscale' : '',
        isUnderConstruction ? 'border-dashed border-bastion-rust/60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isSpecial && (
        <span
          aria-hidden
          className="absolute top-1.5 right-2 text-bastion-gold text-sm leading-none"
        >
          ★
        </span>
      )}
      {facility.count && facility.count > 1 ? (
        <span className="absolute top-1.5 left-2 text-[0.65rem] tracking-wider text-bastion-parchment/60">
          ×{facility.count}
        </span>
      ) : null}

      <div className="mt-3">
        <div
          className={`text-sm font-medium leading-tight ${
            isSpecial ? 'text-bastion-gold' : 'text-bastion-parchment'
          }`}
        >
          {facility.name}
        </div>
        <div className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-bastion-parchment/40">
          {facility.size}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[0.65rem] text-bastion-parchment/50">
        {hireling && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-bastion-rust" aria-hidden />
            <span className="truncate">{hireling.role}</span>
          </span>
        )}
        {facility.orders.length > 0 && (
          <span>{facility.orders.length} orders</span>
        )}
        {isUnderConstruction && facility.daysRemaining != null && (
          <span className="text-bastion-rust">
            {facility.daysRemaining}d left
          </span>
        )}
      </div>
    </div>
  )
}
