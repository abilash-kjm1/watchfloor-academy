import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bookmark, BookOpenCheck, Search } from 'lucide-react'
import { GLOSSARY, glossaryById } from '../data/glossary'
import { lessonById } from '../data'
import { actions, useProgress } from '../progress/store'
import { KqlCode } from '../components/KqlCode'
import { Callout, EmptyState, PageHeader, cx } from '../components/ui'

const CATS: Record<string, string> = { concept: 'Concepts', role: 'Roles', network: 'Networking', windows: 'Windows', identity: 'Identity', product: 'Products', table: 'Tables', kql: 'KQL', mitre: 'MITRE ATT&CK', event: 'Event IDs', process: 'Processes' }
const CAT_COLOR: Record<string, string> = { concept: 'var(--t-foundations)', role: 'var(--t-career)', network: 'var(--t-start)', windows: 'var(--t-microsoft)', identity: 'var(--t-identity)', product: 'var(--t-microsoft)', table: 'var(--t-investigation)', kql: 'var(--t-investigation)', mitre: 'var(--t-cert)', event: 'var(--t-soc)', process: 'var(--t-security)' }

export default function Glossary() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('all')
  const sel = params.get('term')
  const p = useProgress()
  const list = useMemo(() => {
    const ql = q.toLowerCase()
    return GLOSSARY.filter(g => (cat === 'all' || g.category === cat) && (!ql || [g.term, ...(g.aka ?? []), g.definition].join(' ').toLowerCase().includes(ql))).sort((a, b) => a.term.localeCompare(b.term))
  }, [q, cat])
  const g = sel ? glossaryById.get(sel) : null
  useEffect(() => { if (sel) document.getElementById('term-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [sel])
  const marked = g ? p.bookmarks.some(b => b.id === `g:${g.id}`) : false

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Glossary" title="Every term, with why it matters" icon={BookOpenCheck} color="var(--t-foundations)">Each entry links to related concepts, Microsoft products, KQL and the lessons that teach it. Terms inside lessons link here too.</PageHeader>
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div>
          <div className="relative mb-3">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 muted" aria-hidden />
            <input className="input !pl-9" placeholder={`Filter ${GLOSSARY.length} terms…`} value={q} onChange={e => setQ(e.target.value)} aria-label="Filter glossary" />
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
            {['all', ...Object.keys(CATS)].map(c => {
              const on = cat === c
              const color = c === 'all' ? 'var(--accent)' : CAT_COLOR[c]
              return <button key={c} onClick={() => setCat(c)} aria-pressed={on} className="rounded-full border px-2.5 py-0.5 text-xs font-medium transition" style={on ? { background: color, borderColor: color, color: 'var(--surface)' } : { borderColor: `color-mix(in srgb, ${color} 35%, var(--border))`, color }}>{c === 'all' ? 'All' : CATS[c]}</button>
            })}
          </div>
          <div className="mb-2 text-xs muted" aria-live="polite">{list.length} term{list.length === 1 ? '' : 's'}</div>
          <ul className="card max-h-[65vh] divide-y overflow-y-auto scrollbar-thin" style={{ borderColor: 'var(--border)' }}>
            {list.map(t => (
              <li key={t.id} style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => setParams({ term: t.id })} aria-current={sel === t.id ? 'true' : undefined} className={cx('flex w-full gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[var(--surface-2)]', sel === t.id && 'bg-accent-soft')}>
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: CAT_COLOR[t.category] }} aria-hidden />
                  <span className="min-w-0"><span className="block font-medium">{t.term}</span><span className="block truncate text-xs muted">{t.definition}</span></span>
                </button>
              </li>
            ))}
            {list.length === 0 && (
              <li className="p-6 text-center text-sm">
                <div className="font-medium">No terms match “{q}”</div>
                <p className="mt-1 muted">Check the spelling, try a shorter word, or search all categories.</p>
                <button className="btn mt-3 !py-1 text-xs" onClick={() => { setQ(''); setCat('all') }}>Clear filters</button>
              </li>
            )}
          </ul>
        </div>
        <div id="term-detail" className="scroll-mt-20">
          {!g ? (
            <EmptyState icon={BookOpenCheck} color="var(--t-foundations)" title="Pick a term to explore">
              Every entry explains what the term means, why it matters to a SOC analyst, a real example, and where it is taught. Try <button className="text-accent underline" onClick={() => setParams({ term: 'process' })}>Process</button> or <button className="text-accent underline" onClick={() => setParams({ term: 'kql' })}>KQL</button>.
            </EmptyState>
          ) : (
            <article className="card space-y-5 overflow-hidden p-6" style={{ borderTop: `4px solid ${CAT_COLOR[g.category]}` }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: CAT_COLOR[g.category] }}>{CATS[g.category]}</div>
                  <h2 className="mt-1 font-serif text-3xl font-semibold">{g.term}</h2>
                  {g.aka && <div className="mt-1 text-sm muted">Also: {g.aka.join(', ')}</div>}
                </div>
                <button className={cx('btn !p-2', marked && 'text-accent')} onClick={() => actions.toggleBookmark({ id: `g:${g.id}`, kind: 'glossary', title: g.term, href: `/glossary?term=${g.id}` })} aria-label="Bookmark term"><Bookmark size={16} fill={marked ? 'currentColor' : 'none'} /></button>
              </div>
              <p className="text-lg leading-relaxed">{g.definition}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Callout tone="key" title="Why it matters">{g.why}</Callout>
                <Callout tone="analogy" title="Example">{g.example}</Callout>
              </div>
              {g.kql && <div><div className="mb-1 text-sm font-semibold">KQL</div><KqlCode code={g.kql} /></div>}
              {(g.products?.length || g.mitre?.length) ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {g.products?.length ? <div><div className="mb-1 text-sm font-semibold">Microsoft products</div><ul className="prose-lesson text-sm">{g.products.map(x => <li key={x}>{x}</li>)}</ul></div> : null}
                  {g.mitre?.length ? <div><div className="mb-1 text-sm font-semibold">MITRE ATT&CK</div><div className="flex flex-wrap gap-2">{g.mitre.map(x => <a key={x} className="btn !py-1 font-mono text-xs" href={`https://attack.mitre.org/${x.startsWith('TA') ? 'tactics' : 'techniques'}/${x.replace('.', '/')}/`} target="_blank" rel="noopener noreferrer">{x}</a>)}</div></div> : null}
                </div>
              ) : null}
              <div>
                <div className="mb-2 text-sm font-semibold">Related concepts</div>
                <div className="flex flex-wrap gap-2">{g.related.map(r => glossaryById.get(r)).filter(Boolean).map(r => <button key={r!.id} className="btn !py-1 text-sm" onClick={() => setParams({ term: r!.id })}>{r!.term}</button>)}</div>
              </div>
              {g.lessons?.length ? (
                <div>
                  <div className="mb-2 text-sm font-semibold">Taught in</div>
                  <div className="flex flex-wrap gap-2">{g.lessons.map(l => lessonById.get(l)).filter(Boolean).map(l => <Link key={l!.id} className="btn !py-1 text-sm" to={`/lesson/${l!.id}`}>{p.completed[l!.id] ? '✓ ' : ''}{l!.title}</Link>)}</div>
                </div>
              ) : null}
            </article>
          )}
        </div>
      </div>
    </div>
  )
}
