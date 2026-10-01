import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bookmark, CheckCircle2, ChevronLeft, ChevronRight, Clock, ExternalLink, Eye } from 'lucide-react'
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
import { Callout, ModeBadge, SectionTitle, cx } from '../components/ui'
import NotFound from './NotFound'

const LEVEL_LABEL: Record<string, string> = { beginner: 'Beginner', understand: 'Understand', recognize: 'Recognize', practice: 'Practice', investigate: 'Investigate', analyze: 'Analyze', hunt: 'Hunt', detect: 'Create detection' }

interface Sec { id: string; n: number; title: string; node: ReactNode; level: number }

/** Depth layers: start simple, then add technical, security, SOC, Microsoft, KQL, detection and practice. */
const DEPTH_LEVELS: Record<number, { title: string; blurb: string }> = {
  1: { title: 'Level 1 · The simple idea', blurb: 'What it is and why it exists, in plain language.' },
  2: { title: 'Level 2 · How it works', blurb: 'The technical mechanism, step by step.' },
  3: { title: 'Level 3 · The security view', blurb: 'Normal vs suspicious, and how attackers misuse it (defensively).' },
  4: { title: 'Level 4 · The SOC view', blurb: 'What evidence it leaves, where, and how an analyst uses it.' },
  5: { title: 'Level 5 · Microsoft tools', blurb: 'Which Microsoft products see this evidence.' },
  6: { title: 'Level 6 · Query the evidence', blurb: 'KQL that finds it.' },
  7: { title: 'Level 7 · Detection & frameworks', blurb: 'MITRE ATT&CK and SC-200 connections.' },
  8: { title: 'Level 8 · Practice & review', blurb: 'Lab, quiz, explain-it-back, interview and recap.' },
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
    <div className="mb-4 rounded-lg border border-dashed border-base p-3 text-sm muted">
      <span className="font-semibold text-accent">Preview.</span> This part uses ideas taught later in <Link className="text-accent underline" to={`/lesson/${pre.id}`}>{pre.title}</Link>. Skim it now to see where you're heading — it's fine if it doesn't fully make sense yet.
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
  add(1, 'analogy', 'Simple analogy', s.analogy && <Callout tone="tip" title="Analogy"><Markdown text={s.analogy} /></Callout>)
  // Level 2 — technical
  add(2, 'how', 'How does it work?', s.how && (
    <>
      <Markdown text={s.how} />
      {l.deepDives?.map(d => (
        <details key={d.title} className="card mt-4 p-4" open>
          <summary className="cursor-pointer font-semibold">{d.title}</summary>
          <Markdown text={d.body} className="mt-2" />
        </details>
      ))}
    </>
  ))
  add(2, 'diagram', 'Visual diagram', l.diagram && <Flow {...l.diagram} />)
  add(2, 'real-world', 'Real-world example', md(s.realWorld))
  // Level 3 — security
  add(3, 'security-example', 'Security example', md(s.securityExample))
  add(3, 'normal', 'What does normal look like?', s.normal && <div className="rounded-lg border-l-4 p-4" style={{ borderColor: 'var(--both)', background: 'var(--both-soft)' }}><Markdown text={s.normal} /></div>)
  add(3, 'suspicious', 'What does suspicious look like?', s.suspicious && <div className="rounded-lg border-l-4 p-4" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)' }}><Markdown text={s.suspicious} /></div>)
  add(3, 'abuse', 'How can attackers abuse it? (defensive view)', md(s.abuse))
  // Level 4 — SOC
  add(4, 'evidence', 'What evidence does it create?', md(s.evidence))
  add(4, 'where', 'Where does that evidence appear?', md(s.where))
  add(4, 'analyst', 'How does a SOC analyst use it?', md(s.analyst))
  // Level 5 — Microsoft
  add(5, 'microsoft', 'Microsoft connection', md(s.microsoft))
  // Level 6 — KQL
  add(6, 'kql', 'KQL connection', l.kql?.length && (
    <div className="space-y-5">
      {l.kql.map(k => <KqlExample key={k.title} lessonId={l.id} k={k} />)}
      <p className="text-sm muted">These queries were checked with Microsoft's KQL parser against the official table schemas. Run them in Microsoft Sentinel Logs or Defender Advanced Hunting in your own lab or trial tenant. To practice syntax for free, use the Azure Data Explorer help cluster (see the KQL lessons).</p>
    </div>
  ))
  // Level 7 — detection & frameworks
  add(7, 'mitre', 'MITRE ATT&CK connection', l.mitre?.length && (
    <div className="overflow-x-auto prose-lesson">
      <table>
        <thead><tr><th>ID</th><th>Technique / tactic</th><th>Why it connects</th></tr></thead>
        <tbody>
          {l.mitre.map(t => (
            <tr key={t.id}>
              <td className="font-mono whitespace-nowrap"><a className="text-accent hover:underline" href={`https://attack.mitre.org/${t.id.startsWith('TA') ? 'tactics' : 'techniques'}/${t.id.replace('.', '/')}/`} target="_blank" rel="noopener noreferrer">{t.id}</a></td>
              <td><div className="font-medium">{t.name}</div><div className="text-xs muted">{t.tactic}</div></td>
              <td>{t.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs muted">Mappings checked against MITRE ATT&CK Enterprise v19 (October 2026). ATT&CK changes over time — confirm on attack.mitre.org.</p>
    </div>
  ))
  add(7, 'sc200', 'SC-200 connection', (
    <div className="space-y-3">
      <p className="text-[15px] leading-relaxed">{l.sc200.note}</p>
      <ul className="space-y-1.5">
        {l.sc200.objectives.map(id => {
          const o = objectiveById.get(id)
          return o ? <li key={id}><Link to={`/sc200#${id}`} className="text-sm hover:text-accent"><ModeBadge mode={o.mode} className="mr-2" />{o.text}</Link></li> : null
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
        <li key={q!.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="font-medium">{q!.question}</div><div className="text-xs capitalize muted">{q!.level}</div></div>
          <Link className="btn shrink-0" to={`/interview?q=${q!.id}`}>Practice answering</Link>
        </li>
      ))}
    </ul>
  ))
  add(8, 'mistakes', 'Common mistakes', <ul className="prose-lesson">{l.mistakes.map(m => <li key={m}>{m}</li>)}</ul>)
  add(8, 'tip', 'SOC analyst tip', <Callout title="From the watch floor">{l.tip}</Callout>)
  add(8, 'think', 'Think like an analyst', <Think prompt={l.think.prompt} answer={l.think.answer} />)
  add(8, 'takeaways', 'Key takeaways', <ul className="space-y-2">{l.takeaways.map(t => <li key={t} className="flex gap-2 text-[15px]"><CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--both)' }} />{t}</li>)}</ul>)
  add(8, 'connect', 'Connect the dots', <ConnectDots chain={l.connect} currentLessonId={l.id} />)
  return out
}

/** Feynman check: explain the idea in your own words, then compare with a plain-language model. */
function ExplainBack({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm muted">If you can explain it simply, you understand it. Write your answer first, then compare.</p>
      {items.map(it => <Think key={it.q} prompt={it.q} answer={it.a} />)}
    </div>
  )
}

function KqlExample({ k, lessonId }: { k: NonNullable<Lesson['kql']>[number]; lessonId: string }) {
  const p = useProgress()
  const id = `kql:${lessonId}:${k.title}`
  const marked = p.bookmarks.some(b => b.id === id)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-medium">{k.title}</div>
        {k.table && <span className="font-mono text-xs muted">{k.table}</span>}
      </div>
      <KqlCode code={k.query} actions={
        <button className={cx('btn !px-2 !py-1 text-xs', marked && 'text-accent')} onClick={() => actions.toggleBookmark({ id, kind: 'kql', title: k.title, href: `/lesson/${lessonId}#kql` })} aria-label={marked ? 'Remove bookmark' : 'Bookmark query'}>
          <Bookmark size={14} fill={marked ? 'currentColor' : 'none'} />
        </button>
      } />
      <p className="text-sm leading-relaxed muted">{k.explain}</p>
    </div>
  )
}

function LabBlock({ l }: { l: Lesson }) {
  const p = useProgress()
  const [checked, setChecked] = useState<boolean[]>(() => l.lab.steps.map(() => false))
  const done = !!p.labs[l.id]
  return (
    <div className="card p-5">
      <div className="mb-1 font-semibold">{l.lab.title}</div>
      <div className="mb-4 text-sm muted">Environment: {l.lab.environment}</div>
      <ol className="space-y-2">
        {l.lab.steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <input type="checkbox" className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--accent)]" checked={checked[i] || done} onChange={e => setChecked(c => c.map((x, k) => (k === i ? e.target.checked : x)))} aria-label={`Step ${i + 1} done`} />
            <Markdown text={`**Step ${i + 1}.** ${s}`} />
          </li>
        ))}
      </ol>
      <div className="mt-4 rounded-lg surface-2 p-4">
        <div className="mb-1 text-sm font-semibold">Reflect</div>
        <ul className="prose-lesson text-sm">{l.lab.reflect.map(r => <li key={r}>{r}</li>)}</ul>
      </div>
      <button className="btn btn-primary mt-4" disabled={done || !(checked.every(Boolean))} onClick={() => actions.completeLab(l.id, l.lab.title)}>
        {done ? '✓ Lab completed' : 'Mark lab complete'}
      </button>
      {!done && !checked.every(Boolean) && <span className="ml-3 text-xs muted">Tick every step first.</span>}
    </div>
  )
}

function Think({ prompt, answer }: { prompt: string; answer: string }) {
  const [draft, setDraft] = useState('')
  const [show, setShow] = useState(false)
  return (
    <div className="card p-5">
      <p className="text-[15px] font-medium leading-relaxed">{prompt}</p>
      <textarea className="input mt-3 min-h-20" placeholder="Write your reasoning before revealing the analyst's answer…" value={draft} onChange={e => setDraft(e.target.value)} aria-label="Your reasoning" />
      {!show ? (
        <button className="btn mt-3" onClick={() => setShow(true)}><Eye size={16} /> {draft.trim() ? 'Compare with an analyst\'s reasoning' : 'Reveal (try writing first)'}</button>
      ) : (
        <div className="mt-3 rounded-lg surface-2 p-4 text-[15px] leading-relaxed"><span className="font-semibold">Analyst reasoning: </span>{answer}</div>
      )}
    </div>
  )
}

export default function LessonPage() {
  const { id = '' } = useParams()
  const l = lessonById.get(id)
  const p = useProgress()
  const start = useRef(Date.now())
  useEffect(() => {
    start.current = Date.now()
    return () => actions.addTime(id, Math.round((Date.now() - start.current) / 1000))
  }, [id])
  if (!l) return <NotFound />
  const m = moduleById(l.moduleId)
  const order = (x: string) => ORDERED_LESSONS.findIndex(o => o.id === x)
  const secs = buildSections(l, pre => !p.completed[pre] && order(l.id) < order(pre))
  const done = !!p.completed[l.id]
  const prev = prevLesson(l.id), next = nextLesson(l.id)
  const bmId = `lesson:${l.id}`
  const marked = p.bookmarks.some(b => b.id === bmId)
  const answered = l.quiz.filter(q => p.answers[q.id]).length

  return (
    <div className="flex gap-10">
      <article className="min-w-0 max-w-3xl flex-1">
        <nav className="mb-4 text-sm muted" aria-label="Breadcrumb">
          <Link to="/curriculum" className="hover:text-accent">Curriculum</Link> / <Link to={`/module/${m?.id}`} className="hover:text-accent">Module {m?.number}: {m?.title}</Link>
        </nav>
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">{l.title}</h1>
          <p className="mt-3 text-lg leading-relaxed muted">{l.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ModeBadge mode={l.mode} />
            <span className="inline-flex items-center gap-1 text-sm muted"><Clock size={14} /> {l.minutes} min</span>
            <button className={cx('btn !py-1 text-sm', marked && 'text-accent')} onClick={() => actions.toggleBookmark({ id: bmId, kind: 'lesson', title: l.title, href: `/lesson/${l.id}` })}>
              <Bookmark size={14} fill={marked ? 'currentColor' : 'none'} /> {marked ? 'Bookmarked' : 'Bookmark'}
            </button>
          </div>
          <div className="mt-4" aria-label="Difficulty progression">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider muted">This lesson takes you through</div>
            <div className="flex flex-wrap gap-1">
              {LEVELS.map(lv => (
                <span key={lv} className={cx('rounded px-2 py-0.5 text-xs', l.levels.includes(lv) ? 'bg-accent-soft font-medium text-accent' : 'muted')} style={l.levels.includes(lv) ? undefined : { opacity: 0.55 }}>{LEVEL_LABEL[lv]}</span>
              ))}
            </div>
          </div>
        </header>

        {l.bridge && (
          <div className="card mb-10 p-5" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">Where this fits</div>
            <Markdown text={l.bridge} />
          </div>
        )}

        <div className="space-y-12">
          {secs.map((s, i) => (
            <div key={s.id}>
              {(i === 0 || secs[i - 1].level !== s.level) && (
                <div className="mb-8 border-b border-base pb-2 pt-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-accent">{DEPTH_LEVELS[s.level].title}</div>
                  <div className="text-sm muted">{DEPTH_LEVELS[s.level].blurb}</div>
                </div>
              )}
              <section aria-labelledby={s.id}>
                <SectionTitle id={s.id} number={s.n} className="mb-4">{s.title}</SectionTitle>
                {s.node}
              </section>
            </div>
          ))}
          <section aria-labelledby="resources">
            <SectionTitle id="resources" className="mb-4">Resources</SectionTitle>
            <ResourceCards resources={l.resources} />
          </section>
          <section aria-labelledby="notes">
            <SectionTitle id="notes" className="mb-4">Your notes</SectionTitle>
            <NotesPanel lessonId={l.id} />
          </section>
        </div>

        <div className="card mt-12 flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold">{done ? 'Lesson complete' : 'Finished studying?'}</div>
            <div className="text-sm muted">{answered}/{l.quiz.length} quiz questions answered. Skill levels are driven by quiz accuracy, not just completion.</div>
          </div>
          {done ? (
            <button className="btn" onClick={() => actions.uncompleteLesson(l.id)}><CheckCircle2 size={16} style={{ color: 'var(--both)' }} /> Completed — undo</button>
          ) : (
            <button className="btn btn-primary" onClick={() => actions.completeLesson(l.id, l.title)}>Mark lesson complete</button>
          )}
        </div>
        <div className="mt-6 flex justify-between gap-4">
          {prev ? <Link to={`/lesson/${prev.id}`} className="btn"><ChevronLeft size={16} /> {prev.title}</Link> : <span />}
          {next ? <Link to={`/lesson/${next.id}`} className="btn text-right">{next.title} <ChevronRight size={16} /></Link> : <Link to="/sc200" className="btn">SC-200 objectives <ChevronRight size={16} /></Link>}
        </div>
      </article>

      <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto scrollbar-thin xl:block" aria-label="On this page">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider muted">On this page</div>
        <ul className="space-y-1 text-[13px]">
          {secs.map(s => <li key={s.id}><a href={`#${s.id}`} onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }) }} className="block rounded px-2 py-0.5 muted hover:text-accent"><span className="mr-1.5 font-mono text-[10px]">{String(s.n).padStart(2, '0')}</span>{s.title}</a></li>)}
          <li><a href="#resources" onClick={e => { e.preventDefault(); document.getElementById('resources')?.scrollIntoView({ behavior: 'smooth' }) }} className="block rounded px-2 py-0.5 muted hover:text-accent">Resources <ExternalLink size={10} className="inline" /></a></li>
        </ul>
      </aside>
    </div>
  )
}
