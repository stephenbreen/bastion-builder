import { useEffect, useRef, useState } from 'react'
import { useBastionStore } from '../store/useBastionStore'
import { usePlayerView } from '../lib/view-mode'

export function DmNotesSection() {
  const isPlayer = usePlayerView()
  const dmNotes = useBastionStore((s) => s.bastions[s.activeBastionId].dmNotes ?? '')
  const setDmNotes = useBastionStore((s) => s.setDmNotes)

  const [draft, setDraft] = useState(dmNotes)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    setDraft(dmNotes)
  }, [dmNotes])

  // Debounced commit so every keystroke doesn't churn the store.
  useEffect(() => {
    if (draft === dmNotes) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      setDmNotes(draft)
    }, 400)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [draft, dmNotes, setDmNotes])

  if (isPlayer) return null

  const wordCount = draft.trim() === '' ? 0 : draft.trim().split(/\s+/).length

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-4xl font-bold heading-display font-display tracking-[0.06em]">
            DM Notes
          </h2>
          <span className="text-base uppercase tracking-[0.18em] rounded border border-bastion-crimson/70 bg-bastion-crimson/15 text-bastion-crimson px-2 py-0.5 font-bold">
            DM Only
          </span>
        </div>
        <div className="flex items-center gap-3 text-lg">
          <span className="uppercase tracking-[0.18em] text-page-muted-strong">
            {wordCount} word{wordCount === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="rounded-md border-2 border-bastion-gold bg-bastion-night/60 px-3 py-1 text-lg font-display tracking-[0.06em] uppercase text-bastion-gold-bright hover:bg-bastion-night/40 hover:border-bastion-gold-bright transition-colors focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright"
          >
            {open ? '− Hide notes' : '+ Show notes'}
          </button>
        </div>
      </div>

      {open && (
        <div className="parchment-surface rounded-md border-[3px] border-bastion-oak p-4 shadow-[3px_4px_0_rgba(0,0,0,0.5)]">
          <p className="mb-3 text-lg text-bastion-ink-soft italic leading-relaxed">
            Private DM-side notes — secrets, plot threads, NPC motivations, anything
            the players shouldn't see. Hidden in player view, exported with the
            bastion JSON.
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="The librarian is secretly a doppelganger. The Functional Garden's poison crop is funding a rebel faction. Mira owes a debt to a winter hag…"
            aria-label="DM notes"
            rows={Math.max(8, Math.min(20, draft.split('\n').length + 2))}
            className="w-full rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-3 py-2 text-xl text-bastion-ink leading-relaxed placeholder:text-bastion-ink-mute focus:outline-none focus:ring-2 focus:ring-bastion-crimson resize-y font-serif"
          />
        </div>
      )}
    </section>
  )
}
