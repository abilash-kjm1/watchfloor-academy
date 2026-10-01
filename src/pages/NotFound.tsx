import { Link, useLocation } from 'react-router-dom'
import { Compass, Home, Library, Search } from 'lucide-react'

/** Helpful 404: what happened, why, and how to get back on track. */
export default function NotFound() {
  const loc = useLocation()
  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="card overflow-hidden" role="alert">
        <div className="relative px-6 py-10 text-center mesh">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl animate-float" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }} aria-hidden><Compass size={30} /></div>
          <div className="mt-4 font-mono text-xs font-semibold tracking-widest muted">ERROR 404</div>
          <h1 className="mt-1 font-serif text-3xl font-semibold">Nothing logged at this address</h1>
        </div>
        <dl className="space-y-4 px-6 py-6 text-[15px]">
          <div className="grid gap-1 sm:grid-cols-[120px_1fr]"><dt className="text-xs font-semibold uppercase tracking-wide muted">What happened</dt><dd>There is no page at <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-sm">{loc.pathname}</code>.</dd></div>
          <div className="grid gap-1 sm:grid-cols-[120px_1fr]"><dt className="text-xs font-semibold uppercase tracking-wide muted">Why</dt><dd>The link may be mistyped, or a lesson may have been renamed as the course grew.</dd></div>
          <div className="grid gap-1 sm:grid-cols-[120px_1fr]"><dt className="text-xs font-semibold uppercase tracking-wide muted">How to fix</dt><dd>Search for the topic (press <kbd className="rounded border border-base px-1.5 text-xs">Ctrl K</kbd>), or pick it from the curriculum.</dd></div>
        </dl>
        <div className="flex flex-wrap gap-2 border-t border-base px-6 py-4">
          <Link className="btn btn-primary" to="/curriculum"><Library size={16} aria-hidden /> Browse the curriculum</Link>
          <button className="btn" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}><Search size={16} aria-hidden /> Search</button>
          <Link className="btn" to="/"><Home size={16} aria-hidden /> Home</Link>
        </div>
      </div>
    </div>
  )
}
