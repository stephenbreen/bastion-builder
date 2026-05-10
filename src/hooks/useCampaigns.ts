'use client';
import { useBastionDataStore } from '../store/useBastionDataStore'
import type { Bastion } from '../types'
import type { DeleteResult } from '../store/useBastionDataStore'
import type { ParseResult } from '../store/reducers/transfer'

/**
 * Read access to every bastion. Today this is in-memory; Unit 7 will replace
 * the implementation with a `useQuery(['campaigns'])` call against
 * `/api/campaigns`, but the consumer-facing shape stays the same.
 */
export function useCampaigns(): {
  bastions: Record<string, Bastion>
  activeId: string
  ids: string[]
} {
  const bastions = useBastionDataStore((s) => s.bastions)
  const activeId = useBastionDataStore((s) => s.activeBastionId)
  const ids = Object.keys(bastions).sort((a, b) =>
    bastions[a].name.localeCompare(bastions[b].name),
  )
  return { bastions, activeId, ids }
}

export interface CampaignMutations {
  createBastion: (name?: string) => string
  switchBastion: (id: string) => void
  renameBastion: (id: string, name: string) => void
  duplicateBastion: (id: string, name?: string) => string
  deleteBastion: (id: string) => DeleteResult
  importBastion: (text: string) => ParseResult
}

/**
 * Mutations on the campaign list. Server-state aware once Unit 7 lands; today
 * these go straight to the in-memory data store. Returned object is referentially
 * stable because zustand action references don't change across renders.
 */
export function useCampaignMutations(): CampaignMutations {
  return campaignMutations
}

const store = useBastionDataStore.getState()
const campaignMutations: CampaignMutations = {
  createBastion: store.createBastion,
  switchBastion: store.switchBastion,
  renameBastion: store.renameBastion,
  duplicateBastion: store.duplicateBastion,
  deleteBastion: store.deleteBastion,
  importBastion: store.importBastion,
}
