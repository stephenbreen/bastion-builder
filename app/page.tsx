import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { CampaignList } from './CampaignList'

export default async function Page() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }
  return <CampaignList />
}
