import { Link } from 'react-router-dom'
import { ArrowRight, Brain, Database, Fingerprint, Network, ShieldCheck, Workflow, Search, GraduationCap, MessagesSquare, PlayCircle, Clock, Target, Lock } from 'lucide-react'
import { LEARNING_PATH, MODULES, TRACKS } from '../data/curriculum'
import { DOMAINS, SC200_VERSION } from '../data/sc200'
import { lessonById } from '../data'
import { KqlCode } from '../components/KqlCode'
import { IconBadge, ModeBadge, Progress, ProgressRing } from '../components/ui'
import { useProgress } from '../progress/store'
import { recommendedLesson } from '../progress/skills'
import { moduleIcon, trackTheme } from '../theme'
import { HeroIllustration } from '../components/Illustrations'

const SKILLS_BUILT = [
  { icon: Network, color: 'var(--t-foundations)', title: 'How systems really work', text: 'Processes, ports, DNS and Windows events — the raw material of every investigation.' },
  { icon: Fingerprint, color: 'var(--t-identity)', title: 'Evidence-first thinking', text: 'Every concept ends with: what evidence does it create, and where does it appear?' },
  { icon: Database, color: 'var(--t-investigation)', title: 'KQL from zero', text: 'Tables, rows, the pipe — then real security queries for Sentinel and Advanced Hunting.' },
  { icon: Workflow, color: 'var(--t-soc)', title: 'SOC workflow', text: 'Triage, verdicts, escalation, scoping, containment and documentation.' },
  { icon: ShieldCheck, color: 'var(--t-microsoft)', title: 'Microsoft security stack', text: 'Sentinel, Defender XDR, Advanced Hunting — what each is for, not just where to click.' },
  { icon: Brain, color: 'var(--t-career)', title: 'Interview-ready explanations', text: 'Practice explaining concepts out loud with key-point feedback and follow-ups.' },
]

const SAMPLE = `SigninLogs
| where TimeGenerated > ago(1h)
| where ResultType == "50126"        // invalid username or password
| summarize Accounts = dcount(UserPrincipalName), Attempts = count() by IPAddress
| where Accounts >= 10               // one source, many accounts = spray shape
| sort by Accounts desc`

const METHOD = ['Why it exists', 'What normal looks like', 'What evidence it leaves', 'Where to find it', 'How to investigate']

