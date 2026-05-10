import { useEffect } from 'react'

/**
 * True when the keyboard event originated inside an editable field — typing in
 * a text/number/textarea/select shouldn't double as a global shortcut.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return false
}

export interface ShortcutHandlers {
  /** A — advance the in-game week. Skipped when no-op. */
  onAdvanceWeek?: () => void
  /** P — toggle DM/player view. */
  onTogglePlayerView?: () => void
  /** Esc — clear the current facility selection. */
  onClearSelection?: () => void
}

/**
 * Wires global hotkeys: A advance, P player view, Esc clear selection.
 * Modifier-bearing presses (cmd/ctrl/alt) are ignored so we don't shadow
 * browser shortcuts.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return

      switch (e.key) {
        case 'a':
        case 'A':
          if (handlers.onAdvanceWeek) {
            e.preventDefault()
            handlers.onAdvanceWeek()
          }
          break
        case 'p':
        case 'P':
          if (handlers.onTogglePlayerView) {
            e.preventDefault()
            handlers.onTogglePlayerView()
          }
          break
        case 'Escape':
          if (handlers.onClearSelection) {
            e.preventDefault()
            handlers.onClearSelection()
          }
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlers.onAdvanceWeek, handlers.onTogglePlayerView, handlers.onClearSelection])
}
