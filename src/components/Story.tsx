import { useState } from 'react'
import {
  ArrowDown, ArrowRight, BookOpen, Brain, CheckCircle2, ChevronDown, CircleHelp, Eye, Lightbulb, Search, ShieldAlert, ShieldCheck, Siren, Sparkles, XCircle,
} from 'lucide-react'
import type { Story, Tone } from '../data/types'
import { KqlCode } from './KqlCode'
import { cx } from './ui'

const C = 'var(--lesson-color, var(--accent))'
const TONE: Record<Tone, { color: string; label: string }> = {
  neutral: { color: 'var(--muted)', label: 'Context' },
  normal: { color: 'var(--ok)', label: 'Normal' },
  suspicious: { color: 'var(--t-soc)', label: 'Suspicious' },
  malicious: { color: 'var(--danger)', label: 'Malicious' },
}

/** Light inline formatting for story text: **bold** and `code`. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return <>{parts.map((p, i) => p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith('`') ? <code key={i} className="rounded bg-[var(--surface-2)] px-1 py-0.5 font-mono text-[0.85em]">{p.slice(1, -1)}</code> : <span key={i}>{p}</span>)}</>
}

/** The story opener: scenes revealed one at a time, then the twists. */
export function StoryOpener({ story }: { story: Story }) {
  const [shown, setShown] = useState(1)
  const [twists, setTwists] = useState(0)
  const allScenes = shown >= story.scenes.length
  return (
    <div className="overflow-hidden rounded-3xl border" style={{ borderColor: `color-mix(in srgb, ${C} 30%, var(--border))` }}>
      <div className="flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ background: `color-mix(in srgb, ${C} 10%, var(--surface))`, color: C }}>
        <BookOpen size={15} aria-hidden /> The story
      </div>
      <div className="space-y-4 p-5 md:p-6">
        <p className="font-serif text-xl leading-relaxed"><Rich text={story.hook} /></p>
        <ol className="relative space-y-3 border-l-2 pl-5" style={{ borderColor: `color-mix(in srgb, ${C} 35%, var(--border))` }}>
          {story.scenes.slice(0, shown).map((s, i) => (
            <li key={i} className="relative animate-rise text-[15.5px] leading-relaxed">
              <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2" style={{ borderColor: C, background: 'var(--surface)' }} aria-hidden />
              <Rich text={s} />
            </li>
          ))}
        </ol>
        {!allScenes && (
          <button className="btn" onClick={() => setShown(n => n + 1)} aria-label="Continue the story"><ArrowDown size={15} aria-hidden /> What happens next?</button>
        )}
        {allScenes && story.twists.map((t, i) => i < twists ? (
          <div key={t.title} className="animate-rise rounded-2xl border p-4 md:p-5" style={{ borderColor: 'color-mix(in srgb, var(--t-identity) 35%, transparent)', background: 'color-mix(in srgb, var(--t-identity) 8%, var(--surface))' }}>
            <div className="mb-1.5 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--t-identity)' }}><Sparkles size={16} aria-hidden /> {i === 0 ? 'But there is a twist' : 'And another twist'}: {t.title}</div>
            <div className="text-[15px] leading-relaxed"><Rich text={t.body} /></div>
          </div>
        ) : null)}
        {allScenes && twists < story.twists.length && (
          <button className="btn btn-primary" onClick={() => setTwists(n => n + 1)}><Sparkles size={15} aria-hidden /> {twists === 0 ? 'Reveal the twist' : 'Reveal the next twist'}</button>
        )}
      </div>
    </div>
  )
}

/** 🟥 attacker / 🟦 defender / 🟨 next question. */
export function Perspectives({ panels }: { panels: Story['panels'] }) {
  const col = (color: string, icon: typeof ShieldAlert, label: string, text: string) => {
    const Icon = icon
    return (
      <div className="rounded-2xl p-4" style={{ background: `color-mix(in srgb, ${color} 9%, var(--surface))`, borderLeft: `4px solid ${color}` }}>
        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color }}><Icon size={14} aria-hidden />{label}</div>
        <p className="text-[15px] leading-relaxed"><Rich text={text} /></p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {panels.map((p, i) => (
        <div key={i} className="grid gap-3 md:grid-cols-3">
          {col('var(--danger)', ShieldAlert, 'Attacker view', p.attacker)}
          {col('var(--t-microsoft)', ShieldCheck, 'Defender view', p.defender)}
          {col('var(--t-soc)', CircleHelp, 'Investigation question', p.question)}
        </div>
      ))}
    </div>
  )
}

