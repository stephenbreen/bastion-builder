'use client'

import App from '../../../src/App'
import { ErrorBoundary } from '../../../src/components/ErrorBoundary'

// `campaignId` is wired in here so Unit 8 can resolve the bastion ID via
// `useBastion` and feed the cloud state into App. For Unit 7 we just render
// the existing local-state App inside the campaign route.
export function BastionView({ campaignId: _campaignId }: { campaignId: string }) {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}
