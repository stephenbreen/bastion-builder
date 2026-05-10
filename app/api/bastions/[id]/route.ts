import { eq, sql } from 'drizzle-orm'

import { db } from '../../../../db/client'
import { bastions } from '../../../../db/schema'
import {
  requireCampaignMember,
  requireDM,
  requireUser,
} from '../../../../lib/server/auth'
import {
  emptyWeeklyCosts,
  WEEKLY_COST_KEYS,
  type Bastion,
  type WeeklyCostKey,
  type WeeklyCosts,
} from '../../../../src/types/bastion'

const SCALAR_FIELDS = ['name', 'treasury', 'dmNotes', 'weeklyCosts'] as const
type ScalarField = (typeof SCALAR_FIELDS)[number]

function isScalarField(key: string): key is ScalarField {
  return (SCALAR_FIELDS as readonly string[]).includes(key)
}

function isWeeklyCostKey(key: string): key is WeeklyCostKey {
  return (WEEKLY_COST_KEYS as readonly string[]).includes(key)
}

class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status })
  }
  console.error('[api/bastions/[id]] unexpected error', err)
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function looksLikeBastion(value: unknown): value is Bastion {
  return (
    isPlainObject(value) &&
    Array.isArray(value.facilities) &&
    typeof value.inGameWeek === 'number'
  )
}

function validateWeeklyCostsPatch(value: unknown): Partial<WeeklyCosts> {
  if (!isPlainObject(value)) {
    throw new HttpError(400, 'weeklyCosts must be an object')
  }
  const out: Partial<WeeklyCosts> = {}
  for (const [key, raw] of Object.entries(value)) {
    if (key === 'upkeepNotes') {
      if (raw !== undefined && typeof raw !== 'string') {
        throw new HttpError(400, 'weeklyCosts.upkeepNotes must be a string')
      }
      out.upkeepNotes = raw as string | undefined
      continue
    }
    if (!isWeeklyCostKey(key)) {
      throw new HttpError(400, `Unknown weeklyCosts field: ${key}`)
    }
    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      throw new HttpError(400, `weeklyCosts.${key} must be a finite number`)
    }
    out[key] = raw
  }
  return out
}

interface ScalarPatch {
  name?: string
  treasury?: number
  dmNotes?: string
  weeklyCosts?: Partial<WeeklyCosts>
}

function parseScalarPatch(body: Record<string, unknown>): ScalarPatch {
  const patch: ScalarPatch = {}
  for (const [key, value] of Object.entries(body)) {
    if (!isScalarField(key)) {
      throw new HttpError(400, `Unsupported field: ${key}`)
    }
    if (key === 'name') {
      if (typeof value !== 'string') {
        throw new HttpError(400, 'name must be a string')
      }
      patch.name = value
    } else if (key === 'treasury') {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new HttpError(400, 'treasury must be a finite number')
      }
      patch.treasury = value
    } else if (key === 'dmNotes') {
      if (typeof value !== 'string') {
        throw new HttpError(400, 'dmNotes must be a string')
      }
      patch.dmNotes = value
    } else if (key === 'weeklyCosts') {
      patch.weeklyCosts = validateWeeklyCostsPatch(value)
    }
  }
  return patch
}

function applyScalarPatch(current: Bastion, patch: ScalarPatch): Bastion {
  const next: Bastion = { ...current }
  if (patch.name !== undefined) next.name = patch.name
  if (patch.treasury !== undefined) next.treasury = patch.treasury
  if (patch.dmNotes !== undefined) next.dmNotes = patch.dmNotes
  if (patch.weeklyCosts !== undefined) {
    next.weeklyCosts = {
      ...emptyWeeklyCosts(),
      ...(current.weeklyCosts ?? {}),
      ...patch.weeklyCosts,
    }
  }
  return next
}

async function loadBastionRow(id: string) {
  const rows = await db
    .select()
    .from(bastions)
    .where(eq(bastions.id, id))
    .limit(1)
  const row = rows[0]
  if (!row) {
    throw new HttpError(404, 'Bastion not found')
  }
  return row
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { userId } = await requireUser()
    await requireCampaignMember(id, userId)
    const row = await loadBastionRow(id)
    const history = (row.historyJsonb as unknown[] | null) ?? []
    return Response.json({
      state: row.stateJsonb,
      version: row.version,
      historyLength: Array.isArray(history) ? history.length : 0,
    })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { userId } = await requireUser()
    await requireDM(id, userId)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      throw new HttpError(400, 'Invalid JSON body')
    }
    if (!isPlainObject(body)) {
      throw new HttpError(400, 'Body must be a JSON object')
    }

    let nextState: Bastion
    if ('replaceState' in body) {
      const extraKeys = Object.keys(body).filter((k) => k !== 'replaceState')
      if (extraKeys.length > 0) {
        throw new HttpError(
          400,
          'replaceState cannot be combined with other fields',
        )
      }
      if (!looksLikeBastion(body.replaceState)) {
        throw new HttpError(400, 'replaceState is not a valid Bastion')
      }
      nextState = body.replaceState
    } else {
      const patch = parseScalarPatch(body)
      if (Object.keys(patch).length === 0) {
        throw new HttpError(400, 'Patch body is empty')
      }
      const row = await loadBastionRow(id)
      nextState = applyScalarPatch(row.stateJsonb as Bastion, patch)
    }

    const updated = await db
      .update(bastions)
      .set({
        stateJsonb: nextState,
        version: sql`${bastions.version} + 1`,
      })
      .where(eq(bastions.id, id))
      .returning()

    const updatedRow = updated[0]
    if (!updatedRow) {
      throw new HttpError(404, 'Bastion not found')
    }

    return Response.json({
      state: updatedRow.stateJsonb,
      version: updatedRow.version,
    })
  } catch (err) {
    return errorResponse(err)
  }
}
