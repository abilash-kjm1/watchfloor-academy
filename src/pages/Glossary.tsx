import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { GLOSSARY, glossaryById } from '../data/glossary'
import { lessonById } from '../data'
import { actions, useProgress } from '../progress/store'
import { KqlCode } from '../components/KqlCode'
import { PageHeader, cx } from '../components/ui'

const CATS: Record<string, string> = { concept: 'Concepts', role: 'Roles', network: 'Networking', windows: 'Windows', identity: 'Identity', product: 'Products', table: 'Tables', kql: 'KQL', mitre: 'MITRE ATT&CK', event: 'Event IDs', process: 'Processes' }

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
      <PageHeader eyebrow="Glossary" title="Every term, with why it matters">Each entry links to related concepts, Microsoft products, KQL and the lessons that teach it. Terms inside lessons link here too.</PageHeader>
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div>
          <input className="input mb-3" placeholder={`Filter ${GLOSSARY.length} terms…`} value={q} onChange={e => setQ(e.target.value)} aria-label="Filter glossary" />
          <div className="mb-3 flex flex-wrap gap-1">
            {['all', ...Object.keys(CATS)].map(c => (
              <button key={c} onClick={() => setCat(c)} className={cx('rounded-full border px-2.5 py-0.5 text-xs', cat === c ? 'border-[var(--accent)] bg-accent-soft text-accent' : 'border-base muted')}>{c === 'all' ? 'All' : CATS[c]}</button>
            ))}
          </div>
          <ul className="card max-h-[65vh] divide-y overflow-y-auto scrollbar-thin" style={{ borderColor: 'var(--border)' }}>
            {list.map(t => (
              <li key={t.id} style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => setParams({ term: t.id })} className={cx('w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--surface-2)]', sel === t.id && 'bg-accent-soft')}>
                  <div className="font-medium">{t.term}</div>
                  <div className="truncate text-xs muted">{t.definition}</div>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="p-4 text-sm muted">No matching terms.</li>}
          </ul>
        </div>
        <div id="term-detail" className="scroll-mt-20">
          {!g ? (
            <div className="card p-8 text-sm muted">Select a term to see its explanation.</div>
          ) : (
            <article className="card space-y-5 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-accent">{CATS[g.category]}</div>
                  <h2 className="mt-1 font-serif text-3xl font-semibold">{g.term}</h2>
                  {g.aka && <div className="mt-1 text-sm muted">Also: {g.aka.join(', ')}</div>}
                </div>
                <button className={cx('btn !p-2', marked && 'text-accent')} onClick={() => actions.toggleBookmark({ id: `g:${g.id}`, kind: 'glossary', title: g.term, href: `/glossary?term=${g.id}` })} aria-label="Bookmark term"><Bookmark size={16} fill={marked ? 'currentColor' : 'none'} /></button>
              </div>
              <div><div className="mb-1 text-sm font-semibold">Definition</div><p className="leading-relaxed">{g.definition}</p></div>
              <div><div className="mb-1 text-sm font-semibold">Why it exists / why it matters</div><p className="leading-relaxed">{g.why}</p></div>
              <div><div className="mb-1 text-sm font-semibold">Example</div><p className="leading-relaxed">{g.example}</p></div>
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
