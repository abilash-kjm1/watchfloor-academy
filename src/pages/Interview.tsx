import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Circle, RefreshCw } from 'lucide-react'
import { INTERVIEW, interviewById, reviewAnswer, type AnswerReview } from '../data/interview'
import { lessonById } from '../data'
import { actions, useProgress } from '../progress/store'
import { Callout, Card, PageHeader, cx } from '../components/ui'

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const

export default function Interview() {
  const [params, setParams] = useSearchParams()
  const p = useProgress()
  const [level, setLevel] = useState<(typeof LEVELS)[number] | 'all'>('all')
  const qid = params.get('q') ?? INTERVIEW[0].id
  const q = interviewById.get(qid) ?? INTERVIEW[0]
  const list = useMemo(() => INTERVIEW.filter(x => level === 'all' || x.level === level), [level])
  const [answer, setAnswer] = useState('')
  const [review, setReview] = useState<AnswerReview | null>(null)
  const [stage, setStage] = useState<'think' | 'answer' | 'feedback'>('think')

  const pickQ = (id: string) => { setParams({ q: id }); setAnswer(''); setReview(null); setStage('think') }
  const submit = () => {
    const r = reviewAnswer(q, answer)
    setReview(r); setStage('feedback'); actions.recordInterview(q.id, r.score)
  }
  const randomQ = () => { const pool = list.filter(x => x.id !== q.id); pickQ(pool[Math.floor(Math.random() * pool.length)].id) }
  const lesson = q.lessonId ? lessonById.get(q.lessonId) : undefined

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Module 34 · Interview academy" title="Interview mode">
        Question → think → answer in your own words → see which key points you covered → model answer → why → tip → follow-up. Explain reasoning; don't recite definitions.
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div>
          <div className="mb-3 flex flex-wrap gap-1">
            {(['all', ...LEVELS] as const).map(l => <button key={l} onClick={() => setLevel(l)} className={cx('rounded-full border px-2.5 py-0.5 text-xs capitalize', level === l ? 'border-[var(--accent)] bg-accent-soft text-accent' : 'border-base muted')}>{l}</button>)}
          </div>
          <ul className="card max-h-[70vh] overflow-y-auto scrollbar-thin">
            {list.map(x => {
              const best = p.interview[x.id]?.best
              return (
                <li key={x.id}>
                  <button onClick={() => pickQ(x.id)} className={cx('flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm hover:bg-[var(--surface-2)]', x.id === q.id && 'bg-accent-soft')}>
                    {best !== undefined ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: best >= 70 ? 'var(--both)' : 'var(--exam)' }} /> : <Circle size={14} className="mt-0.5 shrink-0 muted" />}
                    <span><span className="block leading-snug">{x.question}</span><span className="text-xs capitalize muted">{x.level}{best !== undefined && ` · best ${best}%`}</span></span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-accent">{q.level} question</div>
                <h2 className="mt-2 text-xl font-semibold leading-snug">{q.question}</h2>
              </div>
              <button className="btn shrink-0" onClick={randomQ} aria-label="Random question"><RefreshCw size={15} /> Random</button>
            </div>
            {stage === 'think' && (
              <div className="mt-5 rounded-lg surface-2 p-4 text-sm leading-relaxed">
                <div className="font-semibold">Think first (30 seconds)</div>
                <p className="mt-1 muted">What problem does this solve? What evidence is involved? Which Microsoft tool or table? Can you give one concrete example?</p>
                <button className="btn btn-primary mt-3" onClick={() => setStage('answer')}>I'm ready to answer</button>
              </div>
            )}
            {stage !== 'think' && (
              <>
                <textarea className="input mt-5 min-h-40" placeholder="Answer as if speaking to the interviewer…" value={answer} onChange={e => setAnswer(e.target.value)} disabled={stage === 'feedback'} aria-label="Your answer" />
                {stage === 'answer' && <button className="btn btn-primary mt-3" onClick={submit} disabled={answer.trim().length < 20}>Get feedback</button>}
              </>
            )}
          </Card>

          {review && (
            <>
              <Card className="p-6">
                <div className="flex items-baseline justify-between"><h3 className="font-semibold">Key-point coverage</h3><span className="text-2xl font-semibold">{review.score}%</span></div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div><div className="mb-2 text-sm font-semibold" style={{ color: 'var(--both)' }}>Covered</div><ul className="space-y-1.5 text-sm">{review.covered.length ? review.covered.map(c => <li key={c} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--both)' }} />{c}</li>) : <li className="muted">None detected.</li>}</ul></div>
                  <div><div className="mb-2 text-sm font-semibold" style={{ color: 'var(--exam)' }}>Missing</div><ul className="space-y-1.5 text-sm">{review.missing.length ? review.missing.map(c => <li key={c} className="flex gap-2"><Circle size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--exam)' }} />{c}</li>) : <li className="muted">Nothing missing — great coverage.</li>}</ul></div>
                </div>
                <p className="mt-4 text-xs muted">This offline check looks for key ideas by keywords. It can miss correct answers phrased differently and can't judge accuracy — compare carefully with the model answer.</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold">Model answer</h3>
                <p className="mt-2 leading-relaxed">{q.model}</p>
                <h3 className="mt-5 font-semibold">Why this answer works</h3>
                <p className="mt-1 text-sm leading-relaxed muted">It starts from the problem, explains the mechanism, names the evidence or tool, and gives a concrete example — the structure interviewers listen for.</p>
                {lesson && <p className="mt-3 text-sm">Deepen it: <Link className="text-accent" to={`/lesson/${lesson.id}`}>{lesson.title}</Link></p>}
              </Card>
              <Callout tone="tip" title="Interview tip">{q.tip}</Callout>
              <Card className="p-6">
                <h3 className="font-semibold">Follow-up question</h3>
                <p className="mt-2">{q.followUp}</p>
                <p className="mt-2 text-sm muted">Answer it out loud, then try again with the original question to improve your coverage.</p>
                <button className="btn mt-3" onClick={() => { setAnswer(''); setReview(null); setStage('answer') }}>Try the original again</button>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
