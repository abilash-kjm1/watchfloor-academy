import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { ALL_QUESTIONS, lessonForQuestion } from '../data'
import { DOMAINS, OBJECTIVES, objectiveById } from '../data/sc200'
import type { Question } from '../data/types'
import { actions, useProgress } from '../progress/store'
import { Card, PageHeader, Progress, cx } from '../components/ui'
import { whyWrong } from '../components/explainOption'

type ModeId = 'practice' | 'timed' | 'domain' | 'review' | 'objective'
const EXAM_QS = ALL_QUESTIONS.filter(q => q.objectives?.length)

function shuffle<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] } return x }
const domainOf = (q: Question) => objectiveById.get(q.objectives![0])?.domain

export default function ExamPractice() {
  const [params] = useSearchParams()
  const p = useProgress()
  const preObjective = params.get('objective')
  const [mode, setMode] = useState<ModeId>(preObjective ? 'objective' : 'practice')
  const [domain, setDomain] = useState('env')
  const [session, setSession] = useState<{ qs: Question[]; mode: ModeId; started: number; limit?: number } | null>(null)

  const reviewPool = EXAM_QS.filter(q => p.answers[q.id] && !p.answers[q.id].lastCorrect)
  const start = () => {
    let qs: Question[] = []
    if (mode === 'practice') qs = shuffle(EXAM_QS).slice(0, 15)
    if (mode === 'timed') qs = shuffle(EXAM_QS).slice(0, 30)
    if (mode === 'domain') qs = shuffle(EXAM_QS.filter(q => domainOf(q) === domain))
    if (mode === 'review') qs = shuffle(reviewPool)
    if (mode === 'objective') qs = EXAM_QS.filter(q => q.objectives!.includes(preObjective ?? ''))
    if (!qs.length) return
    setSession({ qs, mode, started: Date.now(), limit: mode === 'timed' ? qs.length * 90 : undefined })
  }

  // weak-area tracking per objective
  const byObjective = useMemo(() => {
    const m = new Map<string, [number, number]>()
    for (const q of EXAM_QS) {
      const a = p.answers[q.id]; if (!a) continue
      for (const o of q.objectives!) { const e = m.get(o) ?? [0, 0]; e[0] += a.lastCorrect ? 1 : 0; e[1] += 1; m.set(o, e) }
    }
    return [...m.entries()].map(([id, [c, t]]) => ({ o: objectiveById.get(id)!, c, t })).filter(x => x.o).sort((a, b) => a.c / a.t - b.c / b.t)
  }, [p.answers])

  if (session) return <ExamSession {...session} onExit={() => setSession(null)} />

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Module 45 · Exam simulator" title="SC-200 practice">
        {EXAM_QS.length} exam-style questions mapped to official objectives. Original questions written for learning — not real exam content. Every answer explains why, not just "incorrect".
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Choose a mode</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ['practice', 'Untimed practice', '15 random questions, explanations after each.'],
              ['timed', 'Timed exam', '30 questions, 90 seconds per question, results at the end.'],
              ['domain', 'Domain-specific', 'All questions from one exam domain.'],
              ['review', 'Review mistakes', `${reviewPool.length} questions you last answered incorrectly.`],
              ...(preObjective ? [['objective', 'This objective', objectiveById.get(preObjective)?.text ?? '']] : []),
            ] as [ModeId, string, string][]).map(([id, t, d]) => (
              <button key={id} onClick={() => setMode(id)} className={cx('rounded-lg border p-4 text-left transition', mode === id ? 'border-[var(--accent)] bg-accent-soft' : 'border-base hover:bg-[var(--surface-2)]')}>
                <div className="font-medium">{t}</div><div className="mt-1 text-sm muted">{d}</div>
              </button>
            ))}
          </div>
          {mode === 'domain' && (
            <select className="input mt-4" value={domain} onChange={e => setDomain(e.target.value)} aria-label="Domain">
              {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.title} ({EXAM_QS.filter(q => domainOf(q) === d.id).length} questions)</option>)}
            </select>
          )}
          <button className="btn btn-primary mt-5" onClick={start} disabled={mode === 'review' && !reviewPool.length}>Start</button>
          {mode === 'review' && !reviewPool.length && <span className="ml-3 text-sm muted">No mistakes to review yet.</span>}
          <p className="mt-6 text-xs leading-relaxed muted">The real exam also uses case studies and interactive item types (drag-and-drop, hot area). Explore them in Microsoft's free <a className="text-accent underline" href="https://aka.ms/examdemo" target="_blank" rel="noopener noreferrer">exam sandbox</a> and the free <a className="text-accent underline" href="https://learn.microsoft.com/en-us/credentials/certifications/exams/sc-200/" target="_blank" rel="noopener noreferrer">official practice assessment</a>.</p>
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Weak areas</h2>
            {byObjective.length === 0 ? <p className="text-sm muted">Answer questions to see per-objective accuracy.</p> : (
              <ul className="space-y-3 text-sm">
                {byObjective.slice(0, 6).map(({ o, c, t }) => (
                  <li key={o.id}><Link to={`/sc200#${o.id}`} className="line-clamp-2 hover:text-accent">{o.text}</Link><div className="mt-1 flex items-center gap-2"><Progress value={(c / t) * 100} label="accuracy" /><span className="shrink-0 text-xs muted">{c}/{t}</span></div></li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">History</h2>
            {p.exams.length === 0 ? <p className="text-sm muted">No sessions yet.</p> : (
              <ul className="space-y-1.5 text-sm">{p.exams.slice(0, 8).map(e => <li key={e.ts} className="flex justify-between"><span className="capitalize">{e.mode}</span><span className="muted">{e.correct}/{e.total} · {new Date(e.ts).toLocaleDateString()}</span></li>)}</ul>
            )}
          </Card>
          <Card className="p-5 text-sm"><span className="font-semibold">Coverage: </span>{OBJECTIVES.filter(o => EXAM_QS.some(q => q.objectives!.includes(o.id))).length} of {OBJECTIVES.length} objectives have practice questions.</Card>
        </div>
      </div>
    </div>
  )
}

function ExamSession({ qs, mode, started, limit, onExit }: { qs: Question[]; mode: ModeId; started: number; limit?: number; onExit: () => void }) {
  const [i, setI] = useState(0)
  const [picks, setPicks] = useState<Record<string, number[]>>({})
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [now, setNow] = useState(Date.now())
  const timed = mode === 'timed'
  useEffect(() => { if (!timed || finished) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [timed, finished])
  const remaining = limit ? Math.max(0, limit - Math.floor((now - started) / 1000)) : null
  const isRight = (q: Question) => { const pk = picks[q.id] ?? []; return pk.length === q.answer.length && pk.every(x => q.answer.includes(x)) }

  const finish = () => {
    if (finished) return
    const byObjective: Record<string, [number, number]> = {}
    for (const q of qs) {
      if (timed || checked[q.id] === undefined) actions.recordAnswer(q.id, isRight(q))
      for (const o of q.objectives ?? []) { const e = byObjective[o] ?? [0, 0]; e[0] += isRight(q) ? 1 : 0; e[1]++; byObjective[o] = e }
    }
    actions.recordExam({ ts: Date.now(), mode, total: qs.length, correct: qs.filter(isRight).length, seconds: Math.round((Date.now() - started) / 1000), byObjective })
    setFinished(true)
  }
  useEffect(() => { if (remaining === 0) finish() }) // eslint-disable-line react-hooks/exhaustive-deps

  if (finished) {
    const correct = qs.filter(isRight).length
    const pct = Math.round((correct / qs.length) * 100)
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader eyebrow="Results" title={`${correct} / ${qs.length} correct (${pct}%)`} actions={<button className="btn btn-primary" onClick={onExit}>New session</button>}>
          {pct >= 80 ? 'Strong result. Review explanations for anything you guessed.' : pct >= 60 ? 'Getting there. Focus on the weak objectives below.' : 'Use the review links under each missed question to rebuild the fundamentals first.'}
        </PageHeader>
        <div className="space-y-4">
          {qs.map((q, k) => {
            const ok = isRight(q); const lesson = lessonForQuestion(q.id)
            return (
              <Card key={q.id} className="p-5">
                <div className="flex gap-2 font-medium">{ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--both)' }} /> : <XCircle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--danger)' }} />}<span><span className="mr-2 font-mono text-xs muted">Q{k + 1}</span>{q.prompt}</span></div>
                <div className="mt-3 text-sm"><span className="font-medium">Correct answer: </span>{q.answer.map(a => q.options[a]).join(' + ')}</div>
                {!ok && (picks[q.id] ?? []).length > 0 && <div className="mt-1 text-sm"><span className="font-medium">You chose: </span>{(picks[q.id] ?? []).map(a => q.options[a]).join(' + ')}{(picks[q.id] ?? []).filter(x => !q.answer.includes(x)).map(x => whyWrong(q, x)).map(w => <span key={w} className="block muted">Why that's wrong: {w}</span>)}</div>}
                <div className="mt-2 text-sm leading-relaxed muted">{q.explanation}</div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {q.objectives?.map(o => <Link key={o} to={`/sc200#${o}`} className="text-accent">Objective: {objectiveById.get(o)?.text.slice(0, 60)}…</Link>)}
                  {!ok && lesson && <Link to={`/lesson/${lesson.id}`} className="text-accent">Review lesson: {lesson.title}</Link>}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  const q = qs[i]
  const multi = q.answer.length > 1
  const pick = picks[q.id] ?? []
  const isChecked = checked[q.id] !== undefined
  const toggle = (k: number) => { if (isChecked) return; setPicks(s => ({ ...s, [q.id]: multi ? (pick.includes(k) ? pick.filter(x => x !== k) : [...pick, k]) : [k] })) }
  const check = () => { const ok = isRight(q); setChecked(c => ({ ...c, [q.id]: ok })); actions.recordAnswer(q.id, ok) }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3 text-sm">
        <button className="btn" onClick={() => { if (confirm('Leave this session? Progress in it will be lost.')) onExit() }}>Exit</button>
        <span className="muted">Question {i + 1} of {qs.length}</span>
        {remaining !== null && <span className={cx('inline-flex items-center gap-1 font-mono', remaining < 120 && 'text-[var(--danger)]')}><Clock size={14} />{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</span>}
      </div>
      <Progress value={((i + 1) / qs.length) * 100} label="Session progress" className="mb-6" />
      <Card className="p-6">
        <div className="mb-1 text-xs muted">{q.objectives?.map(o => objectiveById.get(o)?.group).filter(Boolean)[0]}</div>
        <p className="text-[16px] font-medium leading-relaxed">{q.prompt} {multi && <span className="text-xs font-semibold text-accent">(Select {q.answer.length})</span>}</p>
        <div className="mt-4 space-y-2">
          {q.options.map((o, k) => (
            <button key={k} onClick={() => toggle(k)} role={multi ? 'checkbox' : 'radio'} aria-checked={pick.includes(k)}
              className={cx('flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm',
                !isChecked && (pick.includes(k) ? 'border-[var(--accent)] bg-accent-soft' : 'border-base hover:bg-[var(--surface-2)]'),
                isChecked && q.answer.includes(k) && 'border-[var(--both)] bg-[var(--both-soft)]',
                isChecked && pick.includes(k) && !q.answer.includes(k) && 'border-[var(--danger)] bg-[var(--danger-soft)]',
                isChecked && !pick.includes(k) && !q.answer.includes(k) && 'border-base opacity-70')}>
              <span className={cx('mt-0.5 h-4 w-4 shrink-0 border', multi ? 'rounded' : 'rounded-full', pick.includes(k) ? 'border-[var(--accent)] bg-accent' : 'border-[var(--muted)]')} />
              {o}
            </button>
          ))}
        </div>
        {isChecked && (
          <div className="mt-4 rounded-lg surface-2 p-4 text-sm leading-relaxed">
            <div className="font-semibold" style={{ color: checked[q.id] ? 'var(--both)' : 'var(--danger)' }}>{checked[q.id] ? 'Correct' : 'Not quite'}</div>
            {!checked[q.id] && pick.filter(x => !q.answer.includes(x)).map(x => <p key={x} className="mt-1"><span className="font-medium">Why "{q.options[x]}" is wrong: </span>{q.whyWrong?.[x] ?? 'It doesn\'t satisfy the requirement in the question — see the explanation.'}</p>)}
            <p className="mt-1">{q.explanation}</p>
          </div>
        )}
        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>
          <div className="flex gap-2">
            {!timed && !isChecked && <button className="btn btn-primary" disabled={!pick.length} onClick={check}>Check</button>}
            {i < qs.length - 1 ? <button className={cx('btn', (timed || isChecked) && 'btn-primary')} onClick={() => setI(i + 1)}>Next</button> : <button className="btn btn-primary" onClick={finish}>Finish & see results</button>}
          </div>
        </div>
      </Card>
    </div>
  )
}
