import { auth, currentUser } from '@clerk/nextjs/server'
import { and, eq, type SQL } from 'drizzle-orm'

import { db } from '../../db/client'
import { bastions, campaignMembers } from '../../db/schema'

type Role = 'dm' | 'player'

function httpError(status: number, error: string): never {
  throw new Response(JSON.stringify({ error }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

async function lookupMembership(
  bastionId: string,
  userId: string,
  extra?: SQL,
): Promise<{ role: Role } | undefined> {
  const where = extra
    ? and(eq(bastions.id, bastionId), eq(campaignMembers.userId, userId), extra)
    : and(eq(bastions.id, bastionId), eq(campaignMembers.userId, userId))

  const rows = await db
    .select({ role: campaignMembers.role })
    .from(campaignMembers)
    .innerJoin(bastions, eq(bastions.campaignId, campaignMembers.campaignId))
    .where(where)
    .limit(1)

  return rows[0] as { role: Role } | undefined
}

/**
 * Ensure the request is authenticated. Throws a 401 `Response` if no user.
 */
export async function requireUser(): Promise<{
  userId: string
  user: Awaited<ReturnType<typeof currentUser>>
}> {
  const { userId } = await auth()
  if (!userId) httpError(401, 'unauthorized')
  const user = await currentUser()
  return { userId, user }
}

/**
 * Ensure `userId` is a member of the campaign that owns `bastionId`.
 * Returns `{ role }` so callers can branch on DM vs player.
 * Throws 403 if no membership row exists.
 */
export async function requireCampaignMember(
  bastionId: string,
  userId: string,
): Promise<{ role: Role }> {
  const row = await lookupMembership(bastionId, userId)
  if (!row) httpError(403, 'forbidden')
  return row
}

/**
 * Ensure `userId` is the DM of the campaign that owns `bastionId`.
 * Throws 403 if no row, or if the member is not a DM.
 */
export async function requireDM(
  bastionId: string,
  userId: string,
): Promise<{ role: 'dm' }> {
  const row = await lookupMembership(bastionId, userId, eq(campaignMembers.role, 'dm'))
  if (!row) httpError(403, 'forbidden')
  return { role: 'dm' }
}
