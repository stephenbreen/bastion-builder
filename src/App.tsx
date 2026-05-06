import { useBastionStore } from './store/useBastionStore'
import { formatGp, totalInvested, specialSlotsTotal } from './lib/format'

export default function App() {
  const bastion = useBastionStore((s) => s.bastion)
  const reset = useBastionStore((s) => s.reset)

  const invested = totalInvested(bastion.facilities)
  const specialUsed = bastion.facilities.filter((f) => f.class === 'special').length
  const specialMax = specialSlotsTotal(bastion.strongholdLevel)

  return (
    <div className="min-h-full p-6 max-w-5xl mx-auto">
      <header className="border-b border-bastion-stone pb-4 mb-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold text-bastion-gold tracking-wide">
            {bastion.name}
          </h1>
          <div className="text-sm text-bastion-parchment/60">
            Week {bastion.inGameWeek}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-bastion-parchment/80">
          <span>
            Aspect: <span className="text-bastion-gold">{bastion.aspect}</span>
          </span>
          <span>Stronghold L{bastion.strongholdLevel}</span>
          <span>
            Slots: {specialUsed}/{specialMax}
          </span>
          <span>Treasury: {formatGp(bastion.treasury)}</span>
          <span className="text-bastion-parchment/50">Invested: {formatGp(invested)}</span>
        </div>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-bastion-gold mb-3">Facilities</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bastion.facilities.map((f) => {
            const hireling = bastion.hirelings.find((h) => h.id === f.hirelingId)
            return (
              <li
                key={f.id}
                className="border border-bastion-stone bg-bastion-stone/40 rounded p-3"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">
                    {f.name}
                    {f.count && f.count > 1 ? ` ×${f.count}` : ''}
                  </span>
                  <span
                    className={`text-xs uppercase tracking-wider ${
                      f.class === 'special'
                        ? 'text-bastion-gold'
                        : 'text-bastion-parchment/50'
                    }`}
                  >
                    {f.class} · {f.size}
                  </span>
                </div>
                <div className="mt-1 text-xs text-bastion-parchment/60">
                  {formatGp(f.cost * (f.count ?? 1))} · {f.buildTimeDays}d build
                  {hireling ? ` · hireling: ${hireling.name}` : ''}
                </div>
                {f.orders.length > 0 && (
                  <div className="mt-1 text-xs text-bastion-parchment/50">
                    Orders: {f.orders.join(', ')}
                  </div>
                )}
                {f.domainSkillBoosts && f.domainSkillBoosts.length > 0 && (
                  <div className="mt-1 text-xs text-bastion-rust">
                    Boosts:{' '}
                    {f.domainSkillBoosts
                      .map((b) => `${b.skill} +${b.amount}`)
                      .join(', ')}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <footer className="mt-8 text-xs text-bastion-parchment/40 border-t border-bastion-stone pt-3 flex items-center justify-between">
        <span>M1 — types, store, and seed wired up. Next: M2 — header strip polish, M3 — facility grid.</span>
        <button
          type="button"
          onClick={reset}
          className="text-bastion-rust hover:text-bastion-gold underline-offset-2 hover:underline"
        >
          Reset to seed
        </button>
      </footer>
    </div>
  )
}
