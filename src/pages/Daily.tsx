import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ALL_QUESTIONS, LESSONS } from '../data'
import type { Question } from '../data/types'
import { actions, streak, today, useProgress } from '../progress/store'
import { weakConcepts } from '../progress/skills'
import { QuestionCard } from '../components/Quiz'
import { Callout, Card, PageHeader, Progress } from '../components/ui'
import { Flame, Trophy } from 'lucide-react'

function seeded(seed: string) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296 }
}

export default function Daily() {
  const p = useProgress()
  const day = today()
  const done = p.dailyDone[day]
  const started = useRef(Date.now())
  const [, setResults] = useState<Record<string, boolean>>({})

  const qs: Question[] = useMemo(() => {
    const r = seeded(day)
    const studiedLessons = LESSONS.filter(l => p.completed[l.id])
    const pool = (studiedLessons.length ? studiedLessons : LESSONS.slice(0, 4)).flatMap(l => l.quiz)
    const weakIds = new Set(weakConcepts(p).flatMap(w => w.questionIds))
    const weakQs = pool.filter(q => weakIds.has(q.id))
    const rest = pool.filter(q => !weakIds.has(q.id)).sort(() => r() - 0.5)
    const examExtra = ALL_QUESTIONS.filter(q => q.id.startsWith('x-')).sort(() => r() - 0.5).slice(0, 1)
    return [...weakQs.slice(0, 2), ...rest, ...examExtra].slice(0, 5)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day])

  const onAnswered = (id: string, ok: boolean) => {
    setResults(prev => {
      const next = { ...prev, [id]: ok }
      if (Object.keys(next).length === qs.length) actions.recordDaily(day, Object.values(next).filter(Boolean).length, qs.length, Math.round((Date.now() - started.current) / 1000))
      return next
    })
  }
  const history = Object.entries(p.dailyDone).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10)
  const totals = Object.values(p.dailyDone).reduce((a, d) => ({ c: a.c + d.correct, t: a.t + d.total, s: a.s + d.seconds }), { c: 0, t: 0, s: 0 })

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Module 35 · Daily challenge" title={`Today's challenge · ${day}`} icon={Flame} color="var(--t-soc)">
        Five questions drawn from lessons you've studied, prioritizing concepts you've missed. About five minutes.
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          {done && (
            <div className="flex items-center gap-4 rounded-2xl p-4 animate-rise" style={{ background: 'var(--ok-soft)' }} role="status">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: 'var(--ok)', color: 'var(--surface)' }} aria-hidden><Trophy size={20} /></span>
              <div className="text-sm"><div className="font-semibold">Done for today — {done.correct}/{done.total} in {Math.max(1, Math.round(done.seconds / 60))} min</div><div className="muted">Your streak is safe. You can still review the questions below.</div></div>
            </div>
          )}
          {!Object.keys(p.completed).length && <Callout tone="info" title="Warming up">You haven't completed a lesson yet, so today's questions come from the first lessons. Finish a few lessons and the challenge will draw from what you've studied.</Callout>}
          {qs.map((q, i) => <QuestionCard key={q.id} q={q} index={i} showLessonLink onAnswered={ok => onAnswered(q.id, ok)} />)}
        </div>
        <div className="space-y-4">
          <Card className="relative overflow-hidden p-5" style={{ background: 'linear-gradient(160deg, color-mix(in srgb, var(--t-soc) 14%, var(--surface)), var(--surface))' }}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t-soc)' }}><Flame size={14} aria-hidden /> Streak</div>
            <div className="mt-1 text-4xl font-semibold tabular-nums">{streak(p.days)} <span className="text-base font-normal muted">day{streak(p.days) === 1 ? '' : 's'}</span></div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><div className="muted text-xs">Challenges</div><div className="font-semibold">{Object.keys(p.dailyDone).length}</div></div>
              <div><div className="muted text-xs">Accuracy</div><div className="font-semibold">{totals.t ? Math.round((totals.c / totals.t) * 100) : 0}%</div></div>
              <div><div className="muted text-xs">Avg time</div><div className="font-semibold">{Object.keys(p.dailyDone).length ? Math.round(totals.s / Object.keys(p.dailyDone).length / 60) : 0} min</div></div>
              <div><div className="muted text-xs">Weak concepts</div><div className="font-semibold">{weakConcepts(p).length}</div></div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="mb-2 text-sm font-semibold">Recent days</div>
            {history.length ? <ul className="space-y-2 text-sm">{history.map(([d, r]) => <li key={d} className="flex items-center gap-2"><span className="w-24 shrink-0">{d}</span><Progress className="!h-1.5" value={(r.correct / r.total) * 100} color={r.correct / r.total >= 0.8 ? 'var(--ok)' : 'var(--t-soc)'} label={`${d} score`} /><span className="w-8 shrink-0 text-right muted">{r.correct}/{r.total}</span></li>)}</ul> : <p className="text-sm muted">Your scores will appear here after your first challenge.</p>}
          </Card>
          <Link to="/dashboard" className="btn w-full justify-center">Back to dashboard</Link>
        </div>
      </div>
    </div>
  )
}
