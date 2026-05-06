import { HeaderStrip } from './components/HeaderStrip'
import { useBastionStore } from './store/useBastionStore'
import { formatGp } from './lib/format'

export default function App() {
  const bastion = useBastionStore((s) => s.bastion)
  const reset = useBastionStore((s) => s.reset)

  return (
    <div className="min-h-full">
      <HeaderStrip />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <section>
          <h2 className="text-xl font-semibold text-bastion-gold mb-3 font-display tracking-wide">
            Facilities
          </h2>
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
          <span>M2 — header strip wired. Next: M3 — facility grid.</span>
          <button
            type="button"
            onClick={reset}
            className="text-bastion-rust hover:text-bastion-gold underline-offset-2 hover:underline"
          >
            Reset to seed
          </button>
        </footer>
      </main>
    </div>
  )
}
