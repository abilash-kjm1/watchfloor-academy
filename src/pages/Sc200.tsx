import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, Bookmark, CheckCircle2, ExternalLink, GraduationCap } from 'lucide-react'
import { DOMAINS, OBJECTIVES, SC200_SOURCE, SC200_VERSION, type Objective } from '../data/sc200'
import { moduleById } from '../data/curriculum'
import { ALL_QUESTIONS, lessonById } from '../data'
import { actions, useProgress } from '../progress/store'
import { Callout, ModeBadge, PageHeader, Pill, ProgressRing, cx } from '../components/ui'

const DOMAIN_COLOR = ['var(--t-microsoft)', 'var(--t-identity)', 'var(--t-investigation)', 'var(--t-soc)']
import type { Mode } from '../data/types'
import { ResourceCards } from '../components/Resources'
import { res } from '../data/resources'

function ObjectiveRow({ o }: { o: Objective }) {
  const p = useProgress()
  const qs = ALL_QUESTIONS.filter(q => q.objectives?.includes(o.id))
  const correct = qs.filter(q => p.answers[q.id]?.lastCorrect).length
  const tried = qs.filter(q => p.answers[q.id]).length
  const lessonsDone = o.lessons.filter(l => p.completed[l]).length
  const bm = p.bookmarks.some(b => b.id === `o:${o.id}`)
  const covered = o.lessons.length > 0 && lessonsDone === o.lessons.length
  return (
    <article id={o.id} className="card scroll-mt-28 p-5" style={{ borderLeft: `4px solid ${covered ? 'var(--ok)' : o.lessons.length ? 'var(--t-cert)' : 'var(--border-strong)'}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ModeBadge mode={o.mode} />
            {covered && <Pill color="var(--ok)"><CheckCircle2 size={11} aria-hidden /> Studied</Pill>}
            {!o.lessons.length && <Pill>Docs only</Pill>}
          </div>
          <h3 className="mt-2 font-medium leading-snug">{o.text}</h3>
          <div className="mt-1 text-xs muted">{o.product}</div>
        </div>
        <button className={cx('rounded p-1 hover:bg-[var(--surface-2)]', bm && 'text-accent')} onClick={() => actions.toggleBookmark({ id: `o:${o.id}`, kind: 'objective', title: o.text, href: `/sc200#${o.id}` })} aria-label="Bookmark objective"><Bookmark size={16} fill={bm ? 'currentColor' : 'none'} /></button>
      </div>
      <ol className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <li><div className="text-[11px] font-semibold uppercase tracking-wider muted">1 · Prerequisites</div><div className="mt-1 flex flex-wrap gap-1">{o.prereqs.map(id => moduleById(id)).filter(Boolean).map(m => <Link key={m!.id} to={`/module/${m!.id}`} className="rounded border border-base px-2 py-0.5 text-xs hover:border-[var(--accent)]">{m!.title}</Link>)}</div></li>
        <li><div className="text-[11px] font-semibold uppercase tracking-wider muted">2 · Course lessons {o.lessons.length > 0 && `(${lessonsDone}/${o.lessons.length})`}</div>
          <div className="mt-1 flex flex-wrap gap-1">{o.lessons.length ? o.lessons.map(id => lessonById.get(id)).filter(Boolean).map(l => <Link key={l!.id} to={`/lesson/${l!.id}`} className="rounded border border-base px-2 py-0.5 text-xs hover:border-[var(--accent)]">{p.completed[l!.id] ? '✓ ' : ''}{l!.title}</Link>) : <span className="text-xs" style={{ color: 'var(--exam)' }}>Not yet covered by a lesson — use the official docs.</span>}</div>
        </li>
        <li className="md:col-span-2"><div className="text-[11px] font-semibold uppercase tracking-wider muted">3 · Hands-on lab</div><div className="mt-1">{o.lab}</div></li>
        <li><div className="text-[11px] font-semibold uppercase tracking-wider muted">4 · Practice questions</div><div className="mt-1">{qs.length ? <>{qs.length} question{qs.length === 1 ? '' : 's'} · {tried ? `${correct}/${tried} correct` : 'not attempted'} · <Link className="text-accent" to={`/sc200/practice?objective=${o.id}`}>practice</Link></> : <span className="muted">None yet</span>}</div></li>
        <li><div className="text-[11px] font-semibold uppercase tracking-wider muted">5 · Interview connection</div><div className="mt-1">{o.interview}</div></li>
        <li className="md:col-span-2"><div className="text-[11px] font-semibold uppercase tracking-wider muted">Real SOC relevance</div><div className="mt-1 muted">{o.realSoc}</div></li>
      </ol>
    </article>
  )
}

export default function Sc200() {
  const [mode, setMode] = useState<'all' | Mode>('all')
  const p = useProgress()
  const groups = useMemo(() => {
    const out: Record<string, Record<string, Objective[]>> = {}
    for (const o of OBJECTIVES) {
      if (mode !== 'all' && o.mode !== mode) continue
      ;((out[o.domain] ??= {})[o.group] ??= []).push(o)
    }
    return out
  }, [mode])
  const studied = (d: string) => {
    const os = OBJECTIVES.filter(o => o.domain === d && o.lessons.length)
    return os.length ? Math.round((os.filter(o => o.lessons.every(l => p.completed[l])).length / OBJECTIVES.filter(o => o.domain === d).length) * 100) : 0
  }
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Module 44 · Certification" title="SC-200 objective map" icon={GraduationCap} color="var(--t-cert)" actions={<Link to="/sc200/practice" className="btn btn-primary">Practice exam</Link>}>
        Every objective from Microsoft's official study guide (<span className="font-medium">{SC200_VERSION}</span>), mapped to prerequisites, lessons, a lab idea, practice questions and an interview angle. Pass mark: 700 (scaled).
      </PageHeader>
      <div className="mb-8 space-y-4">
        <Callout tone="warn" title="Always verify against the official page">
          Microsoft updates the outline periodically, and some objectives cover newer features (Sentinel data lake, KQL jobs, summary rules, Sentinel graph, MCP server, Security Copilot). Check the <a href={SC200_SOURCE} target="_blank" rel="noopener noreferrer" className="text-accent underline">official study guide <ExternalLink size={11} className="inline" /></a> before your exam. This academy is an independent resource, not an official Microsoft course.
        </Callout>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="muted">Filter:</span>
          {(['all', 'both', 'exam', 'soc'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={cx('rounded-full border px-3 py-1 transition', mode === m ? 'border-transparent bg-accent font-medium text-[var(--on-accent)]' : 'border-base hover:bg-[var(--surface-2)]')}>{m === 'all' ? 'All objectives' : m === 'both' ? 'Exam + real SOC' : m === 'exam' ? 'Mainly exam' : 'Mainly real SOC'}</button>
          ))}
        </div>
      </div>
      <div className="mb-10 grid gap-4 md:grid-cols-3">
        {DOMAINS.map((d, i) => {
          const color = DOMAIN_COLOR[i % DOMAIN_COLOR.length]
          return (
            <a key={d.id} href={`#domain-${d.id}`} onClick={e => { e.preventDefault(); document.getElementById(`domain-${d.id}`)?.scrollIntoView({ behavior: 'smooth' }) }} className="card card-hover flex items-center gap-4 overflow-hidden p-4" style={{ borderTop: `4px solid ${color}` }}>
              <ProgressRing value={studied(d.id)} size={58} stroke={6} color={color} label={`${d.title}: ${studied(d.id)}% of objectives studied`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-semibold" style={{ color }}>{d.weight}</span><ArrowDown size={14} className="muted" aria-hidden /></div>
                <div className="font-medium leading-snug">{d.title}</div>
                <div className="mt-0.5 text-xs muted">objectives studied</div>
              </div>
            </a>
          )
        })}
      </div>
      {DOMAINS.map((d, i) => groups[d.id] && (
        <section key={d.id} id={`domain-${d.id}`} className="mb-12 scroll-mt-20">
          <h2 className="mb-1 flex items-center gap-3 text-2xl font-semibold"><span className="h-8 w-1.5 rounded-full" style={{ background: DOMAIN_COLOR[i % DOMAIN_COLOR.length] }} aria-hidden />{d.title}</h2>
          <div className="mb-6 font-mono text-sm muted">{d.weight} of the exam</div>
          {Object.entries(groups[d.id]).map(([g, os]) => (
            <div key={g} className="mb-8">
              <h3 className="mb-3 text-lg font-semibold">{g}</h3>
              <div className="space-y-4">{os.map(o => <ObjectiveRow key={o.id} o={o} />)}</div>
            </div>
          ))}
        </section>
      ))}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Official preparation</h2>
        <ResourceCards resources={res('sc200Guide', 'sc200Exam', 'sc200Course', 'examReadiness')} />
      </section>
    </div>
  )
}
