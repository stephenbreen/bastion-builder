'use client';
import { create } from 'zustand'

export type ViewMode = 'dm' | 'player'

export const THEME_NAMES = ['heraldic', 'parchment', 'violet'] as const
export type ThemeName = (typeof THEME_NAMES)[number]

interface UiStore {
  selectedFacilityId: string | null
  viewMode: ViewMode
  theme: ThemeName

  setViewMode: (mode: ViewMode) => void
  setTheme: (theme: ThemeName) => void
  selectFacility: (id: string | null) => void
  clearSelection: () => void
}

/**
 * Session-only UI state — selection, view mode, theme. Bastion data lives
 * server-side and is accessed via the `useBastion` / `useBastionMutation`
 * hooks; the UI store stays small and unpersisted on purpose (no localStorage
 * dance, no migrations).
 */
export const useUiStore = create<UiStore>()((set) => ({
  selectedFacilityId: null,
  viewMode: 'dm',
  theme: 'heraldic',

  setViewMode: (mode) => set({ viewMode: mode }),
  setTheme: (theme) => set({ theme }),
  selectFacility: (id) => set({ selectedFacilityId: id }),
  clearSelection: () => set({ selectedFacilityId: null }),
}))
