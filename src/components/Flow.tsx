import { useState, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight, Check, Workflow, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { glossaryById } from '../data/glossary'
import { lessonById } from '../data'
import { useProgress } from '../progress/store'
import { cx } from './ui'

const C = 'var(--lesson-color, var(--accent))'

/**
 * Interactive step diagram: a connected timeline of steps. Click a step, use the
 * arrow buttons, or press ←/→ while a step has focus to walk through it.
 */
export function Flow({ title, caption, steps }: { title: string; caption?: string; steps: { label: string; detail: string }[] }) {
  const [i, setI] = useState(0)
  const go = (k: number) => setI(Math.max(0, Math.min(steps.length - 1, k)))
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(i + 1); focusStep(i + 1) }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(i - 1); focusStep(i - 1) }
  }
  const id = title.replace(/\W+/g, '-').toLowerCase()
  const focusStep = (k: number) => requestAnimationFrame(() => document.getElementById(`${id}-step-${Math.max(0, Math.min(steps.length - 1, k))}`)?.focus())
  const pct = steps.length > 1 ? (i / (steps.length - 1)) * 100 : 100
  return (
    <figure className="card overflow-hidden">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-base px-5 py-3.5" style={{ background: `color-mix(in srgb, ${C} 7%, var(--surface))` }}>
        <span className="flex items-center gap-2 font-semibold"><Workflow size={17} style={{ color: C }} aria-hidden />{title}</span>
        {caption && <span className="text-sm muted">{caption}</span>}
      </figcaption>
      <div className="p-5">
        <div className="mb-1 text-xs muted">Step {i + 1} of {steps.length} · click a step or use the arrow keys</div>
        {/* horizontal on wide screens, vertical list on narrow */}
        <div className="relative mt-3">
          <div className="absolute bottom-6 left-[25px] top-6 w-0.5 rounded-full surface-2 md:hidden" aria-hidden>
            <div className="w-full rounded-full transition-all duration-500" style={{ height: `${pct}%`, background: C }} />
          </div>
          <div className="absolute left-[17px] right-[17px] top-[17px] hidden h-1 rounded-full surface-2 md:block" aria-hidden>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: C }} />
          </div>
          <ol className="relative grid gap-2 md:auto-cols-fr md:grid-flow-col md:gap-1" aria-label={title}>
              {steps.map((s, k) => {
                const state = k < i ? 'done' : k === i ? 'current' : 'todo'
                return (
                  <li key={k} className="md:flex md:flex-col md:items-center">
                    <button
                      id={`${id}-step-${k}`}
                      onClick={() => setI(k)}
                      onKeyDown={onKey}
                      aria-current={k === i ? 'step' : undefined}
                      tabIndex={k === i ? 0 : -1}
                      className={cx('group flex w-full items-center gap-3 rounded-xl p-2 text-left transition md:flex-col md:gap-2 md:text-center', k === i ? '' : 'hover:bg-[var(--surface-2)]')}
                    >
                      <span
                        className={cx('relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition', state === 'current' && 'animate-pulse-ring')}
                        style={state === 'todo' ? { borderColor: 'var(--border-strong)', background: 'var(--surface)', color: 'var(--muted)' } : { borderColor: C, background: state === 'current' ? C : `color-mix(in srgb, ${C} 15%, var(--surface))`, color: state === 'current' ? 'var(--surface)' : C }}
                      >
                        {state === 'done' ? <Check size={16} aria-hidden /> : k + 1}
                      </span>
                      <span className={cx('text-sm leading-snug', k === i ? 'font-semibold' : 'muted')} style={k === i ? { color: C } : undefined}>{s.label}</span>
                    </button>
                  </li>
                )
              })}
          </ol>
        </div>
        <div key={i} className="mt-4 flex items-start gap-3 rounded-2xl border p-4 animate-rise" style={{ borderColor: `color-mix(in srgb, ${C} 30%, transparent)`, background: `color-mix(in srgb, ${C} 6%, var(--surface))` }} aria-live="polite">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold" style={{ background: C, color: 'var(--surface)' }} aria-hidden>{i + 1}</span>
          <div className="flex-1 text-[15px] leading-relaxed"><span className="font-semibold">{steps[i].label}. </span>{steps[i].detail}</div>
          <div className="flex shrink-0 gap-1">
            <button className="btn !p-1.5" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous step"><ChevronLeft size={16} /></button>
            <button className="btn !p-1.5" onClick={() => go(i + 1)} disabled={i === steps.length - 1} aria-label="Next step"><ChevronRight size={16} /></button>
          </div>
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
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base px-5 py-3.5" style={{ background: `color-mix(in srgb, ${C} 7%, var(--surface))` }}>
        <div className="flex items-center gap-2 font-semibold"><Link2 size={17} style={{ color: C }} aria-hidden />Connect the dots</div>
        <div className="text-sm muted">{learnedCount} of {nodes.length} concepts studied · select one to explore</div>
      </div>
      <div className="p-5">
        <ol className="flex flex-wrap items-center gap-y-3">
          {nodes.map((n, k) => {
            const isHere = currentLessonId && n.lessons?.includes(currentLessonId)
            const on = sel === n.id
            const know = learned(n.id)
            return (
              <li key={n.id} className="flex items-center">
                <button
                  onClick={() => setSel(on ? null : n.id)}
                  aria-expanded={on}
                  className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition hover:-translate-y-0.5', isHere && 'font-semibold')}
                  style={on ? { borderColor: C, background: C, color: 'var(--surface)' } : know ? { borderColor: 'color-mix(in srgb, var(--ok) 40%, transparent)', background: 'var(--ok-soft)' } : { borderColor: 'var(--border)' }}
                >
                  {know ? <Check size={13} style={on ? undefined : { color: 'var(--ok)' }} aria-label="studied" /> : <span className="inline-block h-2 w-2 rounded-full border border-[var(--muted)]" aria-label="not studied yet" />}
                  {n.term}
                  {isHere && <span className="sr-only">(taught in this lesson)</span>}
                </button>
                {k < nodes.length - 1 && <ArrowRight size={14} className="mx-1 shrink-0 muted" aria-hidden />}
              </li>
            )
          })}
        </ol>
        {g && (
          <div key={g.id} className="mt-4 rounded-2xl surface-2 p-4 text-[15px] leading-relaxed animate-rise" aria-live="polite">
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
    </div>
  )
}
