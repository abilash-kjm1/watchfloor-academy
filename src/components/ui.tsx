import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Mode } from '../data/types'

export function cx(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(' ') }

const MODE: Record<Mode, { label: string; title: string; color: string; bg: string }> = {
  soc: { label: 'REAL SOC', title: 'Used in day-to-day SOC work', color: 'var(--soc)', bg: 'var(--soc-soft)' },
  exam: { label: 'SC-200 EXAM', title: 'Mainly needed for the certification exam', color: 'var(--exam)', bg: 'var(--exam-soft)' },
  both: { label: 'BOTH', title: 'Needed for the exam and real SOC work', color: 'var(--both)', bg: 'var(--both-soft)' },
}
export function ModeBadge({ mode, className }: { mode: Mode; className?: string }) {
  const m = MODE[mode]
  return (
    <span title={m.title} className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide', className)} style={{ color: m.color, background: m.bg }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  )
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-full border border-base px-2 py-0.5 text-xs muted', className)}>{children}</span>
}

export function Progress({ value, className, label }: { value: number; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full surface-2', className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${v}%` }} />
    </div>
  )
}

export function Card({ children, className, as: As = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' }) {
  return <As className={cx('card', className)}>{children}</As>
}

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">{eyebrow}</div>}
        <h1 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">{title}</h1>
        {children && <div className="mt-3 text-[15px] leading-relaxed muted">{children}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function SectionTitle({ id, number, children, className }: { id?: string; number?: number; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={cx('scroll-mt-24 flex items-baseline gap-3 text-xl font-semibold', className)}>
      {number !== undefined && <span className="font-mono text-xs muted">{String(number).padStart(2, '0')}</span>}
      <span>{children}</span>
    </h2>
  )
}

export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'tip' | 'warn'; title: string; children: ReactNode }) {
  const color = tone === 'tip' ? 'var(--both)' : tone === 'warn' ? 'var(--exam)' : 'var(--accent)'
  return (
    <div className="card p-4" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="mb-1 text-sm font-semibold" style={{ color }}>{title}</div>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </div>
  )
}

export function LinkCard({ to, title, children, meta }: { to: string; title: ReactNode; children?: ReactNode; meta?: ReactNode }) {
  return (
    <Link to={to} className="card block p-5 transition hover:border-[var(--accent)]">
      <div className="font-semibold">{title}</div>
      {children && <div className="mt-1.5 text-sm leading-relaxed muted">{children}</div>}
      {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
    </Link>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card p-8 text-center text-sm muted">{children}</div>
}
