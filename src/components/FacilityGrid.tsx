'use client';
import { useState } from 'react'
import { useActiveBastionId } from '../hooks/useActiveBastionId'
import { useBastion } from '../hooks/useBastion'
import { useUiStore } from '../store/useUiStore'
import {
  type Facility,
  type FacilityFloor,
  type Hireling,
} from '../types'
import { getFloorLabel, getFloorOrder } from '../lib/floors'
import { usePlayerView } from '../lib/view-mode'
import { FacilityTile } from './FacilityTile'
import { FloorConfigPanel } from './FloorConfigPanel'
import { ManorFrame } from './ManorFrame'

function groupByFloor(
  facilities: Facility[],
  knownFloorIds: FacilityFloor[],
): Record<FacilityFloor, Facility[]> {
  const out: Record<FacilityFloor, Facility[]> = {}
  for (const id of knownFloorIds) out[id] = []
  for (const f of facilities) {
    const key = f.floor ?? 'ground'
    if (!out[key]) out[key] = []
    out[key].push(f)
  }
  return out
}

interface FloorBandProps {
  floor: FacilityFloor
  label: string
  tiles: Facility[]
  hirelings: Hireling[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function FloorBand({ floor, label, tiles, hirelings, selectedId, onSelect }: FloorBandProps) {
  return (
    <section
      key={floor}
      aria-label={label}
      className="rounded-md border border-bastion-oak/40 bg-bastion-oak/15 p-3"
    >
      <header className="mb-2 flex items-baseline justify-between gap-2 border-b border-bastion-gold/30 pb-1.5">
        <h3 className="font-display text-xl font-semibold text-bastion-gold-bright tracking-[0.18em] uppercase">
          {label}
        </h3>
        <span className="text-base uppercase tracking-[0.18em] text-page-muted-strong">
          {tiles.length} room{tiles.length === 1 ? '' : 's'}
        </span>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-fr">
        {tiles.map((facility) => {
          const hireling = facility.hirelingId
            ? hirelings.find((h) => h.id === facility.hirelingId)
            : undefined
          return (
            <FacilityTile
              key={facility.id}
              facility={facility}
              hireling={hireling}
              selected={facility.id === selectedId}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </section>
  )
}

export function FacilityGrid() {
  const bastionId = useActiveBastionId()
  const bastion = useBastion(bastionId).data?.state
  const selectedId = useUiStore((s) => s.selectedFacilityId)
  const selectFacility = useUiStore((s) => s.selectFacility)
  const isPlayer = usePlayerView()
  const [configOpen, setConfigOpen] = useState(false)

  if (!bastion) return null

  const facilities = bastion.facilities
  const hirelings = bastion.hirelings

  const orderedFloors = getFloorOrder(bastion)
  const byFloor = groupByFloor(facilities, orderedFloors)
  const occupiedFloors = orderedFloors.filter((floor) => byFloor[floor].length > 0)

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-4xl font-bold heading-display font-display tracking-[0.06em]">
          Floor plan
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-base uppercase tracking-[0.18em] text-page-muted-strong">
            {facilities.length} facilities · {occupiedFloors.length} floor
            {occupiedFloors.length === 1 ? '' : 's'}
          </span>
          {!isPlayer && (
            <button
              type="button"
              onClick={() => setConfigOpen((v) => !v)}
              aria-expanded={configOpen}
              aria-controls="floor-config-panel"
              className="rounded border-2 border-bastion-gold/60 bg-bastion-night/55 px-2.5 py-1 text-base font-display tracking-[0.06em] uppercase text-bastion-parchment hover:border-bastion-gold-bright hover:text-bastion-gold-bright transition-colors focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright"
            >
              {configOpen ? '− Manage floors' : '⚙ Manage floors'}
            </button>
          )}
        </div>
      </div>

      {configOpen && !isPlayer && <FloorConfigPanel bastion={bastion} />}

      <div className="pt-12">
        <ManorFrame>
          <div className="space-y-3" aria-label="Facility floor plan">
            {occupiedFloors.map((floor) => (
              <FloorBand
                key={floor}
                floor={floor}
                label={getFloorLabel(bastion, floor)}
                tiles={byFloor[floor]}
                hirelings={hirelings}
                selectedId={selectedId}
                onSelect={selectFacility}
              />
            ))}
          </div>
        </ManorFrame>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-base text-page-muted">
        <span className="flex items-center gap-1.5">
          <span
            className="heraldic-crest"
            style={{ width: '0.9rem', height: '0.9rem', fontSize: '0.55rem' }}
          >
            ★
          </span>
          special facility
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-bastion-crimson" />
          hireling assigned
        </span>
        <span className="text-page-muted">×N — count of identical rooms</span>
      </div>
    </section>
  )
}
