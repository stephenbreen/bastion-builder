'use client'

import { useQuery } from '@tanstack/react-query'
import type { Bastion } from '../types'

export interface BastionFetchResult {
  state: Bastion
  version: number
  historyLength: number
}

async function fetchBastion(bastionId: string): Promise<BastionFetchResult> {
  const res = await fetch(`/api/bastions/${bastionId}`)
  if (!res.ok) {
    throw new Error(`Failed to load bastion ${bastionId}: ${res.status}`)
  }
  return (await res.json()) as BastionFetchResult
}

export function bastionQueryKey(bastionId: string) {
  return ['bastion', bastionId] as const
}

export function useBastion(bastionId: string) {
  const query = useQuery<BastionFetchResult, Error>({
    queryKey: bastionQueryKey(bastionId),
    queryFn: () => fetchBastion(bastionId),
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
    staleTime: 2000,
    enabled: Boolean(bastionId),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  }
}
