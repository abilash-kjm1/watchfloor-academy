import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, ExternalLink, Download, Upload } from 'lucide-react'
import { actions, useProgress } from '../progress/store'
import { lessonById, ORDERED_LESSONS } from '../data'
import { moduleById } from '../data/curriculum'
import { NoteEditor, NoteItem } from '../components/NotesPanel'
import { Card, Empty, PageHeader, cx } from '../components/ui'

export function Notes() {
  const p = useProgress()
  const [q, setQ] = useState('')
  const list = p.notes.filter(n => !q || `${n.title} ${n.body}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="My learning" title="Notes">Notes you add inside lessons appear here with their lesson. Stored locally in this browser.</PageHeader>
      <Card className="mb-6 p-5"><div className="mb-2 font-semibold">New general note</div><NoteEditor /></Card>
      <input className="input mb-4" placeholder="Search notes…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search notes" />
      {list.length === 0 ? <Empty>{p.notes.length ? 'No notes match.' : 'No notes yet. Add one above or in any lesson.'}</Empty> : (
        <div className="space-y-3">{list.map(n => <NoteItem key={n.id} n={n} showLesson={n.lessonId ? lessonById.get(n.lessonId)?.title : 'General'} />)}</div>
      )}
    </div>
  )
}

const KIND_LABEL: Record<string, string> = { lesson: 'Lessons', kql: 'KQL examples', question: 'Questions', resource: 'Resources', glossary: 'Glossary', objective: 'SC-200 objectives' }

export function Bookmarks() {
  const p = useProgress()
  const groups = Object.keys(KIND_LABEL).map(k => [k, p.bookmarks.filter(b => b.kind === k)] as const).filter(([, l]) => l.length)
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="My learning" title="Bookmarks">Bookmark lessons, KQL examples, questions, resources, glossary terms and objectives with the bookmark icon.</PageHeader>
      {groups.length === 0 ? <Empty>No bookmarks yet.</Empty> : groups.map(([k, list]) => (
        <section key={k} className="mb-8">
          <h2 className="mb-3 font-semibold">{KIND_LABEL[k]}</h2>
          <ul className="space-y-2">
            {list.map(b => (
              <li key={b.id} className="card flex items-center justify-between gap-3 p-3 text-sm">
                {b.href.startsWith('http') ? <a href={b.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{b.title} <ExternalLink size={11} className="inline" /></a> : <Link to={b.href} className="hover:text-accent">{b.title}</Link>}
                <button className="rounded p-1 hover:bg-[var(--surface-2)]" onClick={() => actions.toggleBookmark(b)} aria-label="Remove bookmark"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        </section>
      ))}
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
      <PageHeader eyebrow="Study plan" title="Your schedule">The planner orders remaining lessons, labs and reviews by the learning path and fits them into your daily time. It updates as you complete work.</PageHeader>
      <div className="mb-6 flex flex-wrap gap-2">
        {([1, 2, 3] as const).map(h => (
          <button key={h} onClick={() => actions.setStudyHours(h)} className={cx('rounded-lg border px-4 py-3 text-left', hours === h ? 'border-[var(--accent)] bg-accent-soft' : 'border-base')}>
            <div className="font-semibold">{h} hour{h > 1 ? 's' : ''} / day</div>
            <div className="text-xs muted">{h === 1 ? 'Slow and structured' : h === 2 ? 'Balanced' : 'Accelerated'}</div>
          </button>
        ))}
      </div>
      <p className="mb-6 text-sm muted">{plan.length} study days remaining at {hours}h/day — estimated finish {new Date(start.getTime() + (plan.length - 1) * 86400000).toLocaleDateString()} (studying daily). Add the 5-minute <Link className="text-accent" to="/daily">daily challenge</Link> each day.</p>
      <ol className="space-y-4">
        {plan.slice(0, 21).map((d, i) => (
          <li key={i} className="card p-4">
            <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">Day {i + 1} · {new Date(start.getTime() + i * 86400000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><span className="muted">{d.minutes} min</span></div>
            <ul className="space-y-1 text-sm">{d.tasks.map((t, k) => <li key={k} className="flex justify-between gap-3"><Link to={t.href} className="hover:text-accent">{t.title}</Link><span className="shrink-0 text-xs muted">{t.kind} · {t.minutes}m</span></li>)}</ul>
          </li>
        ))}
      </ol>
      {plan.length > 21 && <p className="mt-4 text-sm muted">Showing the first 21 days.</p>}
    </div>
  )
}

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const download = () => {
    const blob = new Blob([actions.exportJson()], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `watchfloor-progress-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(a.href)
  }
  const upload = async (f: File) => {
    try { actions.importJson(await f.text()); setMsg('Progress imported.') } catch (e) { setMsg(`Import failed: ${(e as Error).message}`) }
  }
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Settings" title="Your data">Progress, notes, bookmarks and results are stored only in this browser (localStorage). Clearing site data removes them — export a backup to move between devices.</PageHeader>
      <div className="space-y-4">
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5"><div><div className="font-semibold">Export progress</div><div className="text-sm muted">Download everything as a JSON file.</div></div><button className="btn" onClick={download}><Download size={16} /> Export</button></Card>
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5"><div><div className="font-semibold">Import progress</div><div className="text-sm muted">Replace current data with an exported file.</div></div><button className="btn" onClick={() => fileRef.current?.click()}><Upload size={16} /> Import</button><input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} /></Card>
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5"><div><div className="font-semibold">Reset everything</div><div className="text-sm muted">Deletes all progress, notes and bookmarks in this browser.</div></div><button className="btn" style={{ color: 'var(--danger)' }} onClick={() => { if (confirm('Delete all progress, notes and bookmarks? This cannot be undone.')) { actions.reset(); setMsg('All data reset.') } }}>Reset</button></Card>
        {msg && <p className="text-sm" role="status">{msg}</p>}
        <Card className="p-5 text-sm leading-relaxed">
          <div className="mb-1 font-semibold">About this academy</div>
          Independent educational project; not affiliated with or endorsed by Microsoft or MITRE. Microsoft product names are used to describe what you'll learn. All exercises are defensive and use your own computer, free public sample data, or your own lab/trial tenant.
        </Card>
      </div>
    </div>
  )
}
