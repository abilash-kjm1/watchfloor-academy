import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { TRACKS, moduleById } from '../data/curriculum'
import { lessonById, ALL_QUESTIONS } from '../data'
import { OBJECTIVES } from '../data/sc200'
import { INTERVIEW } from '../data/interview'
import { useProgress } from '../progress/store'
import { weakConcepts } from '../progress/skills'
import { QuestionCard } from '../components/Quiz'
import { Card, LinkCard, ModeBadge, PageHeader, Pill, Progress } from '../components/ui'
import NotFound from './NotFound'

export function Curriculum() {
  const p = useProgress()
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Curriculum" title="From fundamentals to SC-200">
        Modules marked <span className="font-medium text-accent">Lessons available</span> are fully written. Outline modules list their objectives and point to the lessons that already cover parts of the topic — no empty “coming soon” pages.
      </PageHeader>
      <div className="space-y-10">
        {TRACKS.map(t => (
          <section key={t.id}>
            <h2 className="mb-4 text-lg font-semibold">{t.title}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {t.modules.map(id => {
                const m = moduleById(id)!
                const done = m.lessons.filter(l => p.completed[l]).length
                return (
                  <LinkCard key={m.id} to={`/module/${m.id}`} title={<span><span className="mr-2 font-mono text-xs muted">M{String(m.number).padStart(2, '0')}</span>{m.title}</span>}
                    meta={<>
                      <ModeBadge mode={m.mode} />
                      {m.status === 'ready' && m.lessons.length > 0 && <Pill className="!text-[var(--accent)]">Lessons available · {done}/{m.lessons.length}</Pill>}
                      {m.status === 'outline' && <Pill>Outline</Pill>}
                    </>}>
                    {m.blurb}
                  </LinkCard>
                )
              })}
            </div>
          </section>
        ))}
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
  if (m.id === 'sc200' || m.id === 'interview' || m.id === 'ticket-writing') {
    const to = m.id === 'sc200' ? '/sc200' : m.id === 'interview' ? '/interview' : '/tickets'
    return <div className="mx-auto max-w-3xl"><PageHeader eyebrow={`Module ${m.number}`} title={m.title}>{m.blurb}</PageHeader><Link className="btn btn-primary" to={to}>Open {m.title}</Link></div>
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
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 text-sm muted"><Link to="/curriculum" className="hover:text-accent">Curriculum</Link> / Module {m.number}</nav>
      <PageHeader eyebrow={`Module ${m.number}`} title={m.title} actions={<ModeBadge mode={m.mode} />}>{m.blurb}</PageHeader>

      {m.lessons.length > 0 && (
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm"><span className="font-medium">Progress</span><span className="muted">{done}/{lessons.length} lessons</span></div>
          <Progress value={(done / lessons.length) * 100} label="Module progress" />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Objectives</h2>
          <ul className="prose-lesson text-sm">{m.objectives.map(o => <li key={o}>{o}</li>)}</ul>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Before this module</h2>
          {prereqs.length ? <div className="flex flex-wrap gap-2">{prereqs.map(x => <Link key={x!.id} to={`/module/${x!.id}`} className="btn !py-1 text-sm">{x!.title}</Link>)}</div> : <p className="text-sm muted">No prerequisites — a good starting point.</p>}
          {objectives.length > 0 && (
            <>
              <h3 className="mb-2 mt-5 text-sm font-semibold">SC-200 objectives this supports</h3>
              <ul className="space-y-1 text-sm">{objectives.slice(0, 6).map(o => <li key={o.id}><Link to={`/sc200#${o.id}`} className="hover:text-accent">{o.text}</Link></li>)}</ul>
            </>
          )}
        </Card>
      </div>

      {lessons.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Lessons</h2>
          <ol className="space-y-3">
            {lessons.map((l, i) => (
              <li key={l.id}>
                <Link to={`/lesson/${l.id}`} className="card flex items-start gap-4 p-4 transition hover:border-[var(--accent)]">
                  {p.completed[l.id] ? <CheckCircle2 className="mt-0.5 shrink-0" size={20} style={{ color: 'var(--both)' }} /> : <Circle className="mt-0.5 shrink-0 muted" size={20} />}
                  <div className="flex-1">
                    <div className="font-medium"><span className="mr-2 font-mono text-xs muted">{i + 1}</span>{l.title}</div>
                    <div className="mt-0.5 text-sm muted">{l.summary}</div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs muted"><Clock size={12} />{l.minutes}m</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {m.status === 'outline' && (
        <Card className="mt-8 p-5">
          <h2 className="font-semibold">Status: outline</h2>
          <p className="mt-1 text-sm leading-relaxed muted">Full lessons for this module are not written yet. The objectives above define what it will cover. Parts of the topic are already taught in:</p>
          <div className="mt-3 flex flex-wrap gap-2">{covered.map(l => <Link key={l!.id} to={`/lesson/${l!.id}`} className="btn !py-1 text-sm">{l!.title}</Link>)}</div>
        </Card>
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

