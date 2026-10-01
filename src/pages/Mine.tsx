import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, ExternalLink, Download, Upload, StickyNote, Bookmark as BookmarkIcon, BookOpen, Terminal, ListChecks, Link2, BookOpenCheck, GraduationCap, CalendarRange, Settings as SettingsIcon, RotateCcw, CheckCircle2, type LucideIcon } from 'lucide-react'
import { actions, useProgress } from '../progress/store'
import { lessonById, ORDERED_LESSONS } from '../data'
import { moduleById } from '../data/curriculum'
import { NoteEditor, NoteItem } from '../components/NotesPanel'
import { Card, Empty, EmptyState, ErrorState, IconBadge, PageHeader, cx } from '../components/ui'

export function Notes() {
  const p = useProgress()
  const [q, setQ] = useState('')
  const list = p.notes.filter(n => !q || `${n.title} ${n.body}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="My learning" title="Notes" icon={StickyNote} color="var(--t-soc)">Notes you add inside lessons appear here with their lesson. Stored locally in this browser.</PageHeader>
      <Card className="mb-6 p-5"><div className="mb-2 font-semibold">New general note</div><NoteEditor /></Card>
      {p.notes.length > 0 && <input className="input mb-4" placeholder="Search notes…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search notes" />}
      {list.length === 0 ? (p.notes.length
        ? <Empty>No notes match “{q}”. Try a different word, or <button className="text-accent underline" onClick={() => setQ('')}>clear the search</button>.</Empty>
        : <EmptyState icon={StickyNote} color="var(--t-soc)" title="Your notebook is empty" action={{ to: '/curriculum', label: 'Explore lessons' }}>Write notes in your own words as you learn — every lesson has a notes panel at the bottom. Explaining ideas yourself is one of the best ways to remember them.</EmptyState>) : (
        <div className="space-y-3">{list.map(n => <NoteItem key={n.id} n={n} showLesson={n.lessonId ? lessonById.get(n.lessonId)?.title : 'General'} />)}</div>
      )}
    </div>
  )
}

const KIND_LABEL: Record<string, string> = { lesson: 'Lessons', kql: 'KQL examples', question: 'Questions', resource: 'Resources', glossary: 'Glossary', objective: 'SC-200 objectives' }
const KIND_ICON: Record<string, LucideIcon> = { lesson: BookOpen, kql: Terminal, question: ListChecks, resource: Link2, glossary: BookOpenCheck, objective: GraduationCap }

export function Bookmarks() {
  const p = useProgress()
  const groups = Object.keys(KIND_LABEL).map(k => [k, p.bookmarks.filter(b => b.kind === k)] as const).filter(([, l]) => l.length)
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="My learning" title="Bookmarks" icon={BookmarkIcon} color="var(--t-identity)">Everything you've saved for later, grouped by type.</PageHeader>
      {groups.length === 0 ? (
        <EmptyState icon={BookmarkIcon} color="var(--t-identity)" title="No bookmarks yet" action={{ to: '/curriculum', label: 'Explore lessons' }}>
          Bookmark lessons, KQL queries, questions, resources, glossary terms and SC-200 objectives with the <BookmarkIcon size={13} className="inline" aria-label="bookmark" /> icon to find them here later.
        </EmptyState>
      ) : groups.map(([k, list]) => {
        const Icon = KIND_ICON[k]
        return (
          <section key={k} className="mb-8" aria-labelledby={`bm-${k}`}>
            <h2 id={`bm-${k}`} className="mb-3 flex items-center gap-2 font-semibold"><IconBadge icon={Icon} size="sm" color="var(--t-identity)" />{KIND_LABEL[k]} <span className="text-sm font-normal muted">({list.length})</span></h2>
            <ul className="space-y-2">
              {list.map(b => (
                <li key={b.id} className="card card-hover flex items-center justify-between gap-3 p-3 text-sm">
                  {b.href.startsWith('http') ? <a href={b.href} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-accent">{b.title} <ExternalLink size={11} className="inline" aria-label="opens in a new tab" /></a> : <Link to={b.href} className="font-medium hover:text-accent">{b.title}</Link>}
                  <button className="rounded-lg p-1.5 muted hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]" onClick={() => actions.toggleBookmark(b)} aria-label={`Remove bookmark: ${b.title}`}><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

/** Study planner: schedules remaining lessons + labs + review into daily blocks. */
export function StudyPlan() {
  const p = useProgress()
  const hours = p.studyHours
  const plan = useMemo(() => {
    const budget = hours * 60
    const tasks: { title: string; minutes: number; href: string; kind: string }[] = []
    for (const l of ORDERED_LESSONS) {
      if (!p.completed[l.id]) tasks.push({ title: l.title, minutes: l.minutes, href: `/lesson/${l.id}`, kind: `Lesson · ${moduleById(l.moduleId)?.title}` })
      if (!p.labs[l.id]) tasks.push({ title: l.lab.title, minutes: 20, href: `/lesson/${l.id}#lab`, kind: 'Hands-on lab' })
      if (!p.completed[l.id] || l.quiz.some(q => !p.answers[q.id]?.lastCorrect)) tasks.push({ title: `Quiz & review: ${l.title}`, minutes: 10, href: `/lesson/${l.id}#quiz`, kind: 'Review' })
    }
    tasks.push({ title: 'SC-200 objective map walkthrough', minutes: 45, href: '/sc200', kind: 'Certification' })
    tasks.push({ title: 'Timed SC-200 practice exam', minutes: 45, href: '/sc200/practice', kind: 'Certification' })
    tasks.push({ title: 'Interview practice: 5 questions', minutes: 30, href: '/interview', kind: 'Career' })
    const days: { tasks: typeof tasks; minutes: number }[] = []
    let cur = { tasks: [] as typeof tasks, minutes: 0 }
    for (const t of tasks) {
      if (cur.minutes + t.minutes > budget && cur.tasks.length) { days.push(cur); cur = { tasks: [], minutes: 0 } }
      cur.tasks.push(t); cur.minutes += t.minutes
      if (cur.minutes >= budget - 5 || t.minutes > budget) {
        // add a short daily challenge to every day that has room
        days.push(cur); cur = { tasks: [], minutes: 0 }
      }
    }
    if (cur.tasks.length) days.push(cur)
    return days
  }, [p, hours])
  const start = new Date()
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Study plan" title="Your schedule" icon={CalendarRange} color="var(--t-microsoft)">The planner orders remaining lessons, labs and reviews by the learning path and fits them into your daily time. It updates as you complete work.</PageHeader>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Daily study time">
        {([1, 2, 3] as const).map(h => (
          <button key={h} onClick={() => actions.setStudyHours(h)} aria-pressed={hours === h} className={cx('rounded-2xl border px-4 py-3 text-left transition', hours === h ? 'border-[var(--accent)] bg-accent-soft' : 'border-base hover:bg-[var(--surface-2)]')}>
            <div className="font-semibold">{h} hour{h > 1 ? 's' : ''} / day</div>
            <div className="text-xs muted">{h === 1 ? 'Slow and structured' : h === 2 ? 'Balanced' : 'Accelerated'}</div>
          </button>
        ))}
      </div>
      <p className="mb-6 text-sm muted">{plan.length} study days remaining at {hours}h/day — estimated finish {new Date(start.getTime() + (plan.length - 1) * 86400000).toLocaleDateString()} (studying daily). Add the 5-minute <Link className="text-accent" to="/daily">daily challenge</Link> each day.</p>
      {plan.length === 0 ? (
        <EmptyState icon={CheckCircle2} color="var(--ok)" title="Nothing left to schedule" action={{ to: '/sc200/practice', label: 'Take a practice exam' }}>You've worked through every lesson, lab and review. Keep sharp with the daily challenge and interview practice.</EmptyState>
      ) : (
        <ol className="space-y-4">
          {plan.slice(0, 21).map((d, i) => (
            <li key={i} className="card overflow-hidden">
              <div className="flex justify-between border-b border-base px-4 py-2.5 text-sm" style={{ background: i === 0 ? 'var(--accent-soft)' : 'var(--surface-2)' }}>
                <span className="font-semibold">{i === 0 ? 'Today' : `Day ${i + 1}`} · {new Date(start.getTime() + i * 86400000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><span className="muted">{d.minutes} min</span>
              </div>
              <ul className="space-y-1.5 p-4 text-sm">{d.tasks.map((t, k) => {
                const color = t.kind.startsWith('Lesson') ? 'var(--t-foundations)' : t.kind === 'Hands-on lab' ? 'var(--t-career)' : t.kind === 'Review' ? 'var(--t-investigation)' : 'var(--t-cert)'
                return <li key={k} className="flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden /><Link to={t.href} className="truncate hover:text-accent">{t.title}</Link></span><span className="shrink-0 text-xs muted">{t.kind} · {t.minutes}m</span></li>
              })}</ul>
            </li>
          ))}
        </ol>
      )}
      {plan.length > 21 && <p className="mt-4 text-sm muted">Showing the first 21 days.</p>}
    </div>
  )
}

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [importError, setImportError] = useState<{ file: string; detail: string } | null>(null)
  const download = () => {
    const blob = new Blob([actions.exportJson()], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `watchfloor-progress-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(a.href)
    setMsg('Backup downloaded.')
  }
  const upload = async (f: File) => {
    setImportError(null)
    try { actions.importJson(await f.text()); setMsg('Progress imported.') } catch (e) { setMsg(''); setImportError({ file: f.name, detail: (e as Error).message }) }
    if (fileRef.current) fileRef.current.value = ''
  }
  const row = (icon: LucideIcon, color: string, title: string, body: string, action: ReactNode) => (
    <Card className="flex flex-wrap items-center gap-4 p-5"><IconBadge icon={icon} color={color} /><div className="min-w-0 flex-1"><div className="font-semibold">{title}</div><div className="text-sm muted">{body}</div></div>{action}</Card>
  )
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Settings" title="Your data" icon={SettingsIcon}>Progress, notes, bookmarks and results are stored only in this browser (localStorage). Clearing site data removes them — export a backup to move between devices.</PageHeader>
      <div className="space-y-4">
        {row(Download, 'var(--t-investigation)', 'Export progress', 'Download everything as a JSON file.', <button className="btn" onClick={download}><Download size={16} aria-hidden /> Export</button>)}
        {row(Upload, 'var(--t-microsoft)', 'Import progress', 'Replace current data with an exported file.', <><button className="btn" onClick={() => fileRef.current?.click()}><Upload size={16} aria-hidden /> Import</button><input ref={fileRef} type="file" accept="application/json" className="hidden" aria-label="Choose a progress file to import" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} /></>)}
        {importError && (
          <ErrorState title="Couldn't import that file"
            what={<>The file <strong>{importError.file}</strong> wasn't loaded, and your current progress is unchanged.</>}
            why={<>It doesn't look like a Watchfloor progress backup ({importError.detail}). This happens if the file was edited, is from another app, or was only partly downloaded.</>}
            fix={<>Choose the <code className="font-mono text-sm">watchfloor-progress-YYYY-MM-DD.json</code> file created by <em>Export</em>. If you edited it, export a fresh copy from the original browser.</>}
            actions={<><button className="btn btn-primary" onClick={() => fileRef.current?.click()}>Choose another file</button><button className="btn" onClick={() => setImportError(null)}>Dismiss</button></>} />
        )}
        {row(RotateCcw, 'var(--danger)', 'Reset everything', 'Deletes all progress, notes and bookmarks in this browser.', <button className="btn" style={{ color: 'var(--danger)' }} onClick={() => { if (confirm('Delete all progress, notes and bookmarks? This cannot be undone.')) { actions.reset(); setMsg('All data reset.') } }}>Reset</button>)}
        {msg && <p className="flex items-center gap-2 text-sm" role="status" style={{ color: 'var(--ok)' }}><CheckCircle2 size={16} aria-hidden />{msg}</p>}
        <Card className="p-5 text-sm leading-relaxed">
          <div className="mb-1 font-semibold">About this academy</div>
          Independent educational project; not affiliated with or endorsed by Microsoft or MITRE. Microsoft product names are used to describe what you'll learn. All exercises are defensive and use your own computer, free public sample data, or your own lab/trial tenant.
        </Card>
      </div>
    </div>
  )
}
