import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Top-level error boundary so a render-time crash doesn't blank the page
 * mid-session. Persisted state stays in localStorage either way; the user
 * can usually recover by reloading.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface in the console for debugging — there's no remote logging here.
    console.error('Bastion Planner crashed:', error, info)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    if (
      window.confirm(
        'Wipe persisted state and reload? Use this only if the app keeps crashing on load. Export first if you can.',
      )
    ) {
      try {
        window.localStorage.removeItem('bastion-planner')
      } catch {
        // ignore — private mode etc.
      }
      window.location.reload()
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-full p-8 flex items-start justify-center">
          <div className="parchment-surface max-w-2xl w-full rounded-md border-[3px] border-bastion-oak p-6 shadow-[3px_4px_0_rgba(0,0,0,0.5)]">
            <h1 className="font-display text-3xl heading-display mb-3">
              Something went sideways
            </h1>
            <p className="text-lg text-bastion-ink leading-relaxed mb-3">
              The planner hit an unexpected error and couldn't render. Your
              persisted state is still safe in browser storage. Try reloading
              first; if the crash repeats, you may need to wipe the saved
              state.
            </p>
            <pre className="bg-bastion-parchment-warm/60 border border-bastion-oak/60 rounded p-2 text-sm text-bastion-ink-soft whitespace-pre-wrap overflow-auto max-h-48 mb-4">
              {this.state.error.message}
            </pre>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-md border-2 border-bastion-gold bg-bastion-night/60 px-3 py-1.5 text-base font-display tracking-[0.06em] uppercase text-bastion-gold-bright hover:bg-bastion-night/40 hover:border-bastion-gold-bright focus:outline-none focus:ring-2 focus:ring-bastion-gold-bright"
              >
                Reload
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="rounded-md border-2 border-bastion-crimson px-3 py-1.5 text-base uppercase tracking-wider text-bastion-crimson hover:bg-bastion-crimson hover:text-bastion-parchment transition-colors focus:outline-none focus:ring-2 focus:ring-bastion-crimson"
              >
                Wipe state &amp; reload
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
