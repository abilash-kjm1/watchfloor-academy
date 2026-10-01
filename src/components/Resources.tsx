import { Bookmark, ExternalLink, AlertTriangle } from 'lucide-react'
import type { Resource } from '../data/types'
import { actions, useProgress } from '../progress/store'
import { cx } from './ui'

const KIND_LABEL: Record<Resource['kind'], string> = { primary: 'Primary resource', video: 'Video', docs: 'Official documentation', optional: 'Optional', lab: 'Hands-on lab' }
const ORDER: Resource['kind'][] = ['primary', 'video', 'docs', 'lab', 'optional']

export function ResourceCards({ resources }: { resources: Resource[] }) {
  const p = useProgress()
  const sorted = [...resources].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sorted.map(r => {
        const id = `r:${r.url}`
        const marked = p.bookmarks.some(b => b.id === id)
        return (
          <div key={r.url} className="card flex flex-col p-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">{KIND_LABEL[r.kind]}</span>
              <button className={cx('rounded p-1 hover:bg-[var(--surface-2)]', marked && 'text-accent')} onClick={() => actions.toggleBookmark({ id, kind: 'resource', title: r.title, href: r.url })} aria-label={marked ? 'Remove bookmark' : 'Bookmark resource'}>
                <Bookmark size={14} fill={marked ? 'currentColor' : 'none'} />
              </button>
            </div>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium leading-snug hover:text-accent">
              {r.title} <ExternalLink size={12} className="inline align-baseline" aria-hidden />
            </a>
            <div className="mt-1 text-xs muted">{r.source}</div>
            {r.note && <div className="mt-2 text-sm muted">{r.note}</div>}
            {r.volatile && (
              <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: 'var(--exam)' }}>
                <AlertTriangle size={12} /> Product UI/features change often — check the page date.
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
