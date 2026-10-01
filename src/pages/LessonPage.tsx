import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bookmark, CheckCircle2, ChevronDown, Circle, CircleDot, Clock, ExternalLink, Eye, Compass, Target, Signpost,
  HelpCircle, Lightbulb, Tag, Puzzle, Sparkles, Cog, Workflow, Globe, ShieldAlert, ShieldCheck, Swords, FileSearch, MapPin, UserSearch,
  Shield, Terminal, Crosshair, GraduationCap, FlaskConical, ListChecks, MessageCircle, MessagesSquare, AlertTriangle, Radio, Brain, KeyRound, Link2,
  BookOpen, StickyNote, PartyPopper, type LucideIcon,
} from 'lucide-react'
import { lessonById, nextLesson, prevLesson, ORDERED_LESSONS } from '../data'
import { moduleById } from '../data/curriculum'
import { objectiveById } from '../data/sc200'
import { interviewById } from '../data/interview'
import { LEVELS, type Lesson } from '../data/types'
import { actions, useProgress } from '../progress/store'
import { Markdown } from '../components/Markdown'
import { KqlCode } from '../components/KqlCode'
import { ConnectDots, Flow } from '../components/Flow'
import { Quiz } from '../components/Quiz'
import { ResourceCards } from '../components/Resources'
import { NotesPanel } from '../components/NotesPanel'
import { Callout, IconBadge, ModeBadge, SectionTitle, cx } from '../components/ui'
import { lessonVars, moduleIcon, trackTheme } from '../theme'
import NotFound from './NotFound'

const LEVEL_LABEL: Record<string, string> = { beginner: 'Beginner', understand: 'Understand', recognize: 'Recognize', practice: 'Practice', investigate: 'Investigate', analyze: 'Analyze', hunt: 'Hunt', detect: 'Create detection' }

interface Sec { id: string; n: number; title: string; node: ReactNode; level: number }

/** Depth layers: start simple, then add technical, security, SOC, Microsoft, KQL, detection and practice. */
const DEPTH_LEVELS: Record<number, { title: string; blurb: string; color: string; icon: LucideIcon }> = {
  1: { title: 'The simple idea', blurb: 'What it is and why it exists, in plain language.', color: 'var(--t-foundations)', icon: Lightbulb },
  2: { title: 'How it works', blurb: 'The technical mechanism, step by step.', color: 'var(--t-identity)', icon: Cog },
  3: { title: 'The security view', blurb: 'Normal vs suspicious, and how attackers misuse it (defensively).', color: 'var(--t-security)', icon: ShieldAlert },
  4: { title: 'The SOC view', blurb: 'What evidence it leaves, where, and how an analyst uses it.', color: 'var(--t-soc)', icon: FileSearch },
  5: { title: 'Microsoft tools', blurb: 'Which Microsoft products see this evidence.', color: 'var(--t-microsoft)', icon: Shield },
  6: { title: 'Query the evidence', blurb: 'KQL that finds it.', color: 'var(--t-investigation)', icon: Terminal },
  7: { title: 'Detection & frameworks', blurb: 'MITRE ATT&CK and SC-200 connections.', color: 'var(--t-cert)', icon: Crosshair },
  8: { title: 'Practice & review', blurb: 'Lab, quiz, explain-it-back, interview and recap.', color: 'var(--t-career)', icon: GraduationCap },
}

const SECTION_ICON: Record<string, LucideIcon> = {
  what: HelpCircle, why: Lightbulb, name: Tag, problem: Puzzle, analogy: Sparkles, how: Cog, diagram: Workflow, 'real-world': Globe,
  'security-example': ShieldAlert, normal: ShieldCheck, suspicious: AlertTriangle, abuse: Swords, evidence: FileSearch, where: MapPin,
  analyst: UserSearch, microsoft: Shield, kql: Terminal, mitre: Crosshair, sc200: GraduationCap, lab: FlaskConical, quiz: ListChecks,
  'explain-back': MessageCircle, interview: MessagesSquare, mistakes: AlertTriangle, tip: Radio, think: Brain, takeaways: KeyRound,
  connect: Link2, resources: BookOpen, notes: StickyNote,
}

