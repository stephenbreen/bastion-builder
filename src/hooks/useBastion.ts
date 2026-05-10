'use client';
import { useBastionDataStore } from '../store/useBastionDataStore'
import type { Bastion } from '../types'

export interface BastionResource {
  state: Bastion
  /** Schema version. Server-backed in a later unit; stubbed at 10 here. */
  version: number
  /** Number of rewind snapshots kept locally. */
  historyLength: number
}

export interface UseBastionResult {
  data: BastionResource | undefined
  isLoading: boolean
}

/**
 * Reads the bastion identified by `id`. Phase B implementation is backed by
 * `useBastionDataStore` (in-memory) so component code doesn't have to care
 * where the state lives. Unit 7 swaps this for TanStack Query against
 * `/api/bastions/[id]` — call sites should keep working unchanged because
 * they only see the `BastionResource` shape.
 */
export function useBastion(id: string | undefined): UseBastionResult {
  const bastion = useBastionDataStore((s) =>
    id ? s.bastions[id] : undefined,
  )
  const historyLength = useBastionDataStore((s) =>
    id && id === s.activeBastionId ? s.weekHistory.length : 0,
  )

  if (!id || !bastion) return { data: undefined, isLoading: false }
  return {
    data: { state: bastion, version: 10, historyLength },
    isLoading: false,
  }
}
