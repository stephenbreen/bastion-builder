import { useEffect } from 'react'
import { BuildCatalogue } from './components/BuildCatalogue'
import { DmNotesSection } from './components/DmNotesSection'
import { DomainSection } from './components/DomainSection'
import { FacilityGrid } from './components/FacilityGrid'
import { FacilityPanel } from './components/FacilityPanel'
import { FollowersSection } from './components/FollowersSection'
import { HeaderStrip } from './components/HeaderStrip'
import { HomebrewRoomsSection } from './components/HomebrewRoomsSection'
import { ImportExport } from './components/ImportExport'
import { PCsSection } from './components/PCsSection'
import { ProjectsSection } from './components/ProjectsSection'
import { WeeklyCostsSection } from './components/WeeklyCostsSection'
import { XanatharActivities } from './components/XanatharActivities'
import {
  THEME_NAMES,
  useBastionStore,
  type ThemeName,
} from './store/useBastionStore'
import { usePlayerView } from './lib/view-mode'

const THEME_LABELS: Record<ThemeName, string> = {
  heraldic: 'Heraldic',
  parchment: 'Parchment',
  violet: 'Violet',
}

function ThemeToggle() {
  const theme = useBastionStore((s) => s.theme)
  const setTheme = useBastionStore((s) => s.setTheme)

  return (
    <div
      className="flex items-center gap-1 text-sm uppercase tracking-[0.18em]"
      role="radiogroup"
      aria-label="Theme"
    >
      <span className="text-page-muted-strong mr-1">Theme</span>
      {THEME_NAMES.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={theme === t}
          onClick={() => setTheme(t)}
          className={[
            'rounded border px-2 py-0.5 transition-colors',
            theme === t
              ? 'border-bastion-gold-bright bg-bastion-gold-bright/20 text-bastion-gold-bright font-semibold'
              : 'border-bastion-gold/60 text-page-muted-strong hover:text-bastion-gold-bright hover:border-bastion-gold-bright',
          ].join(' ')}
        >
          {THEME_LABELS[t]}
        </button>
      ))}
    </div>
  )
}

function ViewToggle() {
  const viewMode = useBastionStore((s) => s.viewMode)
  const setViewMode = useBastionStore((s) => s.setViewMode)
  const isPlayer = viewMode === 'player'

  return (
    <button
      type="button"
      onClick={() => setViewMode(isPlayer ? 'dm' : 'player')}
      className={[
        'rounded border-2 px-3 py-1 text-base font-display tracking-[0.08em] uppercase transition-colors',
        isPlayer
          ? 'border-bastion-gold-bright bg-bastion-gold-bright/15 text-bastion-gold-bright hover:bg-bastion-gold-bright/25'
          : 'border-bastion-azure text-bastion-azure hover:bg-bastion-azure/10',
      ].join(' ')}
    >
      {isPlayer ? 'Exit player view' : 'Player view'}
    </button>
  )
}

function PlayerViewBanner() {
  return (
    <div className="bg-bastion-gold-bright/15 border-b-2 border-bastion-gold-bright text-center py-1.5 text-sm uppercase tracking-[0.25em] text-bastion-gold-bright font-semibold">
      Read-only player view · DM controls hidden ·{' '}
      <span className="normal-case tracking-wider text-bastion-gold-bright/85">
        share by screen-cast or passing this tab
      </span>
    </div>
  )
}

export default function App() {
  const reset = useBastionStore((s) => s.reset)
  const theme = useBastionStore((s) => s.theme)
  const isPlayer = usePlayerView()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleReset = () => {
    const ok = window.confirm(
      'Reset to the seeded manor? This will discard all current state, including builds, treasury edits, and log entries. Export first if you want to keep it.',
    )
    if (ok) reset()
  }

  return (
    <div className="min-h-full">
      {isPlayer && <PlayerViewBanner />}
      <HeaderStrip />

      <main className="max-w-6xl mx-auto px-3 py-8">
        {!isPlayer && <BuildCatalogue />}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:items-start">
          <FacilityGrid />
          <FacilityPanel />
        </div>

        <DomainSection />

        <WeeklyCostsSection />

        <PCsSection />

        <FollowersSection />

        <ProjectsSection />

        <XanatharActivities />

        <HomebrewRoomsSection />

        <DmNotesSection />

        <footer className="mt-12 pt-4 border-t-2 border-bastion-gold/30 flex items-center justify-between gap-4 flex-wrap text-base">
          {isPlayer ? <span /> : <ImportExport />}
          <div className="flex items-center gap-3 flex-wrap">
            <ThemeToggle />
            <ViewToggle />
            {!isPlayer && (
              <button
                type="button"
                onClick={handleReset}
                className="text-bastion-crimson hover:text-bastion-gold-bright transition-colors underline-offset-4 decoration-dotted hover:underline font-semibold"
              >
                Reset to seed
              </button>
            )}
          </div>
        </footer>
      </main>
    </div>
  )
}