/**
 * Sections that rely on later lessons show a "Preview" note when the learner reaches
 * them early, so beginners know to skim rather than feel lost.
 */
const PREVIEW_PREREQ: Record<string, string> = { microsoft: 'sentinel-architecture', kql: 'kql-what-why', mitre: 'mitre-framework' }

function PreviewNote({ prereqId }: { prereqId: string }) {
  const pre = lessonById.get(prereqId)
  if (!pre) return null
  return (
    <div className="mb-4 flex gap-3 rounded-xl border border-dashed border-base p-3 text-sm muted">
      <Eye size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      <div><span className="font-semibold text-accent">Preview.</span> This part uses ideas taught later in <Link className="text-accent underline" to={`/lesson/${pre.id}`}>{pre.title}</Link>. Skim it now to see where you're heading — it's fine if it doesn't fully make sense yet.</div>
    </div>
  )
}

function buildSections(l: Lesson, isPreview: (prereq: string) => boolean): Sec[] {
  const s = l.sections
  const out: Sec[] = []
  let n = 0
  const add = (level: number, id: string, title: string, node: ReactNode | undefined | false) => {
    if (!node) return
    n++
    const pre = PREVIEW_PREREQ[id]
    out.push({ id, n, title, level, node: pre && isPreview(pre) ? <><PreviewNote prereqId={pre} />{node}</> : node })
  }
  const md = (t?: string) => (t ? <Markdown text={t} /> : undefined)
  // Level 1 — simple
  add(1, 'what', 'What is it?', md(s.what))
  add(1, 'why', 'Why does it exist?', md(s.why))
  add(1, 'name', 'Why is it called that?', md(s.name))
  add(1, 'problem', 'What problem does it solve?', md(s.problem))
  add(1, 'analogy', 'Simple analogy', s.analogy && <Callout tone="analogy" title="Think of it like this"><Markdown text={s.analogy} /></Callout>)
  // Level 2 — technical
  add(2, 'how', 'How does it work?', s.how && (
    <>
      <Markdown text={s.how} />
      {l.deepDives?.map(d => (
        <details key={d.title} className="group mt-4 rounded-2xl border border-base surface-2 p-4" open>
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold"><ChevronDown size={16} className="transition group-open:rotate-180" aria-hidden />{d.title}</summary>
          <Markdown text={d.body} className="mt-2" />
        </details>
      ))}
    </>
  ))
  add(2, 'diagram', 'Visual diagram', l.diagram && <Flow {...l.diagram} />)
  add(2, 'real-world', 'Real-world example', s.realWorld && <div className="rounded-2xl border border-base p-5" style={{ background: 'color-mix(in srgb, var(--t-foundations) 6%, var(--surface))' }}><Markdown text={s.realWorld} /></div>)
  // Level 3 — security
  add(3, 'security-example', 'Security example', md(s.securityExample))
  add(3, 'normal', 'What does normal look like?', s.normal && <Callout tone="normal" title="Normal — expected activity"><Markdown text={s.normal} /></Callout>)
  add(3, 'suspicious', 'What does suspicious look like?', s.suspicious && <Callout tone="suspicious" title="Suspicious — worth a closer look"><Markdown text={s.suspicious} /></Callout>)
  add(3, 'abuse', 'How can attackers abuse it? (defensive view)', md(s.abuse))
  // Level 4 — SOC
  add(4, 'evidence', 'What evidence does it create?', md(s.evidence))
  add(4, 'where', 'Where does that evidence appear?', md(s.where))
  add(4, 'analyst', 'How does a SOC analyst use it?', md(s.analyst))
  // Level 5 — Microsoft
  add(5, 'microsoft', 'Microsoft connection', md(s.microsoft))
  // Level 6 — KQL
  add(6, 'kql', 'KQL connection', l.kql?.length && (
    <div className="space-y-6">
      {l.kql.map(k => <KqlExample key={k.title} lessonId={l.id} k={k} />)}
      <p className="text-sm muted">These queries were checked with Microsoft's KQL parser against the official table schemas. Run them in Microsoft Sentinel Logs or Defender Advanced Hunting in your own lab or trial tenant. To practice syntax for free, use the Azure Data Explorer help cluster (see the KQL lessons).</p>
    </div>
  ))
  // Level 7 — detection & frameworks
  add(7, 'mitre', 'MITRE ATT&CK connection', l.mitre?.length && (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {l.mitre.map(t => (
          <a key={t.id} href={`https://attack.mitre.org/${t.id.startsWith('TA') ? 'tactics' : 'techniques'}/${t.id.replace('.', '/')}/`} target="_blank" rel="noopener noreferrer" className="card card-hover block p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-md px-2 py-0.5 font-mono text-xs font-semibold" style={{ background: 'var(--t-cert-soft)', color: 'var(--t-cert)' }}>{t.id}</span>
              <ExternalLink size={13} className="muted" aria-label="opens MITRE ATT&CK in a new tab" />
            </div>
            <div className="mt-2 font-semibold leading-snug">{t.name}</div>
            <div className="text-xs muted">{t.tactic}</div>
            <p className="mt-2 text-sm leading-relaxed">{t.note}</p>
          </a>
        ))}
      </div>
      <p className="mt-3 text-xs muted">Mappings checked against MITRE ATT&CK Enterprise v19 (October 2026). ATT&CK changes over time — confirm on attack.mitre.org.</p>
    </div>
  ))
  add(7, 'sc200', 'SC-200 connection', (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'color-mix(in srgb, var(--t-cert) 30%, transparent)', background: 'color-mix(in srgb, var(--t-cert) 6%, var(--surface))' }}>
      <p className="text-[15px] leading-relaxed">{l.sc200.note}</p>
      <ul className="mt-3 space-y-2">
        {l.sc200.objectives.map(id => {
          const o = objectiveById.get(id)
          return o ? <li key={id}><Link to={`/sc200#${id}`} className="flex items-start gap-2 text-sm hover:text-accent"><ModeBadge mode={o.mode} className="mt-0.5 shrink-0" /><span>{o.text}</span></Link></li> : null
        })}
      </ul>
    </div>
  ))
  // Level 8 — practice & review
  add(8, 'lab', 'Hands-on lab', <LabBlock l={l} />)
  add(8, 'quiz', 'Quiz', <Quiz questions={l.quiz} />)
  add(8, 'explain-back', 'Explain it back', l.explainBack?.length && <ExplainBack items={l.explainBack} />)
  add(8, 'interview', 'Interview questions', (
    <ul className="space-y-2">
      {l.interview.map(id => interviewById.get(id)).filter(Boolean).map(q => (
        <li key={q!.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3"><IconBadge icon={MessagesSquare} color="var(--t-career)" size="sm" /><div><div className="font-medium">{q!.question}</div><div className="text-xs capitalize muted">{q!.level}</div></div></div>
          <Link className="btn shrink-0" to={`/interview?q=${q!.id}`}>Practice answering</Link>
        </li>
      ))}
    </ul>
  ))
  add(8, 'mistakes', 'Common mistakes', <ul className="space-y-2">{l.mistakes.map(m => <li key={m} className="flex gap-3 rounded-xl p-3 text-[15px] leading-relaxed" style={{ background: 'var(--exam-soft)' }}><AlertTriangle size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--exam)' }} aria-hidden />{m}</li>)}</ul>)
  add(8, 'tip', 'SOC analyst tip', <Callout tone="key" title="From the watch floor">{l.tip}</Callout>)
  add(8, 'think', 'Think like an analyst', <Think prompt={l.think.prompt} answer={l.think.answer} />)
  add(8, 'takeaways', 'Key takeaways', (
    <ul className="grid gap-2 sm:grid-cols-2">{l.takeaways.map(t => <li key={t} className="flex gap-2.5 rounded-xl border border-base p-3 text-[15px] leading-relaxed"><CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--ok)' }} aria-hidden />{t}</li>)}</ul>
  ))
  add(8, 'connect', 'Connect the dots', <ConnectDots chain={l.connect} currentLessonId={l.id} />)
  return out
}

/** Feynman check: explain the idea in your own words, then compare with a plain-language model. */
function ExplainBack({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm muted">If you can explain it simply, you understand it. Write your answer first, then compare.</p>
      {items.map((it, i) => <Think key={it.q} prompt={it.q} answer={it.a} index={i + 1} />)}
    </div>
  )
}

function KqlExample({ k, lessonId }: { k: NonNullable<Lesson['kql']>[number]; lessonId: string }) {
  const p = useProgress()
  const id = `kql:${lessonId}:${k.title}`
  const marked = p.bookmarks.some(b => b.id === id)
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-semibold">{k.title}</div>
        {k.table && <span className="rounded-md px-2 py-0.5 font-mono text-xs" style={{ background: 'var(--t-investigation-soft)', color: 'var(--t-investigation)' }}>{k.table}</span>}
      </div>
      <KqlCode code={k.query} actions={
        <button className={cx('btn !px-2 !py-1 text-xs', marked && 'text-accent')} onClick={() => actions.toggleBookmark({ id, kind: 'kql', title: k.title, href: `/lesson/${lessonId}#kql` })} aria-label={marked ? 'Remove bookmark' : 'Bookmark query'} aria-pressed={marked}>
          <Bookmark size={14} fill={marked ? 'currentColor' : 'none'} aria-hidden />
        </button>
      } />
      <p className="text-sm leading-relaxed muted"><span className="font-semibold" style={{ color: 'var(--text)' }}>What it does: </span>{k.explain}</p>
    </div>
  )
}

function LabBlock({ l }: { l: Lesson }) {
  const p = useProgress()
  const [checked, setChecked] = useState<boolean[]>(() => l.lab.steps.map(() => false))
  const done = !!p.labs[l.id]
  const count = done ? l.lab.steps.length : checked.filter(Boolean).length
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-base px-5 py-4" style={{ background: 'color-mix(in srgb, var(--t-career) 8%, var(--surface))' }}>
        <IconBadge icon={FlaskConical} color="var(--t-career)" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{l.lab.title}</div>
          <div className="text-sm muted">Environment: {l.lab.environment}</div>
        </div>
        <span className="font-mono text-xs muted" aria-live="polite">{count}/{l.lab.steps.length} steps</span>
      </div>
      <div className="p-5">
        <ol className="space-y-2">
          {l.lab.steps.map((s, i) => (
            <li key={i}>
              <label className={cx('flex cursor-pointer gap-3 rounded-xl p-2 transition hover:bg-[var(--surface-2)]', (checked[i] || done) && 'opacity-75')}>
                <input type="checkbox" className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--accent)]" checked={checked[i] || done} disabled={done} onChange={e => setChecked(c => c.map((x, k) => (k === i ? e.target.checked : x)))} aria-label={`Step ${i + 1} done`} />
                <Markdown text={`**Step ${i + 1}.** ${s}`} />
              </label>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-xl surface-2 p-4">
          <div className="mb-1 text-sm font-semibold">Reflect</div>
          <ul className="prose-lesson text-sm">{l.lab.reflect.map(r => <li key={r}>{r}</li>)}</ul>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="btn btn-primary" disabled={done || !(checked.every(Boolean))} onClick={() => actions.completeLab(l.id, l.lab.title)}>
            {done ? <><CheckCircle2 size={16} aria-hidden /> Lab completed</> : 'Mark lab complete'}
          </button>
          {!done && !checked.every(Boolean) && <span className="text-xs muted">Tick every step first.</span>}
        </div>
      </div>
    </div>
  )
}

function Think({ prompt, answer, index }: { prompt: string; answer: string; index?: number }) {
  const [draft, setDraft] = useState('')
  const [show, setShow] = useState(false)
  return (
    <div className="card p-5">
      <div className="flex gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ background: 'var(--t-identity-soft)', color: 'var(--t-identity)' }} aria-hidden>{index ?? '?'}</span>
        <p className="text-[15px] font-medium leading-relaxed">{prompt}</p>
      </div>
      <textarea className="input mt-3 min-h-20" placeholder="Write your reasoning before revealing the analyst's answer…" value={draft} onChange={e => setDraft(e.target.value)} aria-label="Your reasoning" />
      {!show ? (
        <button className="btn mt-3" onClick={() => setShow(true)}><Eye size={16} aria-hidden /> {draft.trim() ? 'Compare with an analyst\'s reasoning' : 'Reveal (try writing first)'}</button>
      ) : (
        <div className="mt-3 rounded-xl p-4 text-[15px] leading-relaxed animate-rise" style={{ background: 'var(--ok-soft)' }}><span className="font-semibold" style={{ color: 'var(--ok)' }}>Analyst reasoning: </span>{answer}</div>
      )}
    </div>
  )
}

/** Tracks which section is on screen and how far through the lesson the reader is. */
function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(0)
  const [pct, setPct] = useState(0)
  const key = ids.join('|')
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      // A section becomes "current" once its heading reaches the top third of the screen.
      const line = Math.max(160, window.innerHeight * 0.3)
      let idx = 0
      for (let i = 0; i < ids.length; i++) {
        const el = document.getElementById(ids[i])
        if (el && el.getBoundingClientRect().top <= line) idx = i
      }
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0
      if (p > 99.5) idx = ids.length - 1
      setActive(idx)
      setPct(p)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return { active, pct }
}

/** In-page jump that leaves the router's hash alone and moves keyboard focus to the section. */
const jump = (id: string) => (e: MouseEvent) => {
  e.preventDefault()
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
}

/** First plain-text paragraph of a Markdown section, for short summaries. */
function firstParagraph(md?: string, max = 230): string | undefined {
  if (!md) return undefined
  const lines = md.split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#') && !s.startsWith('|') && !s.startsWith('>'))
  if (!lines.length) return undefined
  const strip = (s: string) => s.replace(/^[-*]\s+|^\d+\.\s+/, '').replace(/\[\[[^|\]]+\|([^\]]+)\]\]/g, '$1').replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/\*\*|\*|`/g, '')
  // A lead-in ending with ":" introduces a list — fold the first items in so the summary stands alone.
  let plain = strip(lines[0])
  if (plain.endsWith(':')) plain = `${plain} ${lines.slice(1, 3).map(s => strip(s).replace(/\.$/, '')).join('; ')}.`
  return plain.length > max ? plain.slice(0, max).replace(/\s\S*$/, '') + '…' : plain
}

function StateIcon({ state }: { state: 'done' | 'current' | 'todo' }) {
  if (state === 'done') return <CheckCircle2 size={14} className="shrink-0" style={{ color: 'var(--ok)' }} aria-hidden />
  if (state === 'current') return <CircleDot size={14} className="shrink-0" style={{ color: 'var(--lesson-color)' }} aria-hidden />
  return <Circle size={14} className="shrink-0 muted" aria-hidden />
}
const STATE_SR = { done: 'read', current: 'current section', todo: 'not yet read' }

export default function LessonPage() {
  const { id = '' } = useParams()
  const l = lessonById.get(id)
  const p = useProgress()
  const start = useRef(Date.now())
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    start.current = Date.now()
    return () => actions.addTime(id, Math.round((Date.now() - start.current) / 1000))
  }, [id])
  const order = (x: string) => ORDERED_LESSONS.findIndex(o => o.id === x)
  const secs = l ? buildSections(l, pre => !p.completed[pre] && order(l.id) < order(pre)) : []
  const navItems = [...secs.map(s => ({ id: s.id, title: s.title, level: s.level })), { id: 'resources', title: 'Resources', level: 9 }, { id: 'notes', title: 'Your notes', level: 9 }]
  const { active, pct } = useScrollSpy(navItems.map(s => s.id))
  useEffect(() => setMenuOpen(false), [active])
  if (!l) return <NotFound />

  const m = moduleById(l.moduleId)
  const th = trackTheme(m?.track)
  const ModIcon = moduleIcon(l.moduleId)
  const done = !!p.completed[l.id]
  const prev = prevLesson(l.id), next = nextLesson(l.id)
  const bmId = `lesson:${l.id}`
  const marked = p.bookmarks.some(b => b.id === bmId)
  const answered = l.quiz.filter(q => p.answers[q.id]).length
  const minutesLeft = Math.max(1, Math.round(l.minutes * (1 - pct / 100)))
  const state = (i: number): 'done' | 'current' | 'todo' => (i < active ? 'done' : i === active ? 'current' : 'todo')
  const lessonIdx = m ? m.lessons.indexOf(l.id) : -1
  const current = navItems[active]

  return (
    <div style={lessonVars(m?.track)}>
      {/* sticky reading progress */}
      <div className="sticky top-14 z-20 -mx-4 mb-6 border-b border-base px-4 py-2 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12" style={{ background: 'color-mix(in srgb, var(--bg) 90%, transparent)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-3 text-xs">
          <span className="hidden font-semibold sm:inline" style={{ color: th.color }}>Lesson progress</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full surface-2" role="progressbar" aria-label="Lesson reading progress" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${th.color}, ${th.deep})`, transition: 'width .15s linear' }} />
          </div>
          <span className="w-9 text-right font-mono font-semibold tabular-nums">{Math.round(pct)}%</span>
          <span className="hidden items-center gap-1 muted md:inline-flex"><Clock size={12} aria-hidden /> ~{minutesLeft} min left</span>
          <div className="relative xl:hidden">
            <button className="btn !px-2.5 !py-1 text-xs" onClick={() => setMenuOpen(o => !o)} aria-expanded={menuOpen} aria-controls="lesson-sections-menu">
              <span className="max-w-[9rem] truncate sm:max-w-[14rem]">{active + 1}/{navItems.length} · {current?.title}</span><ChevronDown size={14} className={cx('transition', menuOpen && 'rotate-180')} aria-hidden />
            </button>
            {menuOpen && (
              <div id="lesson-sections-menu" onKeyDown={e => { if (e.key === 'Escape') setMenuOpen(false) }} className="card absolute right-0 top-full z-30 mt-2 max-h-[65vh] w-72 overflow-y-auto p-2 scrollbar-thin" style={{ boxShadow: 'var(--shadow-lg)' }}>
                <ul>
                  {navItems.map((s, i) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} onClick={jump(s.id)} className={cx('flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-[var(--surface-2)]', i === active && 'font-semibold')} aria-current={i === active ? 'location' : undefined}>
                        <StateIcon state={state(i)} /><span className="sr-only">{STATE_SR[state(i)]}: </span>{s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-10">
        <article className="min-w-0 max-w-3xl flex-1">
          {/* track banner */}
          <header className="relative mb-8 overflow-hidden rounded-3xl p-6 text-white md:p-8" style={{ background: `linear-gradient(135deg, ${th.deep}, color-mix(in srgb, ${th.deep} 70%, #0b1020))` }}>
            <div className="pointer-events-none absolute -right-10 -top-10 opacity-15" aria-hidden><ModIcon size={220} /></div>
            <nav className="relative mb-4 flex flex-wrap items-center gap-1.5 text-sm text-white/80" aria-label="Breadcrumb">
              <Link to="/curriculum" className="hover:text-white hover:underline">Curriculum</Link><span aria-hidden>/</span>
              <Link to={`/module/${m?.id}`} className="hover:text-white hover:underline">Module {m?.number}: {m?.title}</Link>
              {lessonIdx >= 0 && <><span aria-hidden>/</span><span>Lesson {lessonIdx + 1} of {m!.lessons.length}</span></>}
            </nav>
            <h1 className="relative font-serif text-3xl font-semibold leading-tight md:text-4xl">{l.title}</h1>
            <p className="relative mt-3 max-w-2xl text-lg leading-relaxed text-white/85">{l.summary}</p>
            <div className="relative mt-5 flex flex-wrap items-center gap-2">
              <ModeBadge mode={l.mode} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-sm"><Clock size={14} aria-hidden /> {l.minutes} min</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-sm"><ListChecks size={14} aria-hidden /> {secs.length} sections · {l.quiz.length} quiz questions</span>
              {done && <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold" style={{ color: 'var(--ok)', background: 'var(--ok-soft)' }}><CheckCircle2 size={14} aria-hidden /> Completed</span>}
              <button className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/40 px-3 py-1 text-sm transition hover:bg-white/15" onClick={() => actions.toggleBookmark({ id: bmId, kind: 'lesson', title: l.title, href: `/lesson/${l.id}` })} aria-pressed={marked}>
                <Bookmark size={14} fill={marked ? 'currentColor' : 'none'} aria-hidden /> {marked ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>
          </header>

          {/* orientation: what / why / next */}
          <section aria-label="Lesson orientation" className="mb-10 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-base p-4" style={{ background: th.soft }}>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: th.color }}><Target size={14} aria-hidden /> You're learning</div>
              <p className="text-sm leading-relaxed">{l.summary}</p>
            </div>
            <div className="rounded-2xl border border-base p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: th.color }}><Compass size={14} aria-hidden /> Why it matters</div>
              <p className="text-sm leading-relaxed">{firstParagraph(l.sections.why) ?? l.tip}</p>
            </div>
            <div className="rounded-2xl border border-base p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: th.color }}><Signpost size={14} aria-hidden /> Up next</div>
              {next ? <Link to={`/lesson/${next.id}`} className="text-sm font-medium leading-relaxed hover:underline">{next.title} →</Link> : <Link to="/sc200" className="text-sm font-medium hover:underline">SC-200 objectives →</Link>}
            </div>
          </section>

          <div className="mb-10" aria-label="Difficulty progression">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider muted">This lesson takes you through</div>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map(lv => {
                const on = l.levels.includes(lv)
                return <span key={lv} className={cx('rounded-full px-2.5 py-0.5 text-xs', on ? 'font-medium' : 'muted')} style={on ? { background: th.soft, color: th.color } : { opacity: 0.5 }}>{on && '✓ '}{LEVEL_LABEL[lv]}</span>
              })}
            </div>
          </div>

          {l.bridge && (
            <div className="relative mb-12 rounded-2xl border p-5 md:p-6" style={{ borderColor: `color-mix(in srgb, ${th.color} 30%, transparent)`, background: `color-mix(in srgb, ${th.color} 5%, var(--surface))` }}>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: th.color }}><Signpost size={14} aria-hidden /> Where this fits</div>
              <Markdown text={l.bridge} />
            </div>
          )}

          <div className="space-y-14">
            {secs.map((s, i) => {
              const lv = DEPTH_LEVELS[s.level]
              return (
                <div key={s.id}>
                  {(i === 0 || secs[i - 1].level !== s.level) && (
                    <div className="mb-10 flex items-center gap-4 rounded-2xl p-4" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${lv.color} 13%, var(--surface)), transparent)` }}>
                      <IconBadge icon={lv.icon} color={lv.color} solid />
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: lv.color }}>Level {s.level} of 8</div>
                        <div className="font-semibold">{lv.title}</div>
                        <div className="text-sm muted">{lv.blurb}</div>
                      </div>
                    </div>
                  )}
                  <section aria-labelledby={s.id}>
                    <SectionTitle id={s.id} icon={SECTION_ICON[s.id]} color={lv.color} className="mb-4">{s.title}</SectionTitle>
                    {s.node}
                  </section>
                </div>
              )
            })}
            <section aria-labelledby="resources">
              <SectionTitle id="resources" icon={BookOpen} className="mb-4">Resources</SectionTitle>
              <ResourceCards resources={l.resources} />
            </section>
            <section aria-labelledby="notes">
              <SectionTitle id="notes" icon={StickyNote} className="mb-4">Your notes</SectionTitle>
              <NotesPanel lessonId={l.id} />
            </section>
          </div>

          {/* completion */}
          <div className="mt-14 overflow-hidden rounded-3xl border p-6 md:p-8" style={{ borderColor: done ? 'color-mix(in srgb, var(--ok) 40%, transparent)' : 'var(--border)', background: done ? 'var(--ok-soft)' : `linear-gradient(135deg, ${th.soft}, var(--surface))` }}>
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className={cx('grid h-14 w-14 shrink-0 place-items-center rounded-2xl', done && 'animate-pop')} style={{ background: done ? 'var(--ok)' : th.color, color: 'var(--surface)' }} aria-hidden>
                {done ? <PartyPopper size={26} /> : <CheckCircle2 size={26} />}
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold">{done ? 'Lesson complete — nice work!' : 'Finished studying?'}</div>
                <div className="text-sm muted">{answered}/{l.quiz.length} quiz questions answered. Skill levels are driven by quiz accuracy, not just completion.</div>
              </div>
              {done ? (
                <button className="btn" onClick={() => actions.uncompleteLesson(l.id)}>Undo completion</button>
              ) : (
                <button className="btn btn-primary" onClick={() => actions.completeLesson(l.id, l.title)}>Mark lesson complete</button>
              )}
            </div>
          </div>

          {/* previous / next */}
          <nav className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Lesson navigation">
            {prev ? (
              <Link to={`/lesson/${prev.id}`} className="card card-hover group p-4">
                <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider muted"><ArrowLeft size={13} aria-hidden /> Previous</div>
                <div className="mt-1 font-semibold group-hover:text-[var(--accent)]">{prev.title}</div>
                <div className="mt-0.5 text-xs muted">{prev.minutes} min</div>
              </Link>
            ) : <span className="hidden sm:block" />}
            {next ? (
              <Link to={`/lesson/${next.id}`} className="card card-hover group p-4 sm:text-right" style={{ borderColor: `color-mix(in srgb, ${th.color} 35%, var(--border))` }}>
                <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider sm:justify-end" style={{ color: th.color }}>Next lesson <ArrowRight size={13} aria-hidden /></div>
                <div className="mt-1 font-semibold group-hover:text-[var(--accent)]">{next.title}</div>
                <div className="mt-0.5 text-xs muted">{next.minutes} min</div>
              </Link>
            ) : (
              <Link to="/sc200" className="card card-hover p-4 sm:text-right"><div className="text-xs font-semibold uppercase tracking-wider muted">Next</div><div className="mt-1 font-semibold">SC-200 objectives →</div></Link>
            )}
          </nav>
        </article>

        {/* desktop lesson sidebar */}
        <aside className="sticky top-[7.5rem] hidden h-[calc(100vh-8.5rem)] w-64 shrink-0 overflow-y-auto pb-6 scrollbar-thin xl:block" aria-label="Lesson sections">
          <div className="card p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider muted">In this lesson</span>
              <span className="font-mono text-[11px] muted">{Math.min(active + 1, navItems.length)}/{navItems.length}</span>
            </div>
            <ul className="space-y-0.5 text-[13px]">
              {navItems.map((s, i) => {
                const st = state(i)
                const header = s.level <= 8 && (i === 0 || navItems[i - 1].level !== s.level)
                return (
                  <li key={s.id}>
                    {header && <div className="mb-0.5 mt-2 px-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: DEPTH_LEVELS[s.level].color }}>L{s.level} · {DEPTH_LEVELS[s.level].title}</div>}
                    <a href={`#${s.id}`} onClick={jump(s.id)} aria-current={st === 'current' ? 'location' : undefined}
                      className={cx('flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-[var(--surface-2)]', st === 'current' ? 'font-semibold' : st === 'done' ? 'muted' : '')}
                      style={st === 'current' ? { background: th.soft, color: th.color } : undefined}>
                      <StateIcon state={st} /><span className="sr-only">{STATE_SR[st]}: </span><span className="leading-snug">{s.title}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