export default function Home() {
  const p = useProgress()
  const next = recommendedLesson(p)
  const started = Object.keys(p.completed).length > 0
  const allLessons = MODULES.flatMap(m => m.lessons)
  const doneAll = allLessons.filter(l => p.completed[l]).length
  const nextModule = next ? MODULES.find(m => m.lessons.includes(next.id)) : undefined
  const nextTheme = trackTheme(nextModule?.track)
  const readyModules = MODULES.filter(m => m.status === 'ready').length
  const pathIndex = (id: string) => LEARNING_PATH.indexOf(id)

  return (
    <div className="mx-auto max-w-6xl">
      {/* ---------- hero */}
      <section className="relative -mx-4 -mt-8 overflow-hidden px-4 pb-12 pt-10 sm:-mx-8 sm:px-8 md:pt-16 lg:-mx-12 lg:px-12">
        <div className="pointer-events-none absolute inset-0 mesh" aria-hidden />
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-70" aria-hidden />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-rise">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-base px-3 py-1 text-xs font-medium" style={{ background: 'color-mix(in srgb, var(--surface) 80%, transparent)' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ok)' }} aria-hidden /> Aligned to the SC-200 outline · {SC200_VERSION.replace('Skills measured as of ', '')}
            </div>
            <h1 className="font-serif text-4xl font-semibold leading-[1.08] md:text-[3.6rem]">
              Learn to think like a{' '}
              <span style={{ background: 'linear-gradient(120deg, var(--t-identity), var(--t-foundations) 55%, var(--t-investigation))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>SOC analyst</span>
              {' '}— not just pass a test.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed muted">
              From how computers and networks work to Microsoft Sentinel, Defender XDR, KQL and SC-200 readiness — taught one clear step at a time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={next ? `/lesson/${next.id}` : '/curriculum'} className="btn btn-primary !px-5 !py-3 text-base">{started ? 'Continue learning' : 'Start learning'} <ArrowRight size={18} aria-hidden /></Link>
              <Link to="/curriculum" className="btn !px-5 !py-3 text-base">Explore the curriculum</Link>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {[[allLessons.length, 'in-depth lessons'], [readyModules, 'modules ready'], [DOMAINS.length, 'SC-200 domains mapped']].map(([n, l]) => (
                <div key={l as string}><dt className="sr-only">{l}</dt><dd><span className="text-2xl font-semibold tabular-nums">{n}</span> <span className="muted">{l}</span></dd></div>
              ))}
            </dl>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* ---------- continue card */}
      {next && (
        <section aria-label="Your next step" className="-mt-2 mb-12">
          <Link to={`/lesson/${next.id}`} className="card card-hover group flex flex-col gap-5 overflow-hidden p-5 sm:flex-row sm:items-center md:p-6" style={{ borderColor: `color-mix(in srgb, ${nextTheme.color} 35%, var(--border))` }}>
            <ProgressRing value={allLessons.length ? (doneAll / allLessons.length) * 100 : 0} size={72} stroke={7} color={nextTheme.color} label="Overall progress" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: nextTheme.color }}>{started ? 'Pick up where you left off' : 'Your first lesson'} · {nextModule?.title}</div>
              <div className="mt-1 text-xl font-semibold">{next.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm muted">
                <span className="inline-flex items-center gap-1"><Clock size={14} aria-hidden /> about {next.minutes} min</span>
                <span>{doneAll} of {allLessons.length} lessons complete</span>
              </div>
            </div>
            <span className="btn btn-primary shrink-0" style={{ background: nextTheme.color }}><PlayCircle size={18} aria-hidden /> {started ? 'Resume' : 'Begin'}</span>
          </Link>
        </section>
      )}

      {/* ---------- method */}
      <section className="py-8">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">How every lesson teaches</div>
        <h2 className="text-2xl font-semibold md:text-3xl">One method, every concept</h2>
        <p className="mt-2 max-w-2xl muted">You always know what you're learning, why it matters and what to do next.</p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-5">
          {METHOD.map((m, i) => (
            <li key={m} className="relative rounded-2xl border border-base p-4" style={{ background: `color-mix(in srgb, ${['var(--t-foundations)', 'var(--t-investigation)', 'var(--t-soc)', 'var(--t-microsoft)', 'var(--t-identity)'][i]} 9%, var(--surface))` }}>
              <div className="font-mono text-xs font-semibold" style={{ color: ['var(--t-foundations)', 'var(--t-investigation)', 'var(--t-soc)', 'var(--t-microsoft)', 'var(--t-identity)'][i] }}>STEP {i + 1}</div>
              <div className="mt-1 text-sm font-semibold">{m}</div>
              {i < METHOD.length - 1 && <ArrowRight size={14} className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-[var(--bg)] muted sm:block" aria-hidden />}
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- journey map */}
      <section className="py-10">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">The roadmap</div>
        <h2 className="text-2xl font-semibold md:text-3xl">Your journey, track by track</h2>
        <p className="mt-2 max-w-2xl muted">Each track builds on the one before. Modules marked <Lock size={12} className="inline" aria-label="coming soon" /> show their objectives today; full lessons are being added.</p>
        <ol className="relative mt-8 space-y-4 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-0.5 before:bg-[var(--border)] md:before:left-[31px]">
          {TRACKS.map((track, ti) => {
            const th = trackTheme(track.id)
            const mods = track.modules.map(id => MODULES.find(m => m.id === id)!).filter(Boolean).sort((a, b) => pathIndex(a.id) - pathIndex(b.id))
            const ls = mods.flatMap(m => m.lessons)
            const d = ls.filter(l => p.completed[l]).length
            return (
              <li key={track.id} className="relative flex gap-4">
                <div className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-md md:h-16 md:w-16" style={{ background: `linear-gradient(135deg, ${th.color}, ${th.deep})` }} aria-hidden>
                  <th.icon size={26} />
                </div>
                <div className="card min-w-0 flex-1 p-4 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: th.color }}>Track {ti + 1}</div>
                      <h3 className="text-lg font-semibold">{track.title}</h3>
                      <p className="text-sm muted">{th.tagline}</p>
                    </div>
                    {ls.length > 0 && <div className="w-40"><div className="mb-1 text-right text-xs muted">{d}/{ls.length} lessons</div><Progress value={(d / ls.length) * 100} color={th.color} label={`${track.title} progress`} /></div>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mods.map(m => {
                      const Icon = moduleIcon(m.id)
                      const ready = m.status === 'ready'
                      return (
                        <Link key={m.id} to={`/module/${m.id}`} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition hover:-translate-y-0.5" style={ready ? { borderColor: `color-mix(in srgb, ${th.color} 40%, transparent)`, background: th.soft, color: th.color } : { borderColor: 'var(--border)', color: 'var(--muted)' }}>
                          {ready ? <Icon size={14} aria-hidden /> : <Lock size={12} aria-hidden />} {m.title}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* ---------- outcomes */}
      <section className="py-10">
        <h2 className="mb-6 text-2xl font-semibold md:text-3xl">What you will be able to do</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS_BUILT.map(s => (
            <div key={s.title} className="card card-hover p-5">
              <IconBadge icon={s.icon} color={s.color} />
              <div className="mt-3 font-semibold">{s.title}</div>
              <p className="mt-1 text-sm leading-relaxed muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- feature showcase */}
      <section className="grid gap-6 py-10 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--t-investigation), var(--t-foundations))' }} aria-hidden />
          <div className="p-6">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--t-investigation)' }}><Search size={16} aria-hidden /> KQL, explained line by line</div>
            <h3 className="text-xl font-semibold">Queries you understand, not copy</h3>
            <p className="mt-2 text-sm leading-relaxed muted">Every operator: plain English, why it exists, syntax, a security example, its output, the common mistake and a practice question.</p>
            <KqlCode code={SAMPLE} />
            <Link to="/kql" className="text-sm font-medium" style={{ color: 'var(--t-investigation)' }}>Open the KQL reference →</Link>
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--t-cert), var(--t-soc))' }} aria-hidden />
          <div className="p-6">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--t-cert)' }}><GraduationCap size={16} aria-hidden /> SC-200 preparation</div>
            <h3 className="text-xl font-semibold">Every official objective, mapped</h3>
            <p className="mt-2 text-sm leading-relaxed muted">Each objective links to the lessons that teach it, the Microsoft product, a lab idea and an interview angle — labeled by why it matters:</p>
            <div className="mt-3 flex flex-wrap gap-2"><ModeBadge mode="soc" /><ModeBadge mode="exam" /><ModeBadge mode="both" /></div>
            <div className="mt-5 space-y-2.5">
              {DOMAINS.map((d, i) => (
                <div key={d.id} className="flex items-center gap-3 rounded-xl surface-2 px-4 py-3 text-sm">
                  <Target size={16} style={{ color: ['var(--t-microsoft)', 'var(--t-identity)', 'var(--t-investigation)', 'var(--t-soc)'][i % 4] }} aria-hidden />
                  <span className="flex-1 font-medium">{d.title}</span><span className="font-mono text-xs muted">{d.weight}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-4 text-sm font-medium">
              <Link to="/sc200" style={{ color: 'var(--t-cert)' }}>Objective map →</Link>
              <Link to="/sc200/practice" style={{ color: 'var(--t-cert)' }}>Practice exam →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 py-10 md:grid-cols-2">
        <div className="card p-6">
          <IconBadge icon={Workflow} color="var(--t-soc)" />
          <h3 className="mt-3 text-xl font-semibold">Concepts never stand alone</h3>
          <p className="mt-2 text-sm leading-relaxed muted">Each lesson ends with a chain linking the concept to the evidence it creates, the table that stores it, the query that finds it and the detection that alerts on it.</p>
          <div className="mt-4 flex flex-wrap items-center gap-1 text-sm">
            {['PowerShell', 'Process', 'DeviceProcessEvents', 'KQL', 'Detection', 'Incident'].map((x, i, a) => (
              <span key={x} className="flex items-center"><span className="rounded-full px-2.5 py-1 font-medium" style={{ background: `color-mix(in srgb, var(--t-soc) ${8 + i * 3}%, var(--surface))` }}>{x}</span>{i < a.length - 1 && <ArrowRight size={12} className="mx-1 muted" aria-hidden />}</span>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <IconBadge icon={MessagesSquare} color="var(--t-career)" />
          <h3 className="mt-3 text-xl font-semibold">Explain it out loud</h3>
          <p className="mt-2 text-sm leading-relaxed muted">Type your answer to real interview questions, see which key points you covered and missed, compare with a model answer, then handle the follow-up.</p>
          <Link to="/interview" className="mt-4 inline-block text-sm font-medium" style={{ color: 'var(--t-career)' }}>Try a question →</Link>
        </div>
      </section>

      <p className="pb-6 text-center text-xs muted">Independent learning resource. Not affiliated with or endorsed by Microsoft. Your progress stays in this browser. {lessonById.size} lessons available.</p>
    </div>
  )
}
