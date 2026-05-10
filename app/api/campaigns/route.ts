import { randomBytes, randomUUID } from 'node:crypto'

import { desc, eq } from 'drizzle-orm'

import { db } from '../../../db/client'
import { bastions, campaignMembers, campaigns, users } from '../../../db/schema'
import { requireUser } from '../../../lib/server/auth'
import { seedManor } from '../../../src/data/seed'

/**
 * 8-char URL-safe invite code. `randomBytes(6).toString('base64url')` always
 * yields 8 characters with no padding.
 */
function generateInviteCode(): string {
  return randomBytes(6).toString('base64url')
}

/**
 * Insert the Clerk user into our local mirror if it isn't there yet.
 * Foreign keys on `campaigns.dm_user_id` and `campaign_members.user_id`
 * require the row to exist.
 */
async function ensureUser(userId: string): Promise<void> {
  await db.insert(users).values({ id: userId }).onConflictDoNothing()
}

export async function GET() {
  const { userId } = await requireUser()

  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      role: campaignMembers.role,
      bastionId: bastions.id,
      updatedAt: bastions.updatedAt,
    })
    .from(campaignMembers)
    .innerJoin(campaigns, eq(campaigns.id, campaignMembers.campaignId))
    .innerJoin(bastions, eq(bastions.campaignId, campaigns.id))
    .where(eq(campaignMembers.userId, userId))
    .orderBy(desc(bastions.updatedAt))

  return Response.json({ campaigns: rows })
}

export async function POST(req: Request) {
  const { userId } = await requireUser()

  let body: { name?: unknown }
  try {
    body = (await req.json()) as { name?: unknown }
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 })
  }

  if (typeof body?.name !== 'string') {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }
  const trimmed = body.name.trim()
  if (trimmed.length === 0 || trimmed.length >= 80) {
    return Response.json(
      { error: 'name must be 1-79 characters' },
      { status: 400 },
    )
  }

  await ensureUser(userId)

  const campaignId = randomUUID()
  const bastionId = randomUUID()
  const inviteCode = generateInviteCode()

  await db.transaction(async (tx) => {
    await tx.insert(campaigns).values({
      id: campaignId,
      name: trimmed,
      dmUserId: userId,
      inviteCode,
    })
    await tx.insert(campaignMembers).values({
      campaignId,
      userId,
      role: 'dm',
    })
    await tx.insert(bastions).values({
      id: bastionId,
      campaignId,
      name: `${trimmed} bastion`,
      stateJsonb: seedManor(),
      version: 0,
    })
  })

  return Response.json(
    {
      campaign: {
        id: campaignId,
        name: trimmed,
        inviteCode,
        bastionId,
        role: 'dm' as const,
      },
    },
    { status: 201 },
  )
}
