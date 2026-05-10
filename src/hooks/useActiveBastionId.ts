'use client';
import { useParams } from 'next/navigation'
import { useBastionDataStore } from '../store/useBastionDataStore'

/**
 * Returns the active bastion id.
 *
 * Reads the `[id]` URL segment from `useParams()` first (this is the campaign
 * route once Unit 7 lands `/c/[id]/page.tsx`); falls back to the in-memory
 * data store's `activeBastionId` for screens that don't have a URL segment
 * yet (Phase B fallback, single-bastion mode, tests).
 *
 * Returns `undefined` only when neither source has an id — callers should
 * render an empty/loading state in that case.
 */
export function useActiveBastionId(): string | undefined {
  // useParams() returns null in non-app-router contexts (tests).
  const params = useParams<{ id?: string | string[] }>()
  const fromUrl = params?.id
  const urlId = Array.isArray(fromUrl) ? fromUrl[0] : fromUrl
  const fallback = useBastionDataStore((s) => s.activeBastionId)
  return urlId || fallback || undefined
}
