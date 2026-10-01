import { Link } from 'react-router-dom'
import { ArrowRight, Brain, Database, Fingerprint, Network, ShieldCheck, Workflow, Search, GraduationCap, MessagesSquare } from 'lucide-react'
import { LEARNING_PATH, MODULES } from '../data/curriculum'
import { DOMAINS, SC200_VERSION } from '../data/sc200'
import { KqlCode } from '../components/KqlCode'
import { ModeBadge } from '../components/ui'
import { useProgress } from '../progress/store'
import { recommendedLesson } from '../progress/skills'

const SKILLS_BUILT = [
  { icon: Network, title: 'How systems really work', text: 'Processes, ports, DNS and Windows events — the raw material of every investigation.' },
  { icon: Fingerprint, title: 'Evidence-first thinking', text: 'Every concept ends with: what evidence does it create, and where does it appear?' },
  { icon: Database, title: 'KQL from zero', text: 'Tables, rows, the pipe — then real security queries for Sentinel and Advanced Hunting.' },
  { icon: Workflow, title: 'SOC workflow', text: 'Triage, verdicts, escalation, scoping, containment and documentation.' },
  { icon: ShieldCheck, title: 'Microsoft security stack', text: 'Sentinel, Defender XDR, Advanced Hunting — what each is for, not just where to click.' },
  { icon: Brain, title: 'Interview-ready explanations', text: 'Practice explaining concepts out loud with key-point feedback and follow-ups.' },
]

const SAMPLE = `SigninLogs
| where TimeGenerated > ago(1h)
| where ResultType == "50126"        // invalid username or password
| summarize Accounts = dcount(UserPrincipalName), Attempts = count() by IPAddress
| where Accounts >= 10               // one source, many accounts = spray shape
| sort by Accounts desc`

export default function Home() {
  const p = useProgress()
  const next = recommendedLesson(p)
  const started = Object.keys(p.completed).length > 0
  const path = LEARNING_PATH.map(id => MODULES.find(m => m.id === id)!).filter(Boolean)
  return (
    <div className="mx-auto max-w-6xl">
      <section className="py-10 md:py-16">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-base px-3 py-1 text-xs muted">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--both)]" /> Aligned to the SC-200 outline: {SC200_VERSION.replace('Skills measured as of ', '')}
        </div>
        <h1 className="max-w-4xl font-serif text-4xl font-semibold leading-[1.1] md:text-6xl">Learn to think like a SOC analyst — not just pass a test.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed muted">
          Watchfloor Academy takes you from how computers and networks work to Microsoft Sentinel, Defender XDR, KQL and SC-200 readiness. Every concept is taught the same way: <em>why it exists, what normal looks like, what evidence it leaves, and how an analyst investigates it.</em>
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={next ? `/lesson/${next.id}` : '/curriculum'} className="btn btn-primary !px-5 !py-2.5 text-base">{started ? 'Continue learning' : 'Start learning'} <ArrowRight size={18} /></Link>
          <Link to="/lesson/soc-ioc-ioa-ttp" className="btn !px-5 !py-2.5 text-base">See a flagship lesson</Link>
        </div>
        <p className="mt-4 text-xs muted">Independent learning resource. Not affiliated with or endorsed by Microsoft. Your progress stays in this browser.</p>
      </section>

      <section className="py-10">
        <h2 className="mb-2 text-2xl font-semibold">The roadmap</h2>
        <p className="mb-6 muted">Each stage builds on the one before. Highlighted modules have full lessons today; the rest show objectives and where the topic is already covered.</p>
        <ol className="flex flex-wrap items-center gap-y-2">
          {path.map((m, i) => (
            <li key={m.id} className="flex items-center">
              <Link to={`/module/${m.id}`} className={`rounded-md border px-2.5 py-1 text-sm transition hover:border-[var(--accent)] ${m.status === 'ready' ? 'border-[var(--accent)] bg-accent-soft font-medium text-accent' : 'border-base muted'}`}>{m.title}</Link>
              {i < path.length - 1 && <ArrowRight size={14} className="mx-1 muted" aria-hidden />}
            </li>
          ))}
        </ol>
      </section>

      <section className="py-10">
        <h2 className="mb-6 text-2xl font-semibold">What you will be able to do</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS_BUILT.map(s => (
            <div key={s.title} className="card p-5">
              <s.icon size={22} className="text-accent" aria-hidden />
              <div className="mt-3 font-semibold">{s.title}</div>
              <p className="mt-1 text-sm leading-relaxed muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 py-10 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent"><Search size={16} /> KQL, explained line by line</div>
          <h3 className="text-xl font-semibold">Queries you understand, not copy</h3>
          <p className="mt-2 text-sm leading-relaxed muted">Every operator is taught in nine parts — plain English, why it exists, syntax, a basic and a security example, how SOCs use it, its output, the common mistake, and a practice question.</p>
          <KqlCode code={SAMPLE} />
          <Link to="/kql" className="text-sm font-medium text-accent">Open the KQL reference →</Link>
        </div>
        <div className="card p-6">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent"><GraduationCap size={16} /> SC-200 preparation</div>
          <h3 className="text-xl font-semibold">Every official objective, mapped</h3>
          <p className="mt-2 text-sm leading-relaxed muted">Each objective links to prerequisite modules, the lessons that teach it, the Microsoft product, a lab idea and an interview angle — and is labeled by why it matters:</p>
          <div className="mt-3 flex flex-wrap gap-2"><ModeBadge mode="soc" /><ModeBadge mode="exam" /><ModeBadge mode="both" /></div>
          <div className="mt-5 space-y-3">
            {DOMAINS.map(d => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg surface-2 px-4 py-3 text-sm">
                <span className="font-medium">{d.title}</span><span className="font-mono muted">{d.weight}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-sm font-medium">
            <Link to="/sc200" className="text-accent">Objective map →</Link>
            <Link to="/sc200/practice" className="text-accent">Practice exam →</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 py-10 md:grid-cols-2">
        <div className="card p-6">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent"><Workflow size={16} /> Connect the dots</div>
          <h3 className="text-xl font-semibold">Concepts never stand alone</h3>
          <p className="mt-2 text-sm leading-relaxed muted">Each lesson ends with a chain that shows how the concept links to the evidence it creates, the table that stores it, the query that finds it and the detection that alerts on it — and which links you have already studied.</p>
          <div className="mt-4 flex flex-wrap items-center gap-1 text-sm">
            {['PowerShell', 'Process', 'DeviceProcessEvents', 'KQL', 'Detection', 'Incident'].map((x, i, a) => (
              <span key={x} className="flex items-center"><span className="rounded-full border border-base px-2.5 py-1">{x}</span>{i < a.length - 1 && <ArrowRight size={12} className="mx-1 muted" />}</span>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent"><MessagesSquare size={16} /> Interview mode</div>
          <h3 className="text-xl font-semibold">Explain it out loud</h3>
          <p className="mt-2 text-sm leading-relaxed muted">Type your answer to real interview questions, see which key points you covered and missed, compare with a model answer, then handle the follow-up question.</p>
          <Link to="/interview" className="mt-4 inline-block text-sm font-medium text-accent">Try a question →</Link>
        </div>
      </section>
    </div>
  )
}
