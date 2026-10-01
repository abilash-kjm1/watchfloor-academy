import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Eye } from 'lucide-react'
import { KQL_OPERATORS, type KqlOperator } from '../data/kqlOperators'
import { KqlCode } from '../components/KqlCode'
import { Callout, PageHeader } from '../components/ui'
import { ResourceCards } from '../components/Resources'
import { res } from '../data/resources'

function Part({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider muted"><span className="font-mono">{n}</span> · {title}</div>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </div>
  )
}

function OperatorCard({ o }: { o: KqlOperator }) {
  const [attempt, setAttempt] = useState('')
  const [reveal, setReveal] = useState(false)
  return (
    <article id={o.id} className="card scroll-mt-20 space-y-5 p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-xl font-semibold">{o.name}</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">{o.group}</span>
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
        {reveal ? <div className="mt-2 rounded-lg surface-2 p-3 font-mono text-sm">{o.practice.answer}</div> : <button className="btn mt-2" onClick={() => setReveal(true)}><Eye size={15} /> Show answer</button>}
      </Part>
      <a href={o.docs} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent">Official documentation <ExternalLink size={12} /></a>
    </article>
  )
}

export default function KqlReference() {
  const groups = [...new Set(KQL_OPERATORS.map(o => o.group))]
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Module 16 · KQL" title="KQL operator reference">
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
            {groups.map(g => (
              <div key={g}>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider muted">{g}</div>
                {KQL_OPERATORS.filter(o => o.group === g).map(o => <a key={o.id} href={`#${o.id}`} onClick={e => { e.preventDefault(); document.getElementById(o.id)?.scrollIntoView({ behavior: 'smooth' }) }} className="block rounded px-2 py-0.5 font-mono text-[13px] hover:text-accent">{o.name}</a>)}
              </div>
            ))}
          </div>
        </nav>
        <div className="space-y-6">
          {KQL_OPERATORS.map(o => <OperatorCard key={o.id} o={o} />)}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Keep learning</h2>
            <ResourceCards resources={res('kqlCommon', 'sc200Kql', 'kqlDocs', 'mustLearnKql', 'adx')} />
          </section>
        </div>
      </div>
    </div>
  )
}
