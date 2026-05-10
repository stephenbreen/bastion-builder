'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Bastion } from '../types'
import { bastionQueryKey, type BastionFetchResult } from './useBastion'

/**
 * Fields a caller may PATCH on a bastion. `replaceState` swaps the full state
 * blob; the scalar fields are passed through to the API for partial updates.
 */
export interface BastionMutationInput {
  replaceState?: Bastion
  name?: string
  treasury?: number
  inGameWeek?: number
  dmNotes?: string
}

async function patchBastion(
  bastionId: string,
  input: BastionMutationInput,
): Promise<BastionFetchResult> {
  const res = await fetch(`/api/bastions/${bastionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Failed to update bastion ${bastionId}: ${res.status}`)
  }
  return (await res.json()) as BastionFetchResult
}

export function useBastionMutation(bastionId: string) {
  const queryClient = useQueryClient()
  const key = bastionQueryKey(bastionId)

  return useMutation<
    BastionFetchResult,
    Error,
    BastionMutationInput,
    { previous: BastionFetchResult | undefined }
  >({
    mutationFn: (input) => patchBastion(bastionId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<BastionFetchResult>(key)
      if (previous) {
        const { replaceState, ...scalarPatch } = input
        const nextState: Bastion = replaceState ?? {
          ...previous.state,
          ...scalarPatch,
        }
        queryClient.setQueryData<BastionFetchResult>(key, {
          ...previous,
          state: nextState,
        })
      }
      return { previous }
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
