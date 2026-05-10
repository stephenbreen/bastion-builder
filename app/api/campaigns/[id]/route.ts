import { eq } from 'drizzle-orm'

import { db } from '../../../../db/client'
import { bastions, campaignMembers, campaigns } from '../../../../db/schema'
import { requireDM, requireUser } from '../../../../lib/server/auth'

async function findBastionForCampaign(
  campaignId: string,
): Promise<{ bastionId: string; campaign: typeof campaigns.$inferSelect } | null> {
  const rows = await db
    .select({
      bastionId: bastions.id,
      campaign: campaigns,
    })
    .from(campaigns)
    .innerJoin(bastions, eq(bastions.campaignId, campaigns.id))
    .where(eq(campaigns.id, campaignId))
    .limit(1)

  return rows[0] ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await requireUser()
  const { id } = await params

  const found = await findBastionForCampaign(id)
  if (!found) {
    return Response.json({ error: 'not found' }, { status: 404 })
  }

  await requireDM(found.bastionId, userId)

  const members = await db
    .select({
      userId: campaignMembers.userId,
      role: campaignMembers.role,
      joinedAt: campaignMembers.joinedAt,
    })
    .from(campaignMembers)
    .where(eq(campaignMembers.campaignId, id))

  return Response.json({
    campaign: {
      id: found.campaign.id,
      name: found.campaign.name,
      dmUserId: found.campaign.dmUserId,
      inviteCode: found.campaign.inviteCode,
      createdAt: found.campaign.createdAt,
      bastionId: found.bastionId,
    },
    members,
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await requireUser()
  const { id } = await params

  const found = await findBastionForCampaign(id)
  if (!found) {
    return Response.json({ error: 'not found' }, { status: 404 })
  }

  await requireDM(found.bastionId, userId)

  // FKs in db/schema.ts use `onDelete: 'cascade'` for both bastions and
  // campaign_members, so deleting the campaign removes everything.
  await db.delete(campaigns).where(eq(campaigns.id, id))

  return new Response(null, { status: 204 })
}
