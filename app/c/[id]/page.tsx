import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { BastionView } from './BastionView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignPage({ params }: PageProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }
  const { id } = await params
  return <BastionView campaignId={id} />
}
