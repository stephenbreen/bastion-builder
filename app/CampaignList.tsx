'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CampaignSummary {
  id: string | number
  name: string
  role?: 'dm' | 'player'
  bastionId?: string | number
  bastionName?: string
  updatedAt?: string
}

interface CampaignsResponse {
  campaigns: CampaignSummary[]
}

async function fetchCampaigns(): Promise<CampaignsResponse> {
  const res = await fetch('/api/campaigns')
  if (!res.ok) {
    throw new Error(`Failed to load campaigns: ${res.status}`)
  }
  return (await res.json()) as CampaignsResponse
}

async function importFromLocal(): Promise<CampaignsResponse> {
  const raw = localStorage.getItem('bastion-planner')
  if (!raw) {
    throw new Error('No local bastion data found in this browser.')
  }
  const payload = JSON.parse(raw) as unknown
  const res = await fetch('/api/campaigns/import-from-local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  })
  if (!res.ok) {
    throw new Error(`Import failed: ${res.status}`)
  }
  return (await res.json()) as CampaignsResponse
}

export function CampaignList() {
  const router = useRouter()
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const { data, isLoading, error, refetch } = useQuery<CampaignsResponse, Error>({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
  })

  const handleImport = async () => {
    setImportError(null)
    setImporting(true)
    try {
      const result = await importFromLocal()
      const first = result.campaigns[0]
      if (first) {
        router.push(`/c/${first.id}`)
      } else {
        await refetch()
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-bastion-gold-bright tracking-[0.08em] uppercase mb-6">
        Your Campaigns
      </h1>

      {isLoading && (
        <p className="text-page-muted-strong">Loading campaigns…</p>
      )}

      {error && (
        <p className="text-bastion-crimson">
          Could not load campaigns: {error.message}
        </p>
      )}

      {!isLoading && !error && data && data.campaigns.length === 0 && (
        <div className="rounded border-2 border-bastion-gold/60 bg-bastion-parchment/10 p-6 space-y-4">
          <p className="text-page-muted-strong">
            You don&apos;t have any campaigns yet. If you used Bastion Planner
            on this browser before signing in, you can import that saved
            bastion into a new cloud campaign.
          </p>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="rounded border-2 border-bastion-gold-bright bg-bastion-gold-bright/15 text-bastion-gold-bright px-4 py-2 font-display tracking-[0.08em] uppercase hover:bg-bastion-gold-bright/25 disabled:opacity-50"
          >
            {importing ? 'Importing…' : 'Import from this browser'}
          </button>
          {importError && (
            <p className="text-bastion-crimson text-sm">{importError}</p>
          )}
        </div>
      )}

      {!isLoading && !error && data && data.campaigns.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.campaigns.map((c) => (
            <li key={String(c.id)}>
              <Link
                href={`/c/${c.id}`}
                className="block rounded border-2 border-bastion-gold/60 bg-bastion-parchment/10 p-4 hover:border-bastion-gold-bright transition-colors"
              >
                <div className="font-display text-xl text-bastion-gold-bright tracking-[0.06em]">
                  {c.name}
                </div>
                {c.bastionName && (
                  <div className="text-page-muted-strong text-sm mt-1">
                    {c.bastionName}
                  </div>
                )}
                {c.role && (
                  <div className="text-page-muted-strong text-xs uppercase tracking-[0.2em] mt-2">
                    {c.role}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
