import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Bastion } from '../types'
import { seedManor } from '../data/seed'

interface BastionStore {
  bastion: Bastion
  reset: () => void
}

export const useBastionStore = create<BastionStore>()(
  persist(
    (set) => ({
      bastion: seedManor(),
      reset: () => set({ bastion: seedManor() }),
    }),
    {
      name: 'bastion-planner',
      // Bump on schema changes so dev state from older versions is discarded
      // rather than rehydrated with missing fields.
      version: 2,
    },
  ),
)
