'use client';
import { useUiStore } from '../store/useUiStore'

/** True when the dashboard is in read-only "player" mode. */
export function usePlayerView(): boolean {
  return useUiStore((s) => s.viewMode === 'player')
}
