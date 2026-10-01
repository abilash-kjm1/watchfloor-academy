import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Bookmark } from 'lucide-react'
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
    <div className="card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="text-[15px] font-medium leading-relaxed">
          {index !== undefined && <span className="mr-2 font-mono text-xs muted">Q{index + 1}</span>}
          {q.prompt}
          {multi && <span className="ml-2 text-xs font-semibold text-accent">Select {q.answer.length}</span>}
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
                'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition',
                !done && (isPicked ? 'border-[var(--accent)] bg-accent-soft' : 'border-base hover:bg-[var(--surface-2)]'),
                done && isAnswer && 'border-[var(--both)] bg-[var(--both-soft)]',
                done && isPicked && !isAnswer && 'border-[var(--danger)] bg-[var(--danger-soft)]',
                done && !isPicked && !isAnswer && 'border-base opacity-70',
              )}
            >
              <span className={cx('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border', multi ? 'rounded' : 'rounded-full', isPicked ? 'border-[var(--accent)] bg-accent' : 'border-[var(--muted)]')} />
              <span className="leading-relaxed">{o}</span>
            </button>
          )
        })}
      </div>
      {!done ? (
        <button className="btn btn-primary mt-4" onClick={submit} disabled={!picked.length}>Check answer</button>
      ) : (
        <div className="mt-4 space-y-2 rounded-lg surface-2 p-4 text-sm leading-relaxed" aria-live="polite">
          <div className="flex items-center gap-2 font-semibold" style={{ color: correct ? 'var(--both)' : 'var(--danger)' }}>
            {correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
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
  return <div className="space-y-4">{questions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)}</div>
}
