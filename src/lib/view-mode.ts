'use client';
import { useBastionStore } from '../store/useBastionStore'

/** True when the dashboard is in read-only "player" mode. */
export function usePlayerView(): boolean {
  return useBastionStore((s) => s.viewMode === 'player')
}
