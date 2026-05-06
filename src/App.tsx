import { FacilityGrid } from './components/FacilityGrid'
import { HeaderStrip } from './components/HeaderStrip'
import { useBastionStore } from './store/useBastionStore'

export default function App() {
  const reset = useBastionStore((s) => s.reset)

  return (
    <div className="min-h-full">
      <HeaderStrip />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <FacilityGrid />

        <footer className="mt-10 text-xs text-bastion-parchment/40 border-t border-bastion-stone pt-3 flex items-center justify-between">
          <span>M3 — facility grid wired. Next: M4 — facility panel on tile click.</span>
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
