import { useEffect, useRef, useState } from 'react'
import { useBastionStore } from '../store/useBastionStore'
import { usePlayerView } from '../lib/view-mode'

export function BastionSwitcher() {
  const isPlayer = usePlayerView()
  const bastions = useBastionStore((s) => s.bastions)
  const activeId = useBastionStore((s) => s.activeBastionId)
  const switchBastion = useBastionStore((s) => s.switchBastion)
  const createBastion = useBastionStore((s) => s.createBastion)
  const renameBastion = useBastionStore((s) => s.renameBastion)
  const duplicateBastion = useBastionStore((s) => s.duplicateBastion)
  const deleteBastion = useBastionStore((s) => s.deleteBastion)

  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const active = bastions[activeId]
  const allIds = Object.keys(bastions).sort((a, b) =>
    bastions[a].name.localeCompare(bastions[b].name),
  )

  // Click-outside closes the popover.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setRenaming(false)
        setCreating(false)
      }
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  useEffect(() => {
    if ((renaming || creating) && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [renaming, creating])

  if (isPlayer) {
    // In player view, render the manor name as a plain h1.
    return (
      <h1 className="text-5xl font-bold text-bastion-gold-bright tracking-[0.05em] font-display drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
        {active?.name ?? 'Untitled bastion'}
      </h1>
    )
  }

  const startRename = () => {
    setDraftName(active?.name ?? '')
    setRenaming(true)
    setCreating(false)
    setError(null)
  }

  const startCreate = () => {
    setDraftName('New bastion')
    setCreating(true)
    setRenaming(false)
    setError(null)
  }

  const submitRename = () => {
    const trimmed = draftName.trim()
    if (!trimmed) {
      setError('Name cannot be empty.')
      return
    }
    renameBastion(activeId, trimmed)
    setRenaming(false)
    setError(null)
  }

  const submitCreate = () => {
    const trimmed = draftName.trim() || 'New bastion'
    createBastion(trimmed)
    setCreating(false)
    setOpen(false)
    setError(null)
  }

  const handleDuplicate = () => {
    duplicateBastion(activeId)
    setOpen(false)
  }

  const handleDelete = () => {
    if (!window.confirm(`Delete "${active?.name}"? This cannot be undone.`)) return
    const result = deleteBastion(activeId)
    if (!result.ok) {
      setError(result.reason)
    } else {
      setError(null)
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          setRenaming(false)
          setCreating(false)
          setError(null)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-baseline gap-2 text-5xl font-bold text-bastion-gold-bright tracking-[0.05em] font-display drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] hover:brightness-110 transition-all"
        title={`Switch / manage bastions (${Object.keys(bastions).length} total)`}
      >
        <span>{active?.name ?? 'Untitled bastion'}</span>
        <span className="text-xl text-bastion-gold/70" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="parchment-surface absolute z-30 mt-2 w-80 rounded-md border-[3px] border-bastion-oak shadow-[3px_4px_0_rgba(0,0,0,0.5)] p-3"
        >
          <div className="text-sm uppercase tracking-[0.22em] text-bastion-oak font-bold mb-2">
            Bastions
          </div>
          <ul className="space-y-1 mb-3 max-h-56 overflow-y-auto">
            {allIds.map((id) => {
              const isActive = id === activeId
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isActive) switchBastion(id)
                      setOpen(false)
                    }}
                    className={[
                      'w-full text-left rounded px-2 py-1.5 text-lg transition-colors flex items-center justify-between gap-2',
                      isActive
                        ? 'bg-bastion-gold/20 text-bastion-ink font-semibold'
                        : 'text-bastion-ink hover:bg-bastion-parchment-warm',
                    ].join(' ')}
                  >
                    <span className="truncate font-serif">{bastions[id].name}</span>
                    <span className="text-sm uppercase tracking-wider text-bastion-ink-soft">
                      W{bastions[id].inGameWeek}
                      {isActive && ' · active'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {(renaming || creating) && (
            <form
              className="mb-3 flex gap-1"
              onSubmit={(e) => {
                e.preventDefault()
                renaming ? submitRename() : submitCreate()
              }}
            >
              <input
                ref={inputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setRenaming(false)
                    setCreating(false)
                    setError(null)
                  }
                }}
                placeholder={renaming ? 'New name' : 'Bastion name'}
                aria-label={renaming ? 'Rename bastion' : 'New bastion name'}
                className="flex-1 rounded border-2 border-bastion-oak bg-bastion-parchment-warm px-2 py-1 text-lg text-bastion-ink focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
              />
              <button
                type="submit"
                className="banner-ribbon rounded px-3 py-1 text-base font-display tracking-[0.08em] uppercase hover:brightness-110 transition-all"
              >
                {renaming ? 'Save' : 'Create'}
              </button>
            </form>
          )}

          {error && (
            <div className="mb-2 rounded border border-bastion-crimson bg-bastion-crimson/10 px-2 py-1 text-base text-bastion-crimson font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5 text-sm uppercase tracking-[0.16em]">
            <button
              type="button"
              onClick={startCreate}
              className="rounded border border-bastion-gold/70 bg-bastion-gold/10 px-2 py-1.5 text-bastion-gold-deep hover:bg-bastion-gold/20 transition-colors"
            >
              + New
            </button>
            <button
              type="button"
              onClick={startRename}
              className="rounded border border-bastion-azure/70 bg-bastion-azure/10 px-2 py-1.5 text-bastion-azure hover:bg-bastion-azure/20 transition-colors"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              className="rounded border border-bastion-verdant/70 bg-bastion-verdant/10 px-2 py-1.5 text-bastion-verdant hover:bg-bastion-verdant/20 transition-colors"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded border border-bastion-crimson/70 bg-bastion-crimson/10 px-2 py-1.5 text-bastion-crimson hover:bg-bastion-crimson hover:text-bastion-parchment transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
