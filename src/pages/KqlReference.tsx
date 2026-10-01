import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Eye, Terminal } from 'lucide-react'
import { KQL_OPERATORS, type KqlOperator } from '../data/kqlOperators'
import { KqlCode } from '../components/KqlCode'
import { Callout, IconBadge, PageHeader, Pill } from '../components/ui'
import { ResourceCards } from '../components/Resources'
import { res } from '../data/resources'

const PART_COLOR = ['var(--t-foundations)', 'var(--t-identity)', 'var(--t-investigation)', 'var(--t-microsoft)', 'var(--t-security)', 'var(--t-soc)', 'var(--t-start)', 'var(--danger)', 'var(--t-career)']

function Part({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  const color = PART_COLOR[(n - 1) % PART_COLOR.length]
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color }}>
        <span className="grid h-5 w-5 place-items-center rounded-md font-mono text-[10px]" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }} aria-hidden>{n}</span>{title}
      </div>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </div>
  )
}

const GROUP_COLOR = ['var(--t-investigation)', 'var(--t-microsoft)', 'var(--t-identity)', 'var(--t-soc)', 'var(--t-cert)', 'var(--t-career)']

function OperatorCard({ o, color }: { o: KqlOperator; color: string }) {
  const [attempt, setAttempt] = useState('')
  const [reveal, setReveal] = useState(false)
  return (
    <article id={o.id} className="card scroll-mt-20 space-y-5 overflow-hidden p-6" style={{ borderTop: `4px solid ${color}` }}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-3 font-mono text-xl font-semibold"><IconBadge icon={Terminal} color={color} size="sm" />{o.name}</h2>
        <Pill color={color}>{o.group}</Pill>
      </header>
      <Part n={1} title="Plain English">{o.plain}</Part>
      <Part n={2} title="Why it exists">{o.why}</Part>
      <Part n={3} title="Syntax"><KqlCode code={o.syntax} /></Part>
      <div className="grid gap-4 md:grid-cols-2">
        <Part n={4} title="Basic example"><KqlCode code={o.basic} /></Part>
        <Part n={5} title="Security example"><KqlCode code={o.security} /></Part>
      </div>
      <Part n={6} title="How SOCs use it">{o.socUse}</Part>
      <Part n={7} title="Output">{o.output}</Part>
      <Part n={8} title="Common mistake"><span style={{ color: 'var(--danger)' }}>✗ </span>{o.mistake}</Part>
      <Part n={9} title="Practice question">
        <p className="font-medium">{o.practice.question}</p>
        <textarea className="input mt-2 min-h-16 font-mono text-sm" placeholder="Write your query or answer first…" value={attempt} onChange={e => setAttempt(e.target.value)} aria-label={`Practice answer for ${o.name}`} />
        {reveal ? <div className="mt-2 rounded-xl p-3 font-mono text-sm animate-rise" style={{ background: 'var(--ok-soft)' }}>{o.practice.answer}</div> : <button className="btn mt-2" onClick={() => setReveal(true)}><Eye size={15} aria-hidden /> {attempt.trim() ? 'Compare with the answer' : 'Show answer (try first)'}</button>}
      </Part>
      <a href={o.docs} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent">Official documentation <ExternalLink size={12} /></a>
    </article>
  )
}

export default function KqlReference() {
  const groups = [...new Set(KQL_OPERATORS.map(o => o.group))]
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Module 16 · KQL" title="KQL operator reference" icon={Terminal} color="var(--t-investigation)">
        Every operator in nine parts. Start with <Link to="/lesson/kql-what-why" className="text-accent">KQL from zero</Link> if you have never written a query.
      </PageHeader>
      <div className="mb-8">
        <Callout tone="warn" title="Where to run these queries">
          This academy does not include a query engine with sample security data. Practice syntax for free on public sample data in the <a className="text-accent underline" href="https://dataexplorer.azure.com/" target="_blank" rel="noopener noreferrer">Azure Data Explorer help cluster</a> (sign in with a free Microsoft account; database <span className="font-mono">Samples</span>). Run the security examples in Microsoft Sentinel Logs or Defender Advanced Hunting in your own lab or trial tenant.
        </Callout>
      </div>
      <div className="grid gap-8 lg:grid-cols-[13rem_1fr]">
        <nav className="hidden lg:block" aria-label="Operators">
          <div className="sticky top-20 space-y-4 text-sm">
            {groups.map((g, gi) => (
              <div key={g}>
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: GROUP_COLOR[gi % GROUP_COLOR.length] }}><span className="h-2 w-2 rounded-full" style={{ background: GROUP_COLOR[gi % GROUP_COLOR.length] }} aria-hidden />{g}</div>
                {KQL_OPERATORS.filter(o => o.group === g).map(o => <a key={o.id} href={`#${o.id}`} onClick={e => { e.preventDefault(); document.getElementById(o.id)?.scrollIntoView({ behavior: 'smooth' }) }} className="block rounded-lg px-2 py-0.5 font-mono text-[13px] hover:bg-[var(--surface-2)] hover:text-accent">{o.name}</a>)}
              </div>
            ))}
          </div>
        </nav>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 lg:hidden" aria-label="Jump to operator">
            {KQL_OPERATORS.map(o => <a key={o.id} href={`#${o.id}`} onClick={e => { e.preventDefault(); document.getElementById(o.id)?.scrollIntoView({ behavior: 'smooth' }) }} className="rounded-full border border-base px-2.5 py-0.5 font-mono text-xs" style={{ color: GROUP_COLOR[groups.indexOf(o.group) % GROUP_COLOR.length] }}>{o.name}</a>)}
          </div>
          {KQL_OPERATORS.map(o => <OperatorCard key={o.id} o={o} color={GROUP_COLOR[groups.indexOf(o.group) % GROUP_COLOR.length]} />)}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Keep learning</h2>
            <ResourceCards resources={res('kqlCommon', 'sc200Kql', 'kqlDocs', 'mustLearnKql', 'adx')} />
          </section>
        </div>
      </div>
    </div>
  )
}
