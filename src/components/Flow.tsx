import { useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { glossaryById } from '../data/glossary'
import { lessonById } from '../data'
import { useProgress } from '../progress/store'
import { cx } from './ui'

/** Interactive step diagram: click a step (or step through) to read its explanation. */
export function Flow({ title, caption, steps }: { title: string; caption?: string; steps: { label: string; detail: string }[] }) {
  const [i, setI] = useState(0)
  return (
    <figure className="card p-5">
      <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{title}</span>
        {caption && <span className="text-sm muted">{caption}</span>}
      </figcaption>
      <ol className="flex flex-wrap items-center gap-y-3" aria-label={title}>
        {steps.map((s, k) => (
          <li key={k} className="flex items-center">
            <button
              onClick={() => setI(k)}
              aria-current={k === i ? 'step' : undefined}
              className={cx('rounded-lg border px-3 py-2 text-left text-sm font-medium transition', k === i ? 'border-[var(--accent)] bg-accent-soft text-accent' : 'border-base hover:bg-[var(--surface-2)]')}
            >
              <span className="mr-1.5 font-mono text-[11px] muted">{k + 1}</span>{s.label}
            </button>
            {k < steps.length - 1 && <ArrowRight size={16} className="mx-1.5 shrink-0 muted" aria-hidden />}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-start gap-3 rounded-lg surface-2 p-4" aria-live="polite">
        <div className="flex-1 text-[15px] leading-relaxed"><span className="font-semibold">{steps[i].label}. </span>{steps[i].detail}</div>
        <div className="flex shrink-0 gap-1">
          <button className="btn !p-1.5" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="Previous step"><ChevronLeft size={16} /></button>
          <button className="btn !p-1.5" onClick={() => setI(Math.min(steps.length - 1, i + 1))} disabled={i === steps.length - 1} aria-label="Next step"><ChevronRight size={16} /></button>
        </div>
      </div>
    </figure>
  )
}

/**
 * Connect-the-Dots engine: renders a chain of glossary concepts, showing which
 * ones the learner has already studied and where each is taught.
 */
export function ConnectDots({ chain, currentLessonId }: { chain: string[]; currentLessonId?: string }) {
  const p = useProgress()
  const [sel, setSel] = useState<string | null>(null)
  const nodes = chain.map(id => glossaryById.get(id)).filter((g): g is NonNullable<typeof g> => !!g)
  const learned = (id: string) => (glossaryById.get(id)?.lessons ?? []).some(l => p.completed[l])
  const learnedCount = nodes.filter(n => learned(n.id)).length
  const g = sel ? glossaryById.get(sel) : null
  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-semibold">Connect the dots</div>
        <div className="text-sm muted">{learnedCount} of {nodes.length} concepts in this chain studied</div>
      </div>
      <ol className="flex flex-wrap items-center gap-y-3">
        {nodes.map((n, k) => {
          const isHere = currentLessonId && n.lessons?.includes(currentLessonId)
          return (
            <li key={n.id} className="flex items-center">
              <button
                onClick={() => setSel(sel === n.id ? null : n.id)}
                aria-expanded={sel === n.id}
                className={cx('rounded-full border px-3 py-1.5 text-sm transition', sel === n.id ? 'border-[var(--accent)] bg-accent-soft text-accent' : 'border-base hover:bg-[var(--surface-2)]', isHere && 'font-semibold')}
                title={learned(n.id) ? 'You have studied a lesson covering this' : 'Not studied yet'}
              >
                <span className={cx('mr-1.5 inline-block h-2 w-2 rounded-full align-middle', learned(n.id) ? 'bg-[var(--both)]' : 'border border-[var(--muted)]')} />
                {n.term}
              </button>
              {k < nodes.length - 1 && <ArrowRight size={14} className="mx-1 shrink-0 muted" aria-hidden />}
            </li>
          )
        })}
      </ol>
      {g && (
        <div className="mt-4 rounded-lg surface-2 p-4 text-[15px] leading-relaxed" aria-live="polite">
          <div className="font-semibold">{g.term}</div>
          <p className="mt-1">{g.definition}</p>
          <p className="mt-1 text-sm muted">Why it matters: {g.why}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {(g.lessons ?? []).filter(l => l !== currentLessonId).slice(0, 3).map(l => {
              const lesson = lessonById.get(l)
              return lesson ? <Link key={l} className="btn !py-1" to={`/lesson/${l}`}>{p.completed[l] ? '✓ ' : ''}{lesson.title}</Link> : null
            })}
            <Link className="btn !py-1" to={`/glossary?term=${g.id}`}>Glossary entry</Link>
          </div>
        </div>
      )}
    </div>
  )
}
