import { useEffect, useState } from 'react'
import {
  DEFAULT_FLOORS,
  FLOOR_LABELS,
  type Bastion,
  type DefaultFloorId,
  type FacilityFloor,
} from '../types'
import { getFloors } from '../lib/floors'
import { useBastionStore } from '../store/useBastionStore'

interface FloorConfigPanelProps {
  bastion: Bastion
}

export function FloorConfigPanel({ bastion }: FloorConfigPanelProps) {
  const setFloorLabel = useBastionStore((s) => s.setFloorLabel)
  const moveFloor = useBastionStore((s) => s.moveFloor)
  const addFloor = useBastionStore((s) => s.addFloor)
  const removeFloor = useBastionStore((s) => s.removeFloor)
  const resetFloors = useBastionStore((s) => s.resetFloors)
  const [error, setError] = useState<string | null>(null)
  const [justAddedId, setJustAddedId] = useState<string | null>(null)

  const floors = getFloors(bastion)
  const facilityCounts = new Map<FacilityFloor, number>()
  for (const f of bastion.facilities) {
    const fl = f.floor ?? 'ground'
    facilityCounts.set(fl, (facilityCounts.get(fl) ?? 0) + 1)
  }

  const handleReset = () => {
    if (
      window.confirm(
        'Reset floors to the defaults? Custom floors will be removed (only allowed when empty).',
      )
    ) {
      // resetFloors itself doesn't refuse on occupied custom floors, but
      // the existing facilities will lose their floor pointer. Surface the
      // risk by checking first: any room on a non-default floor blocks the reset.
      const nonDefault = floors.filter(
        (f) => !DEFAULT_FLOORS.some((d) => d.id === f.id),
      )
      const orphans = bastion.facilities.filter((f) =>
        nonDefault.some((nd) => nd.id === f.floor),
      )
      if (orphans.length > 0) {
        setError(
          `${orphans.length} room${orphans.length === 1 ? ' is' : 's are'} on a custom floor — move them to a default floor before resetting.`,
        )
        return
      }
      setError(null)
      resetFloors()
    }
  }

  const handleAdd = () => {
    setError(null)
    const id = addFloor()
    setJustAddedId(id)
  }

  const handleRemove = (id: FacilityFloor, label: string) => {
    if (!window.confirm(`Remove the floor "${label}"?`)) return
    const result = removeFloor(id)
    if (!result.ok) {
      setError(result.reason)
    } else {
      setError(null)
    }
  }

  return (
    <div
      id="floor-config-panel"
      className="parchment-surface mb-4 rounded-md border-[3px] border-bastion-oak p-4 shadow-[3px_4px_0_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <h3 className="font-display text-xl font-semibold text-bastion-ink tracking-[0.06em]">
          Manage floors
        </h3>
        <button
          type="button"
          onClick={handleReset}
          className="text-base uppercase tracking-wider text-bastion-crimson hover:text-bastion-gold-deep transition-colors font-semibold"
        >
          Reset to defaults
        </button>
      </div>
      <p className="text-base text-bastion-ink-soft italic mb-3 leading-relaxed">
        Rename floors, reorder them top-to-bottom, or add new ones. Empty
        floors stay hidden on the floor plan; you can only delete a floor when
        no rooms are assigned to it.
      </p>

      {error && (
        <div className="mb-3 rounded border-2 border-bastion-crimson bg-bastion-crimson/10 px-3 py-2 text-base text-bastion-crimson font-semibold">
          {error}
        </div>
      )}

      <ul className="space-y-2 mb-3">
        {floors.map((floor, idx) => {
          const isFirst = idx === 0
          const isLast = idx === floors.length - 1
          const count = facilityCounts.get(floor.id) ?? 0
          const canDelete = count === 0 && floors.length > 1
          return (
            <FloorRow
              key={floor.id}
              floor={floor.id}
              label={floor.label}
              count={count}
              isFirst={isFirst}
              isLast={isLast}
              canDelete={canDelete}
              autoFocus={floor.id === justAddedId}
              onLabelChange={(value) => setFloorLabel(floor.id, value)}
              onMoveUp={() => moveFloor(floor.id, 'up')}
              onMoveDown={() => moveFloor(floor.id, 'down')}
              onDelete={() => handleRemove(floor.id, floor.label)}
            />
          )
        })}
      </ul>

      <button
        type="button"
        onClick={handleAdd}
        className="rounded-md border-2 border-bastion-gold bg-bastion-night/60 px-3 py-1.5 text-base font-display tracking-[0.06em] uppercase text-bastion-gold-bright hover:bg-bastion-night/40 hover:border-bastion-gold-bright focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright"
      >
        + Add floor
      </button>
    </div>
  )
}

interface FloorRowProps {
  floor: FacilityFloor
  label: string
  count: number
  isFirst: boolean
  isLast: boolean
  canDelete: boolean
  autoFocus?: boolean
  onLabelChange: (next: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}

function FloorRow({
  floor,
  label,
  count,
  isFirst,
  isLast,
  canDelete,
  autoFocus,
  onLabelChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: FloorRowProps) {
  const [draft, setDraft] = useState(label)
  useEffect(() => setDraft(label), [label])

  const commit = () => {
    if (draft !== label) onLabelChange(draft)
  }

  // The default-floor id maps back to a fixed canonical name we can show as
  // a reference; custom floors don't have one.
  const isDefault = (DEFAULT_FLOORS as { id: FacilityFloor }[]).some((d) => d.id === floor)
  const canonicalRef = isDefault
    ? FLOOR_LABELS[floor as DefaultFloorId]
    : 'Custom'

  return (
    <li className="flex items-center gap-2 rounded border-2 border-bastion-oak/70 bg-bastion-parchment-warm/50 p-2">
      <span className="text-sm uppercase tracking-[0.16em] text-bastion-oak font-semibold w-20 shrink-0">
        {canonicalRef}
      </span>
      <input
        type="text"
        autoFocus={autoFocus}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit()
            ;(e.target as HTMLInputElement).blur()
          } else if (e.key === 'Escape') {
            setDraft(label)
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        placeholder={isDefault ? FLOOR_LABELS[floor as DefaultFloorId] : 'Floor name'}
        aria-label={`Rename ${label}`}
        className="flex-1 min-w-0 rounded border border-bastion-oak bg-bastion-parchment px-2 py-1 text-base text-bastion-ink placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
      />
      <span className="text-sm uppercase tracking-[0.14em] text-bastion-ink-mute tabular-nums w-16 text-right shrink-0">
        {count} room{count === 1 ? '' : 's'}
      </span>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label={`Move ${label} up`}
          title="Move up (toward the top of the cutaway)"
          className="rounded border border-bastion-oak px-2 py-0.5 text-base text-bastion-ink hover:border-bastion-crimson focus:outline-none focus:ring-2 focus:ring-bastion-crimson disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label={`Move ${label} down`}
          title="Move down"
          className="rounded border border-bastion-oak px-2 py-0.5 text-base text-bastion-ink hover:border-bastion-crimson focus:outline-none focus:ring-2 focus:ring-bastion-crimson disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          aria-label={`Remove ${label}`}
          title={canDelete ? 'Remove this floor' : 'Move all rooms off this floor first'}
          className="rounded border border-bastion-crimson/70 px-2 py-0.5 text-base text-bastion-crimson hover:bg-bastion-crimson hover:text-bastion-parchment transition-colors focus:outline-none focus:ring-2 focus:ring-bastion-crimson disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-bastion-crimson"
        >
          ×
        </button>
      </div>
    </li>
  )
}
