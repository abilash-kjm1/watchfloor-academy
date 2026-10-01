import { Component, type ReactNode } from 'react'
import { ErrorState } from './ui'

/** Catches render errors (and failed page-chunk loads) and explains what to do instead of showing a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }
  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const chunk = /dynamically imported module|Failed to fetch|Loading chunk/i.test(error.message)
    return (
      <div className="mx-auto max-w-2xl py-10">
        <ErrorState
          title={chunk ? 'This page couldn’t be downloaded' : 'Something went wrong on this page'}
          what={chunk ? 'Part of the site failed to load, so this page can’t be shown.' : 'The page hit an unexpected error and stopped rendering. Your progress, notes and bookmarks are safe.'}
          why={chunk ? 'Usually a dropped internet connection, or the site was updated while this tab was open.' : <>Most likely a bug in the academy. Details: <code className="font-mono text-sm">{error.message}</code></>}
          fix={chunk ? 'Check your connection, then reload the page.' : 'Reload the page. If it keeps happening, go back to the curriculum and open the page again.'}
          actions={<><button className="btn btn-primary" onClick={() => location.reload()}>Reload page</button><a className="btn" href="#/curriculum">Go to curriculum</a></>}
        />
      </div>
    )
  }
}

/** Lightweight placeholder shown while a page's code loads. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse" aria-busy="true" aria-label="Loading page">
      <div className="h-40 rounded-3xl surface-2" />
      <div className="mt-8 h-5 w-1/3 rounded-full surface-2" />
      <div className="mt-4 space-y-3">{[0, 1, 2, 3].map(i => <div key={i} className="h-4 rounded-full surface-2" style={{ width: `${92 - i * 9}%` }} />)}</div>
    </div>
  )
}
