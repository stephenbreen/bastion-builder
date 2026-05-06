import { useBastionStore } from '../store/useBastionStore'
import { FacilityTile } from './FacilityTile'

export function FacilityGrid() {
  const facilities = useBastionStore((s) => s.bastion.facilities)
  const hirelings = useBastionStore((s) => s.bastion.hirelings)

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xl font-semibold text-bastion-gold font-display tracking-wide">
          Floor plan
        </h2>
        <span className="text-xs text-bastion-parchment/40">
          {facilities.length} facilities
        </span>
      </div>

      <div
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 auto-rows-[5.5rem]"
        aria-label="Facility floor plan"
      >
        {facilities.map((facility) => {
          const hireling = facility.hirelingId
            ? hirelings.find((h) => h.id === facility.hirelingId)
            : undefined
          return (
            <FacilityTile
              key={facility.id}
              facility={facility}
              hireling={hireling}
            />
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.65rem] text-bastion-parchment/40">
        <span className="flex items-center gap-1">
          <span className="text-bastion-gold">★</span> special facility
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-bastion-rust" />
          hireling assigned
        </span>
        <span>×N — count of identical rooms</span>
      </div>
    </section>
  )
}
