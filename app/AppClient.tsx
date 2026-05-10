'use client'

import App from '../src/App'
import { ErrorBoundary } from '../src/components/ErrorBoundary'

export function AppClient() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}
