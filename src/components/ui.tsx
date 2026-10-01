import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Info, Lightbulb, Sparkles, ShieldAlert, type LucideIcon } from 'lucide-react'
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
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} aria-hidden />
      {m.label}
    </span>
  )
}

export function Pill({ children, className, color }: { children: ReactNode; className?: string; color?: string }) {
  if (color) return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', className)} style={{ color, background: `color-mix(in srgb, ${color} 13%, transparent)` }}>{children}</span>
  return <span className={cx('inline-flex items-center gap-1 rounded-full border border-base px-2 py-0.5 text-xs muted', className)}>{children}</span>
}

export function Progress({ value, className, label, color = 'var(--accent)' }: { value: number; className?: string; label?: string; color?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full surface-2', className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${v}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${color} 75%, transparent), ${color})` }} />
    </div>
  )
}

/** Circular progress indicator; the center shows the percentage unless children are provided. */
export function ProgressRing({ value, size = 56, stroke = 6, color = 'var(--accent)', label, children }: { value: number; size?: number; stroke?: number; color?: string; label?: string; children?: ReactNode }) {
  const v = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <span className="absolute text-[11px] font-semibold tabular-nums" style={{ color }}>{children ?? `${Math.round(v)}%`}</span>
    </div>
  )
}

/** A rounded colored square holding an icon — the visual anchor of cards and headings. */
export function IconBadge({ icon: Icon, color = 'var(--accent)', size = 'md', solid = false }: { icon: LucideIcon; color?: string; size?: 'sm' | 'md' | 'lg'; solid?: boolean }) {
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-10 w-10 rounded-xl'
  const px = size === 'sm' ? 16 : size === 'lg' ? 26 : 20
  const style: CSSProperties = solid
    ? { background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 65%, #000))`, color: 'var(--surface)' }
    : { background: `color-mix(in srgb, ${color} 14%, transparent)`, color }
  return <span className={cx('inline-grid shrink-0 place-items-center', box)} style={style} aria-hidden><Icon size={px} /></span>
}

export function Card({ children, className, as: As = 'div', style }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article'; style?: CSSProperties }) {
  return <As className={cx('card', className)} style={style}>{children}</As>
}

export function PageHeader({ eyebrow, title, children, actions, icon, color = 'var(--accent)' }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode; actions?: ReactNode; icon?: LucideIcon; color?: string }) {
  return (
    <header className="relative mb-8 overflow-hidden rounded-3xl border border-base px-6 py-7 md:px-8" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color} 10%, var(--surface)), var(--surface) 60%)` }}>
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" aria-hidden />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-3xl gap-4">
          {icon && <div className="hidden sm:block"><IconBadge icon={icon} color={color} size="lg" solid /></div>}
          <div>
            {eyebrow && <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color }}>{eyebrow}</div>}
            <h1 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">{title}</h1>
            {children && <div className="mt-3 text-[15px] leading-relaxed muted">{children}</div>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  )
}

export function SectionTitle({ id, number, children, className, icon, color = 'var(--accent)' }: { id?: string; number?: number; children: ReactNode; className?: string; icon?: LucideIcon; color?: string }) {
  return (
    <h2 id={id} className={cx('scroll-mt-28 flex items-center gap-3 text-xl font-semibold', className)}>
      {icon ? <IconBadge icon={icon} color={color} size="sm" /> : number !== undefined && <span className="font-mono text-xs muted">{String(number).padStart(2, '0')}</span>}
      <span>{children}</span>
    </h2>
  )
}

type Tone = 'info' | 'tip' | 'warn' | 'normal' | 'suspicious' | 'analogy' | 'key'
const TONES: Record<Tone, { color: string; icon: LucideIcon }> = {
  info: { color: 'var(--accent)', icon: Info },
  tip: { color: 'var(--both)', icon: Lightbulb },
  warn: { color: 'var(--exam)', icon: AlertTriangle },
  normal: { color: 'var(--ok)', icon: CheckCircle2 },
  suspicious: { color: 'var(--danger)', icon: ShieldAlert },
  analogy: { color: 'var(--t-identity)', icon: Sparkles },
  key: { color: 'var(--lesson-color, var(--accent))', icon: Lightbulb },
}
export function Callout({ tone = 'info', title, children, className }: { tone?: Tone; title: string; children: ReactNode; className?: string }) {
  const { color, icon: Icon } = TONES[tone]
  return (
    <div className={cx('rounded-2xl border p-4 md:p-5', className)} style={{ background: `color-mix(in srgb, ${color} 8%, var(--surface))`, borderColor: `color-mix(in srgb, ${color} 28%, transparent)` }}>
      <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold" style={{ color }}><Icon size={16} aria-hidden />{title}</div>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </div>
  )
}

export function LinkCard({ to, title, children, meta, icon, color = 'var(--accent)' }: { to: string; title: ReactNode; children?: ReactNode; meta?: ReactNode; icon?: LucideIcon; color?: string }) {
  return (
    <Link to={to} className="card card-hover group block p-5">
      <div className="flex items-start gap-3">
        {icon && <IconBadge icon={icon} color={color} />}
        <div className="min-w-0">
          <div className="font-semibold transition group-hover:text-[var(--accent)]">{title}</div>
          {children && <div className="mt-1.5 text-sm leading-relaxed muted">{children}</div>}
        </div>
      </div>
      {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
    </Link>
  )
}

export function StatCard({ icon, label, value, hint, color }: { icon: LucideIcon; label: string; value: ReactNode; hint?: ReactNode; color: string }) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-60" style={{ background: `radial-gradient(circle, color-mix(in srgb, ${color} 30%, transparent), transparent 70%)` }} aria-hidden />
      <IconBadge icon={icon} color={color} />
      <div className="mt-3 text-3xl font-semibold tabular-nums">{value}</div>
      <div className="text-sm font-medium">{label}</div>
      {hint && <div className="mt-0.5 text-xs muted">{hint}</div>}
    </div>
  )
}

/** Friendly empty state: what this place is for, and one clear action to fill it. */
export function EmptyState({ icon: Icon, title, children, action, color = 'var(--accent)' }: { icon: LucideIcon; title: string; children?: ReactNode; action?: { to: string; label: string }; color?: string }) {
  return (
    <div className="card relative overflow-hidden px-6 py-12 text-center">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-50" aria-hidden />
      <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl animate-float" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }} aria-hidden><Icon size={30} /></div>
      <h2 className="relative mt-4 text-lg font-semibold">{title}</h2>
      {children && <div className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed muted">{children}</div>}
      {action && <Link to={action.to} className="btn btn-primary relative mt-5">{action.label}</Link>}
    </div>
  )
}

/** Helpful error state: what happened, why it may have happened, and how to fix it. */
export function ErrorState({ title, what, why, fix, actions }: { title: string; what: ReactNode; why: ReactNode; fix: ReactNode; actions?: ReactNode }) {
  const row = (label: string, body: ReactNode) => (
    <div className="grid gap-1 sm:grid-cols-[110px_1fr]"><dt className="text-xs font-semibold uppercase tracking-wide muted">{label}</dt><dd className="text-[15px] leading-relaxed">{body}</dd></div>
  )
  return (
    <div className="card overflow-hidden" role="alert">
      <div className="flex items-center gap-3 px-6 py-4" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
        <AlertTriangle size={20} aria-hidden /><h2 className="font-semibold">{title}</h2>
      </div>
      <dl className="space-y-3 px-6 py-5">{row('What happened', what)}{row('Why', why)}{row('How to fix', fix)}</dl>
      {actions && <div className="flex flex-wrap gap-2 border-t border-base px-6 py-4">{actions}</div>}
    </div>
  )
}

/** Back-compat simple empty message (used for inline "nothing here" notes). */
export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-base p-8 text-center text-sm muted">{children}</div>
}
