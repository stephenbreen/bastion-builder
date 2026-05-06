import type { ReactNode } from 'react'
import { useBastionStore } from '../store/useBastionStore'
import {
  formatGp,
  formatWeeksSinceIntrigue,
  nextRenownThreshold,
  specialSlotsTotal,
  totalInvested,
  weeksSinceIntrigue,
} from '../lib/format'

interface StatProps {
  label: string
  value: ReactNode
  muted?: boolean
}

function Stat({ label, value, muted }: StatProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-bastion-parchment/40">
        {label}
      </span>
      <span
        className={`mt-0.5 text-base ${
          muted ? 'text-bastion-parchment/55' : 'text-bastion-parchment'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export function HeaderStrip() {
  const bastion = useBastionStore((s) => s.bastion)

  const invested = totalInvested(bastion.facilities)
  const specialUsed = bastion.facilities.filter((f) => f.class === 'special').length
  const specialMax = specialSlotsTotal(bastion.strongholdLevel)
  const intrigueAge = weeksSinceIntrigue(
    bastion.inGameWeek,
    bastion.lastIntrigueEndedWeek,
  )
  const nextRenown = nextRenownThreshold(bastion.domainRenown)

  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-bastion-shadow/85 border-b border-bastion-stone">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold text-bastion-gold tracking-wide font-display">
              {bastion.name}
            </h1>
            <div className="text-xs text-bastion-parchment/50 mt-1 italic">
              {formatWeeksSinceIntrigue(intrigueAge)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[0.65rem] uppercase tracking-[0.2em] text-bastion-parchment/40">
              In-game
            </div>
            <div className="text-lg text-bastion-parchment/90">Week {bastion.inGameWeek}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-3">
          <Stat label="Aspect" value={<span className="text-bastion-gold">{bastion.aspect}</span>} />
          <Stat label="Stronghold" value={`L${bastion.strongholdLevel}`} />
          <Stat
            label="Slots"
            value={
              <span>
                {specialUsed}
                <span className="text-bastion-parchment/40"> / {specialMax}</span>
              </span>
            }
          />
          <Stat label="Treasury" value={formatGp(bastion.treasury)} />
          <Stat
            label="Renown"
            value={
              nextRenown === null ? (
                <span>
                  {bastion.domainRenown}{' '}
                  <span className="text-bastion-parchment/40 text-xs">(max)</span>
                </span>
              ) : (
                <span>
                  {bastion.domainRenown}
                  <span className="text-bastion-parchment/40"> / {nextRenown}</span>
                </span>
              )
            }
          />
          <Stat label="Invested" value={formatGp(invested)} muted />
        </div>
      </div>
    </header>
  )
}
