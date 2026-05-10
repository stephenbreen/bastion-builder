import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'

// NOTE: These imports depend on parallel Phase B units:
//   - `db/schema.ts` + `db/client.ts` come from Unit 1.
//   - `lib/server/auth.ts` comes from Unit 3.
// `pnpm tsc --noEmit` will error here pre-merge — this is expected.
import { db } from '@/db/client'
import { bastions, campaignMembers, campaigns } from '@/db/schema'
import { requireUser } from '@/lib/server/auth'

import { migratePersistedState } from '../../../../src/store/persist-migrate'
import { parseImport } from '../../../../src/store/reducers/transfer'
import type { Bastion } from '../../../../src/types'

export const runtime = 'nodejs'

const MAX_BASTIONS = 50
const MAX_BASTION_BYTES = 1_000_000 // 1 MB per state_jsonb
const SUPPORTED_PERSIST_VERSIONS = new Set([8, 9, 10])

type ImportedCampaign = {
  id: number
  name: string
  bastionId: number
}

type ParsedPayload = {
  state: Record<string, unknown>
  version: number
}

/**
 * Coerce the incoming body into `{ state, version }`. We accept two shapes:
 *   1. `{ payload: "<raw JSON string from localStorage>" }`
 *   2. `{ payload: { state, version } }` (already parsed)
 */
function coercePayload(raw: unknown): ParsedPayload | { error: string } {
  if (!raw || typeof raw !== 'object') {
    return { error: 'Request body must be a JSON object.' }
  }
  const payload = (raw as { payload?: unknown }).payload
  if (payload === undefined) {
    return { error: 'Missing `payload` field.' }
  }

  let parsed: unknown = payload
  if (typeof payload === 'string') {
    try {
      parsed = JSON.parse(payload)
    } catch (e) {
      return { error: `payload is not valid JSON: ${(e as Error).message}` }
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { error: 'payload must decode to an object.' }
  }
  const obj = parsed as { state?: unknown; version?: unknown }
  if (!obj.state || typeof obj.state !== 'object') {
    return { error: 'payload.state must be an object.' }
  }
  if (typeof obj.version !== 'number' || !Number.isFinite(obj.version)) {
    return { error: 'payload.version must be a number.' }
  }
  return { state: obj.state as Record<string, unknown>, version: obj.version }
}

function generateInviteCode(): string {
  return randomBytes(6).toString('base64url')
}

function bytesOf(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), 'utf8')
}

function badRequest(error: string, status = 400): NextResponse {
  return NextResponse.json({ error }, { status })
}

export async function POST(request: Request) {
  const { userId } = await requireUser()

  let body: unknown
  try {
    body = await request.json()
  } catch (e) {
    return badRequest(`Invalid JSON body: ${(e as Error).message}`)
  }
  const coerced = coercePayload(body)
  if ('error' in coerced) return badRequest(coerced.error)

  if (!SUPPORTED_PERSIST_VERSIONS.has(coerced.version)) {
    return badRequest(
      `Unsupported persist version: ${coerced.version}. Supported: 8, 9, 10.`,
    )
  }

  const migrated = migratePersistedState(coerced.state, coerced.version)
  if (!migrated) {
    return badRequest('Could not migrate payload — missing bastions/activeBastionId.')
  }

  const entries = Object.entries(migrated.bastions)
  if (entries.length === 0) return badRequest('No bastions found in payload.')
  if (entries.length > MAX_BASTIONS) {
    return badRequest(
      `Too many bastions (${entries.length}); max is ${MAX_BASTIONS}.`,
    )
  }

  const validated: { name: string; bastion: Bastion }[] = []
  for (const [bid, raw] of entries) {
    const result = parseImport(raw)
    if (!result.ok) {
      return badRequest(`Bastion "${bid}" failed validation: ${result.reason}`)
    }
    const size = bytesOf(result.bastion)
    if (size > MAX_BASTION_BYTES) {
      return badRequest(
        `Bastion "${bid}" is too large (${size} bytes; max ${MAX_BASTION_BYTES}).`,
        413,
      )
    }
    validated.push({
      name: result.bastion.name || `Imported bastion ${bid}`,
      bastion: result.bastion,
    })
  }

  // One transaction so partial failures don't leave orphaned rows.
  const imported: ImportedCampaign[] = await db.transaction(async (tx) => {
    const out: ImportedCampaign[] = []
    for (const { name, bastion } of validated) {
      const inviteCode = generateInviteCode()
      const [campaignRow] = await tx
        .insert(campaigns)
        .values({
          name,
          dmUserId: userId,
          inviteCode,
        })
        .returning({ id: campaigns.id, name: campaigns.name })
      await tx.insert(campaignMembers).values({
        campaignId: campaignRow.id,
        userId,
        role: 'dm',
      })
      const [bastionRow] = await tx
        .insert(bastions)
        .values({
          campaignId: campaignRow.id,
          name,
          stateJsonb: bastion,
          version: 0,
        })
        .returning({ id: bastions.id })
      out.push({
        id: campaignRow.id,
        name: campaignRow.name,
        bastionId: bastionRow.id,
      })
    }
    return out
  })

  return NextResponse.json({ campaigns: imported }, { status: 201 })
}