/** What happened → evidence → stored → tamper → forwarded → still investigable. */
export function EvidenceTrail({ evidence, scenarios }: { evidence: Story['evidence']; scenarios: Story['scenarios'] }) {
  const steps: [string, string][] = [
    ['What happened?', evidence.happened], ['What evidence was created?', evidence.created], ['Where is it stored?', evidence.stored],
    ['Can the attacker modify or delete it?', evidence.tamper], ['Was it forwarded somewhere else?', evidence.forwarded], ['Can the SOC still investigate?', evidence.still],
  ]
  return (
    <div className="space-y-6">
      <ol className="space-y-2">
        {steps.map(([q, a], i) => (
          <li key={q}>
            <div className="flex gap-3 rounded-2xl border border-base p-3.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ background: `color-mix(in srgb, ${C} 15%, transparent)`, color: C }} aria-hidden>{i + 1}</span>
              <div><div className="text-sm font-semibold">{q}</div><div className="text-[15px] leading-relaxed muted"><Rich text={a} /></div></div>
            </div>
            {i < steps.length - 1 && <ArrowDown size={14} className="mx-auto my-0.5 muted" aria-hidden />}
          </li>
        ))}
      </ol>
      <div className="grid gap-3 md:grid-cols-3">
        {([['normal', '🟢 Normal', scenarios.normal], ['suspicious', '🟡 Suspicious', scenarios.suspicious], ['malicious', '🔴 Malicious / high confidence', scenarios.malicious]] as const).map(([tone, label, text]) => (
          <div key={tone} className="rounded-2xl border p-4" style={{ borderColor: `color-mix(in srgb, ${TONE[tone].color} 35%, transparent)`, background: `color-mix(in srgb, ${TONE[tone].color} 7%, var(--surface))` }}>
            <div className="mb-1 text-sm font-bold" style={{ color: TONE[tone].color }}>{label}</div>
            <p className="text-[15px] leading-relaxed"><Rich text={text} /></p>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Interactive timeline: click an entry to inspect it, then reason about what to investigate next. */
export function StoryTimeline({ timeline }: { timeline: Story['timeline'] }) {
  const [open, setOpen] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [reveal, setReveal] = useState(false)
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-base px-5 py-3.5 font-semibold" style={{ background: `color-mix(in srgb, ${C} 7%, var(--surface))` }}>
        <Search size={16} style={{ color: C }} aria-hidden /> {timeline.title}
      </div>
      <div className="p-5">
        <p className="mb-3 text-xs muted">Select any entry to inspect it. Illustrative timeline for teaching — not real data.</p>
        <ol className="relative space-y-1.5 border-l-2 border-base pl-5">
          {timeline.entries.map((e, i) => {
            const t = TONE[e.tone ?? 'neutral']
            const isOpen = open === i
            return (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-3 h-3 w-3 rounded-full" style={{ background: t.color }} aria-hidden />
                <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className={cx('flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2 text-left transition hover:bg-[var(--surface-2)]', isOpen && 'bg-[var(--surface-2)]')}>
                  <span className="font-mono text-xs muted">{e.time}</span>
                  {e.code && <span className="rounded-md px-1.5 py-0.5 font-mono text-xs font-bold" style={{ background: `color-mix(in srgb, ${t.color} 15%, transparent)`, color: t.color }}>{e.code}</span>}
                  <span className="text-[15px] font-medium">{e.label}</span>
                  <span className="sr-only">({t.label})</span>
                  <ChevronDown size={14} className={cx('ml-auto muted transition', isOpen && 'rotate-180')} aria-hidden />
                </button>
                {isOpen && <div className="mx-3 mb-2 rounded-xl border-l-4 px-3 py-2 text-sm leading-relaxed animate-rise" style={{ borderColor: t.color }}><span className="font-semibold" style={{ color: t.color }}>{t.label}. </span><Rich text={e.detail} /></div>}
              </li>
            )
          })}
        </ol>
        <div className="mt-5 rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
          <div className="flex items-center gap-2 font-semibold"><Brain size={16} style={{ color: C }} aria-hidden /> {timeline.question}</div>
          <textarea className="input mt-2 min-h-16" placeholder="Think it through and write your next step…" value={draft} onChange={e => setDraft(e.target.value)} aria-label="Your next investigation step" />
          {reveal
            ? <div className="mt-2 rounded-xl p-3 text-[15px] leading-relaxed animate-rise" style={{ background: 'var(--ok-soft)' }}><span className="font-semibold" style={{ color: 'var(--ok)' }}>An analyst would: </span><Rich text={timeline.answer} /></div>
            : <button className="btn mt-2" onClick={() => setReveal(true)}><Eye size={15} aria-hidden /> {draft.trim() ? 'Compare with an analyst' : 'Reveal (try first)'}</button>}
        </div>
      </div>
    </div>
  )
}

/** 🚨 Investigation moment: choose a first step; every option explains its reasoning. */
export function InvestigationMoment({ moment }: { moment: Story['moment'] }) {
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <div className="overflow-hidden rounded-3xl border" style={{ borderColor: 'color-mix(in srgb, var(--danger) 35%, transparent)' }}>
      <div className="flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}><Siren size={15} aria-hidden /> Investigation moment — you are the SOC analyst</div>
      <div className="p-5">
        <p className="text-[16px] font-medium leading-relaxed"><Rich text={moment.prompt} /></p>
        <div className="mt-4 space-y-2" role="radiogroup" aria-label="Choose your first step">
          {moment.options.map((o, i) => {
            const chosen = picked === i
            const show = picked !== null
            return (
              <div key={i}>
                <button role="radio" aria-checked={chosen} onClick={() => setPicked(i)}
                  className={cx('flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-[15px] transition', !show && 'border-base hover:bg-[var(--surface-2)]')}
                  style={show ? (o.best ? { borderColor: 'var(--ok)', background: 'var(--ok-soft)' } : chosen ? { borderColor: 'var(--danger)', background: 'var(--danger-soft)' } : { borderColor: 'var(--border)', opacity: 0.85 }) : undefined}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold" style={show && o.best ? { background: 'var(--ok)', color: 'var(--surface)' } : show && chosen ? { background: 'var(--danger)', color: 'var(--surface)' } : { border: '1.5px solid var(--border-strong)', color: 'var(--muted)' }} aria-hidden>
                    {show && o.best ? <CheckCircle2 size={13} /> : show && chosen ? <XCircle size={13} /> : String.fromCharCode(65 + i)}
                  </span>
                  <span className="pt-0.5">{o.text}</span>
                </button>
                {show && <p className="mx-3 mt-1 text-sm leading-relaxed muted animate-rise"><span className="font-semibold" style={{ color: o.best ? 'var(--ok)' : 'var(--text)' }}>{o.best ? 'Best first step: ' : 'Why not first: '}</span><Rich text={o.feedback} /></p>}
              </div>
            )
          })}
        </div>
        {picked !== null && <p className="mt-3 text-xs muted" aria-live="polite">Every option's reasoning is shown — the point is the reasoning, not the guess.</p>}
      </div>
    </div>
  )
}

/** Before / during / after checklist plus the 🧠 analyst-thinking box. */
export function InvestigateBox({ story }: { story: Story }) {
  const col = (title: string, items: string[], color: string) => (
    <div className="rounded-2xl border border-base p-4">
      <div className="mb-2 text-sm font-bold" style={{ color }}>{title}</div>
      <ul className="space-y-1.5 text-sm leading-relaxed">{items.map(x => <li key={x} className="flex gap-2"><ArrowRight size={13} className="mt-1 shrink-0" style={{ color }} aria-hidden /><span><Rich text={x} /></span></li>)}</ul>
    </div>
  )
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        {col('⏮ Before the event', story.before, 'var(--t-foundations)')}
        {col('⏺ During the event', story.during, 'var(--t-soc)')}
        {col('⏭ After the event', story.after, 'var(--t-identity)')}
      </div>
      <div className="rounded-3xl p-5 md:p-6" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${C} 12%, var(--surface)), var(--surface))`, border: `1px solid color-mix(in srgb, ${C} 30%, transparent)` }}>
        <div className="mb-3 flex items-center gap-2 font-bold" style={{ color: C }}><Brain size={18} aria-hidden /> How a SOC analyst thinks</div>
        <p className="text-[15px]"><span className="font-semibold">Don't ask:</span> <span className="line-through decoration-[var(--danger)] decoration-2">{story.thinking.dont}</span></p>
        <p className="mt-3 text-[15px] font-semibold">Ask:</p>
        <ul className="mt-1 grid gap-1.5 text-[15px] sm:grid-cols-2">{story.thinking.ask.map(q => <li key={q} className="flex gap-2"><span style={{ color: C }} aria-hidden>?</span><span>{q}</span></li>)}</ul>
        <p className="mt-4 rounded-xl px-3 py-2 text-sm font-medium" style={{ background: 'var(--surface)' }}>A security event is a <strong>clue</strong>, not a conclusion. Don't look at one event — look at the story the evidence is telling you.</p>
      </div>
    </div>
  )
}

/** "What if?" challenge cards. */
export function WhatIf({ items }: { items: Story['whatIf'] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({})
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((w, i) => (
        <div key={i} className="rounded-2xl border border-base p-4">
          <div className="flex items-start gap-2 font-semibold"><CircleHelp size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--t-cert)' }} aria-hidden />{w.q}</div>
          {open[i]
            ? <p className="mt-2 text-sm leading-relaxed animate-rise"><Rich text={w.a} /></p>
            : <button className="btn mt-3 !py-1 text-xs" onClick={() => setOpen(o => ({ ...o, [i]: true }))}>Think, then reveal</button>}
        </div>
      ))}
    </div>
  )
}

/** Honest limitations of the detection or evidence. */
export function Limits({ limits }: { limits: Story['limits'] }) {
  const rows: [string, string, string][] = [
    ['Can detect', limits.detects, 'var(--ok)'], ['Cannot detect', limits.misses, 'var(--danger)'], ['Depends on', limits.dependsOn, 'var(--t-microsoft)'],
    ['False positives', limits.falsePositives, 'var(--t-soc)'], ['How attackers evade it', limits.evasion, 'var(--t-security)'], ['What raises confidence', limits.confidence, 'var(--t-investigation)'],
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([t, b, c]) => (
        <div key={t} className="rounded-2xl border border-base p-4" style={{ borderTop: `3px solid ${c}` }}>
          <div className="mb-1 text-xs font-bold uppercase tracking-wider" style={{ color: c }}>{t}</div>
          <p className="text-[15px] leading-relaxed"><Rich text={b} /></p>
        </div>
      ))}
    </div>
  )
}

/** KQL taught step by step: goal → table → query → each line → normal vs suspicious → is it enough? */
export function KqlWalkthrough({ kql }: { kql: NonNullable<Story['kql']> }) {
  const [enough, setEnough] = useState(false)
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-base p-4">
        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--t-investigation)' }}>What are we trying to find?</div>
        <p className="mt-1 text-[15px] leading-relaxed"><Rich text={kql.goal} /></p>
        <div className="mt-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--t-investigation)' }}>Which table, and why?</div>
        <p className="mt-1 text-[15px] leading-relaxed"><code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-sm">{kql.table}</code> — <Rich text={kql.whyTable} /></p>
      </div>
      <KqlCode code={kql.query} />
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-base text-sm">
          <thead><tr><th className="border-b border-base px-3 py-2 text-left" style={{ background: 'var(--t-investigation-soft)' }}>Line</th><th className="border-b border-base px-3 py-2 text-left" style={{ background: 'var(--t-investigation-soft)' }}>What it does</th></tr></thead>
          <tbody>{kql.lines.map((l, i) => <tr key={i}><td className="border-b border-base px-3 py-2 align-top font-mono text-xs whitespace-pre">{l.code}</td><td className="border-b border-base px-3 py-2 leading-relaxed"><Rich text={l.meaning} /></td></tr>)}</tbody>
        </table>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl p-4" style={{ background: 'var(--ok-soft)' }}><div className="mb-1 text-sm font-bold" style={{ color: 'var(--ok)' }}>Normal-looking output</div><p className="text-[15px] leading-relaxed"><Rich text={kql.normal} /></p></div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--danger-soft)' }}><div className="mb-1 text-sm font-bold" style={{ color: 'var(--danger)' }}>Suspicious-looking output</div><p className="text-[15px] leading-relaxed"><Rich text={kql.suspicious} /></p></div>
      </div>
      <div className="rounded-2xl border border-base p-4">
        <div className="flex items-center gap-2 font-semibold"><Lightbulb size={16} style={{ color: 'var(--t-soc)' }} aria-hidden /> Is this query result enough to call it an attack?</div>
        {enough
          ? <div className="mt-2 space-y-2 text-[15px] leading-relaxed animate-rise"><p><Rich text={kql.enough} /></p><p><span className="font-semibold">Investigate next: </span><Rich text={kql.next} /></p></div>
          : <button className="btn mt-2 !py-1 text-sm" onClick={() => setEnough(true)}>Think, then reveal</button>}
      </div>
    </div>
  )
}

/** 🔗 Connect the dots chain + plain-English explanation + response steps. */
export function StoryChain({ story }: { story: Story }) {
  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap items-center gap-y-2" aria-label="Connect the dots">
        {story.chain.map((c, i) => (
          <li key={i} className="flex items-center">
            <span className="rounded-full px-3 py-1 text-sm font-medium" style={{ background: `color-mix(in srgb, ${C} ${8 + Math.round((i / Math.max(1, story.chain.length - 1)) * 18)}%, var(--surface))` }}>{c}</span>
            {i < story.chain.length - 1 && <ArrowRight size={13} className="mx-1 shrink-0 muted" aria-hidden />}
          </li>
        ))}
      </ol>
      <p className="text-[15.5px] leading-relaxed"><Rich text={story.chainExplained} /></p>
      <div className="rounded-2xl border border-base p-4">
        <div className="mb-2 text-sm font-bold" style={{ color: 'var(--t-security)' }}>Response — what happens once it's confirmed</div>
        <ol className="space-y-1.5 text-[15px]">{story.response.map((r, i) => <li key={i} className="flex gap-2.5"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold" style={{ background: 'var(--t-security-soft)', color: 'var(--t-security)' }} aria-hidden>{i + 1}</span><span><Rich text={r} /></span></li>)}</ol>
      </div>
    </div>
  )
}
