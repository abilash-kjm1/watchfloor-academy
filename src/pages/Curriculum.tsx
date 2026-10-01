import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock, GraduationCap, Library, Lock, PlayCircle, Signpost, Target } from 'lucide-react'
import { TRACKS, moduleById } from '../data/curriculum'
import { lessonVars, moduleIcon, trackTheme } from '../theme'
import { lessonById, ALL_QUESTIONS } from '../data'
import { OBJECTIVES } from '../data/sc200'
import { INTERVIEW } from '../data/interview'
import { useProgress } from '../progress/store'
import { weakConcepts } from '../progress/skills'
import { QuestionCard } from '../components/Quiz'
import { Card, EmptyState, IconBadge, ModeBadge, PageHeader, Pill, ProgressRing, cx } from '../components/ui'
import NotFound from './NotFound'

export function Curriculum() {
  const p = useProgress()
  const [filter, setFilter] = useState<'all' | 'ready' | 'progress'>('all')
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Curriculum" title="From fundamentals to SC-200" icon={Library}>
        Nine tracks, each building on the last. Modules with <span className="font-medium text-accent">lessons</span> are fully written; outline modules list their objectives and point to lessons that already cover parts of the topic.
      </PageHeader>
      <div className="mb-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter modules">
        {([['all', 'All modules'], ['ready', 'With lessons'], ['progress', 'In progress']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k} className={cx('rounded-full border px-3.5 py-1.5 text-sm transition', filter === k ? 'border-transparent bg-accent font-medium text-[var(--on-accent)]' : 'border-base hover:bg-[var(--surface-2)]')}>{label}</button>
        ))}
      </div>
      <div className="space-y-12">
        {TRACKS.map((t, ti) => {
          const th = trackTheme(t.id)
          const mods = t.modules.map(id => moduleById(id)!).filter(m => {
            const done = m.lessons.filter(l => p.completed[l]).length
            return filter === 'all' || (filter === 'ready' ? m.status === 'ready' : done > 0 && done < m.lessons.length)
          })
          if (!mods.length) return null
          return (
            <section key={t.id} aria-labelledby={`track-${t.id}`}>
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${th.color}, ${th.deep})` }} aria-hidden><th.icon size={22} /></span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: th.color }}>Track {ti + 1}</div>
                  <h2 id={`track-${t.id}`} className="text-xl font-semibold leading-tight">{t.title} <span className="text-sm font-normal muted">— {th.tagline}</span></h2>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mods.map(m => {
                  const done = m.lessons.filter(l => p.completed[l]).length
                  const Icon = moduleIcon(m.id)
                  const ready = m.status === 'ready'
                  return (
                    <Link key={m.id} to={`/module/${m.id}`} className="card card-hover group relative flex flex-col overflow-hidden p-5">
                      <div className="absolute inset-x-0 top-0 h-1" style={{ background: ready ? `linear-gradient(90deg, ${th.color}, ${th.deep})` : 'var(--border)' }} aria-hidden />
                      <div className="flex items-start justify-between gap-3">
                        <IconBadge icon={Icon} color={ready ? th.color : 'var(--muted)'} />
                        {m.lessons.length > 0
                          ? <ProgressRing value={(done / m.lessons.length) * 100} size={44} stroke={5} color={th.color} label={`${m.title}: ${done} of ${m.lessons.length} lessons complete`}>{done}/{m.lessons.length}</ProgressRing>
                          : <Pill><Lock size={11} aria-hidden /> Outline</Pill>}
                      </div>
                      <div className="mt-3 font-mono text-[11px] muted">MODULE {String(m.number).padStart(2, '0')}</div>
                      <div className="font-semibold leading-snug transition group-hover:text-[var(--accent)]">{m.title}</div>
                      <p className="mt-1.5 flex-1 text-sm leading-relaxed muted">{m.blurb}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <ModeBadge mode={m.mode} />
                        {ready && m.lessons.length > 0 && <Pill color={th.color}>{m.lessons.length} lesson{m.lessons.length > 1 ? 's' : ''} · {m.lessons.reduce((a, id) => a + (lessonById.get(id)?.minutes ?? 0), 0)} min</Pill>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
        {filter === 'progress' && !TRACKS.some(t => t.modules.some(id => { const m = moduleById(id)!; const d = m.lessons.filter(l => p.completed[l]).length; return d > 0 && d < m.lessons.length })) && (
          <EmptyState icon={PlayCircle} title="No modules in progress" action={{ to: '/lesson/start-here', label: 'Start your first lesson' }}>
            Once you complete a lesson in a module, that module appears here so you can jump straight back in.
          </EmptyState>
        )}
      </div>
    </div>
  )
}

export function ModulePage() {
  const { id = '' } = useParams()
  const m = moduleById(id)
  const p = useProgress()
  const [showCheckpoint, setShowCheckpoint] = useState(false)
  if (!m) return <NotFound />
  const th = trackTheme(m.track)
  const ModIcon = moduleIcon(m.id)
  if (m.id === 'sc200' || m.id === 'interview' || m.id === 'ticket-writing') {
    const to = m.id === 'sc200' ? '/sc200' : m.id === 'interview' ? '/interview' : '/tickets'
    return <div className="mx-auto max-w-3xl"><PageHeader eyebrow={`Module ${m.number}`} title={m.title} icon={ModIcon} color={th.color}>{m.blurb}</PageHeader><Link className="btn btn-primary" to={to}>Open {m.title} <ArrowRight size={16} aria-hidden /></Link></div>
  }
  const lessons = m.lessons.map(l => lessonById.get(l)!).filter(Boolean)
  const done = lessons.filter(l => p.completed[l.id]).length
  const prereqs = m.prereqs.map(moduleById).filter(Boolean)
  const objectives = OBJECTIVES.filter(o => o.prereqs.includes(m.id) || o.lessons.some(l => m.lessons.includes(l)))
  const covered = (m.coveredIn ?? []).map(l => lessonById.get(l)).filter(Boolean)

  // Checkpoint: knowledge + scenario questions from this module's lessons, interview questions, practical exercise.
  const qs = lessons.flatMap(l => l.quiz)
  const knowledge = qs.filter(q => q.kind !== 'scenario')
  const scenario = qs.filter(q => q.kind === 'scenario')
  const ivs = INTERVIEW.filter(q => lessons.some(l => l.id === q.lessonId))
  const weakHere = weakConcepts(p).filter(w => w.lesson && m.lessons.includes(w.lesson.id))
  const answered = qs.filter(q => p.answers[q.id]).length
  const relatedExam = ALL_QUESTIONS.filter(q => q.id.startsWith('x-') && q.objectives?.some(o => objectives.some(ob => ob.id === o))).slice(0, 4)

  return (
    <div className="mx-auto max-w-4xl" style={lessonVars(m.track)}>
      <nav className="mb-4 flex items-center gap-1.5 text-sm muted" aria-label="Breadcrumb"><Link to="/curriculum" className="hover:text-accent">Curriculum</Link><span aria-hidden>/</span><span style={{ color: th.color }}>{TRACKS.find(t => t.id === m.track)?.title}</span><span aria-hidden>/</span>Module {m.number}</nav>
      <PageHeader eyebrow={`Module ${m.number}`} title={m.title} icon={ModIcon} color={th.color}
        actions={m.lessons.length > 0 ? <ProgressRing value={(done / lessons.length) * 100} size={72} stroke={7} color={th.color} label="Module progress">{done}/{lessons.length}</ProgressRing> : <ModeBadge mode={m.mode} />}>
        {m.blurb}
        <div className="mt-3 flex flex-wrap items-center gap-2"><ModeBadge mode={m.mode} />{lessons.length > 0 && <Pill color={th.color}><Clock size={11} aria-hidden /> {lessons.reduce((a, l) => a + l.minutes, 0)} min total</Pill>}</div>
      </PageHeader>

      {lessons.length > 0 && (
        <section className="mb-10" aria-labelledby="lessons-h">
          <h2 id="lessons-h" className="mb-4 text-lg font-semibold">Your path through this module</h2>
          <ol className="relative space-y-3 before:absolute before:bottom-5 before:left-[21px] before:top-5 before:w-0.5 before:bg-[var(--border)]">
            {lessons.map((l, i) => {
              const isDone = !!p.completed[l.id]
              const isNext = !isDone && lessons.slice(0, i).every(x => p.completed[x.id])
              return (
                <li key={l.id} className="relative flex gap-4">
                  <span className={cx('relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 text-sm font-bold', isNext && 'animate-pulse-ring')}
                    style={isDone ? { background: 'var(--ok)', borderColor: 'var(--ok)', color: 'var(--surface)' } : isNext ? { background: th.color, borderColor: th.color, color: 'var(--surface)' } : { background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--muted)' }}>
                    {isDone ? <CheckCircle2 size={20} aria-label="Completed" /> : i + 1}
                  </span>
                  <Link to={`/lesson/${l.id}`} className="card card-hover group flex min-w-0 flex-1 flex-col gap-1 p-4 sm:flex-row sm:items-center sm:gap-4" style={isNext ? { borderColor: `color-mix(in srgb, ${th.color} 45%, var(--border))` } : undefined}>
                    <div className="min-w-0 flex-1">
                      {isNext && <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: th.color }}>Up next</div>}
                      <div className="font-semibold group-hover:text-[var(--accent)]">{l.title}</div>
                      <div className="mt-0.5 text-sm leading-relaxed muted">{l.summary}</div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs muted"><Clock size={12} aria-hidden />{l.minutes} min</span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Target size={18} style={{ color: th.color }} aria-hidden /> You will be able to</h2>
          <ul className="space-y-2 text-sm">{m.objectives.map(o => <li key={o} className="flex gap-2 leading-relaxed"><CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: th.color }} aria-hidden />{o}</li>)}</ul>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Signpost size={18} style={{ color: th.color }} aria-hidden /> Before this module</h2>
          {prereqs.length ? <div className="flex flex-wrap gap-2">{prereqs.map(x => <Link key={x!.id} to={`/module/${x!.id}`} className="btn !py-1 text-sm">{x!.title}</Link>)}</div> : <p className="text-sm muted">No prerequisites — a good starting point.</p>}
          {objectives.length > 0 && (
            <>
              <h3 className="mb-2 mt-5 flex items-center gap-2 text-sm font-semibold"><GraduationCap size={15} style={{ color: 'var(--t-cert)' }} aria-hidden /> SC-200 objectives this supports</h3>
              <ul className="space-y-1.5 text-sm">{objectives.slice(0, 6).map(o => <li key={o.id}><Link to={`/sc200#${o.id}`} className="hover:text-accent">{o.text}</Link></li>)}</ul>
            </>
          )}
        </Card>
      </div>

      {m.status === 'outline' && (
        <div className="mt-8">
          <EmptyState icon={Lock} color={th.color} title="Full lessons for this module are on the way">
            The objectives above define what it will cover. Parts of the topic are already taught here:
            <div className="mt-4 flex flex-wrap justify-center gap-2">{covered.map(l => <Link key={l!.id} to={`/lesson/${l!.id}`} className="btn !py-1 text-sm">{l!.title}</Link>)}</div>
          </EmptyState>
        </div>
      )}

      {qs.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Module checkpoint</h2>
              <p className="text-sm muted">{knowledge.length} knowledge · {scenario.length} scenario · {ivs.length} interview questions · 1 practical exercise. {answered}/{qs.length} answered.</p>
            </div>
            <button className="btn" onClick={() => setShowCheckpoint(s => !s)}>{showCheckpoint ? 'Hide checkpoint' : 'Start checkpoint'}</button>
          </div>
          {weakHere.length > 0 && (
            <Card className="mt-4 p-4">
              <div className="text-sm font-semibold" style={{ color: 'var(--exam)' }}>Weak topics in this module</div>
              <ul className="mt-2 space-y-1 text-sm">{weakHere.map(w => <li key={w.concept}>{w.concept} — review <Link className="text-accent" to={`/lesson/${w.lesson!.id}`}>{w.lesson!.title}</Link></li>)}</ul>
            </Card>
          )}
          {showCheckpoint && (
            <div className="mt-6 space-y-8">
              <div><h3 className="mb-3 font-semibold">Knowledge</h3><div className="space-y-4">{knowledge.map((q, i) => <QuestionCard key={q.id} q={q} index={i} showLessonLink />)}</div></div>
              {scenario.length > 0 && <div><h3 className="mb-3 font-semibold">Scenarios</h3><div className="space-y-4">{scenario.map((q, i) => <QuestionCard key={q.id} q={q} index={i} showLessonLink />)}</div></div>}
              {relatedExam.length > 0 && <div><h3 className="mb-3 font-semibold">Exam-style questions</h3><div className="space-y-4">{relatedExam.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)}</div></div>}
              {ivs.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold">Interview questions</h3>
                  <ul className="space-y-2">{ivs.map(q => <li key={q.id} className="card flex items-center justify-between gap-3 p-4 text-sm"><span>{q.question}</span><Link to={`/interview?q=${q.id}`} className="btn shrink-0">Answer</Link></li>)}</ul>
                </div>
              )}
              <div>
                <h3 className="mb-3 font-semibold">Practical exercise</h3>
                <Card className="p-4 text-sm">Complete the hands-on lab in <Link className="text-accent" to={`/lesson/${lessons[lessons.length - 1].id}#lab`}>{lessons[lessons.length - 1].title}</Link> and write a short note explaining what you found in your own words.</Card>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

