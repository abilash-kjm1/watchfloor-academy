import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Bookmark, Check, X, PartyPopper, Target } from 'lucide-react'
import type { Question } from '../data/types'
import { actions, useProgress } from '../progress/store'
import { lessonForQuestion } from '../data'
import { cx } from './ui'
import { whyWrong } from './explainOption'

/** One question with immediate, teaching feedback. Never just "incorrect". */
export function QuestionCard({ q, index, onAnswered, showLessonLink }: { q: Question; index?: number; onAnswered?: (correct: boolean) => void; showLessonLink?: boolean }) {
  const multi = q.answer.length > 1
  const [picked, setPicked] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const p = useProgress()
  const bookmarked = p.bookmarks.some(b => b.id === `q:${q.id}`)
  const correct = done && picked.length === q.answer.length && picked.every(x => q.answer.includes(x))

  const toggle = (i: number) => {
    if (done) return
    setPicked(prev => (multi ? (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]) : [i]))
  }
  const submit = () => {
    if (!picked.length) return
    const ok = picked.length === q.answer.length && picked.every(x => q.answer.includes(x))
    setDone(true)
    actions.recordAnswer(q.id, ok)
    onAnswered?.(ok)
  }
  const lesson = showLessonLink ? lessonForQuestion(q.id) : undefined

  return (
    <div className="card p-5" style={done ? { borderColor: correct ? 'color-mix(in srgb, var(--ok) 45%, transparent)' : 'color-mix(in srgb, var(--danger) 40%, transparent)' } : undefined}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex gap-3 text-[15px] font-medium leading-relaxed">
          {index !== undefined && <span className="grid h-7 min-w-7 shrink-0 place-items-center rounded-lg px-1.5 font-mono text-xs font-bold" style={{ background: 'color-mix(in srgb, var(--lesson-color, var(--accent)) 14%, transparent)', color: 'var(--lesson-color, var(--accent))' }}>Q{index + 1}</span>}
          <div>
            {q.prompt}
            {multi && <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>Select {q.answer.length}</span>}
          </div>
        </div>
        <button
          className={cx('shrink-0 rounded p-1 hover:bg-[var(--surface-2)]', bookmarked && 'text-accent')}
          onClick={() => actions.toggleBookmark({ id: `q:${q.id}`, kind: 'question', title: q.prompt.slice(0, 90), href: lesson ? `/lesson/${lesson.id}#quiz` : '/sc200/practice' })}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark question'}
        >
          <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="space-y-2" role={multi ? 'group' : 'radiogroup'}>
        {q.options.map((o, i) => {
          const isPicked = picked.includes(i)
          const isAnswer = q.answer.includes(i)
          return (
            <button
              key={i}
              role={multi ? 'checkbox' : 'radio'}
              aria-checked={isPicked}
              onClick={() => toggle(i)}
              disabled={done}
              className={cx(
                'flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition',
                !done && (isPicked ? 'border-[var(--accent)] bg-accent-soft' : 'border-base hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]'),
                done && isAnswer && 'border-[var(--ok)] bg-[var(--ok-soft)]',
                done && isPicked && !isAnswer && 'border-[var(--danger)] bg-[var(--danger-soft)]',
                done && !isPicked && !isAnswer && 'border-base opacity-60',
              )}
            >
              <span className={cx('grid h-6 w-6 shrink-0 place-items-center text-[11px] font-bold transition', multi ? 'rounded-md' : 'rounded-full')}
                style={done && isAnswer ? { background: 'var(--ok)', color: 'var(--surface)' } : done && isPicked ? { background: 'var(--danger)', color: 'var(--surface)' } : isPicked ? { background: 'var(--accent)', color: 'var(--on-accent)' } : { border: '1.5px solid var(--border-strong)', color: 'var(--muted)' }}
                aria-hidden>
                {done && isAnswer ? <Check size={13} /> : done && isPicked ? <X size={13} /> : String.fromCharCode(65 + i)}
              </span>
              <span className="pt-0.5 leading-relaxed">{o}</span>
              {done && isAnswer && <span className="sr-only">(correct answer)</span>}
              {done && isPicked && !isAnswer && <span className="sr-only">(your answer, incorrect)</span>}
            </button>
          )
        })}
      </div>
      {!done ? (
        <button className="btn btn-primary mt-4" onClick={submit} disabled={!picked.length}>Check answer</button>
      ) : (
        <div className="mt-4 space-y-2 rounded-xl p-4 text-sm leading-relaxed animate-rise" style={{ background: correct ? 'var(--ok-soft)' : 'var(--surface-2)' }} aria-live="polite">
          <div className="flex items-center gap-2 font-semibold" style={{ color: correct ? 'var(--ok)' : 'var(--danger)' }}>
            {correct ? <CheckCircle2 size={18} className="animate-pop" aria-hidden /> : <XCircle size={18} aria-hidden />}
            {correct ? 'Correct' : `Not quite — the answer is: ${q.answer.map(a => q.options[a]).join(' + ')}`}
          </div>
          {!correct && picked.filter(x => !q.answer.includes(x)).map(x => (
            <p key={x}><span className="font-medium">Why "{q.options[x]}" is wrong: </span>{whyWrong(q, x)}</p>
          ))}
          <p><span className="font-medium">The concept: </span>{q.explanation}</p>
          {!correct && lesson && <p>Review: <Link className="text-accent underline" to={`/lesson/${lesson.id}`}>{lesson.title}</Link></p>}
        </div>
      )}
    </div>
  )
}

export function Quiz({ questions }: { questions: Question[] }) {
  const [results, setResults] = useState<Record<string, boolean>>({})
  const answered = Object.keys(results).length
  const right = Object.values(results).filter(Boolean).length
  const finished = answered === questions.length && questions.length > 0
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-base px-4 py-3 text-sm">
        <span className="font-medium">This session</span>
        <div className="flex gap-1" aria-hidden>
          {questions.map(q => <span key={q.id} className="h-2 w-6 rounded-full" style={{ background: q.id in results ? (results[q.id] ? 'var(--ok)' : 'var(--danger)') : 'var(--border-strong)' }} />)}
        </div>
        <span className="ml-auto muted" aria-live="polite">{answered}/{questions.length} answered · {right} correct</span>
      </div>
      {questions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} onAnswered={ok => setResults(r => ({ ...r, [q.id]: ok }))} />)}
      {finished && (
        <div className="flex items-center gap-4 rounded-2xl p-5 animate-rise" style={{ background: right === questions.length ? 'var(--ok-soft)' : 'var(--accent-soft)' }} role="status">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl animate-pop" style={{ background: right === questions.length ? 'var(--ok)' : 'var(--accent)', color: 'var(--surface)' }} aria-hidden>{right === questions.length ? <PartyPopper size={22} /> : <Target size={22} />}</span>
          <div>
            <div className="font-semibold">{right === questions.length ? 'Perfect score — you clearly understand this!' : `You scored ${right}/${questions.length}`}</div>
            <div className="text-sm muted">{right === questions.length ? 'Lock it in by explaining it back in your own words below.' : 'Read the explanations above, then revisit the sections they point to. Wrong answers are where the learning happens.'}</div>
          </div>
        </div>
      )}
    </div>
  )
}
