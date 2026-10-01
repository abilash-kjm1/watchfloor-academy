import { useState } from 'react'
import { Callout, Card, PageHeader } from '../components/ui'
import { ResourceCards } from '../components/Resources'
import { res } from '../data/resources'

const SECTIONS = ['Incident Summary', 'Affected User', 'Affected Device', 'Detection Source', 'Initial Evidence', 'Investigation', 'Indicators', 'MITRE Technique', 'Scope', 'Containment', 'Recommended Actions', 'Analyst Notes']

const POOR = `Saw failed logins for some users. Looks like brute force. Blocked IP. Closing.`

const GOOD = `Incident Summary: Password-spray pattern against Entra ID from a single external IP. One account (liam.walsh) authenticated successfully afterwards; treated as a likely account compromise.
Affected User: liam.walsh@contoso.com (Sales). 24 other accounts targeted, no successful sign-in.
Affected Device: None identified — activity was cloud sign-in only; no device events for the session.
Detection Source: Microsoft Sentinel scheduled rule "Password spray – many accounts per IP" (SigninLogs).
Initial Evidence: 2026-09-27 02:10–02:27 UTC, 25 accounts, ResultType 50126 (invalid credentials), 1 attempt each, IP 203.0.113.77 (NL), client app "Other clients", user agent python-requests.
Investigation: Joined failures to successes by IP → 1 success at 02:31 UTC for liam.walsh, single-factor, no prior sign-ins from NL or this IP in 30 days. Session accessed Exchange Online. No inbox-rule creation found in audit log (checked 02:31–09:00 UTC).
Indicators: IP 203.0.113.77; user agent "python-requests/2.31".
MITRE Technique: T1110.003 Password Spraying; T1078 Valid Accounts.
Scope: 25 targeted accounts listed in query output (attached). 1 confirmed successful authentication. No other source IPs matched the pattern in the same window.
Containment: 09:12 UTC revoked sessions and forced password reset for liam.walsh (approved by IAM on-call). IP added to Conditional Access named-location block.
Recommended Actions: Enforce MFA for liam.walsh's group (exempted from policy); review legacy-auth exclusions; monitor the 24 targeted accounts for 7 days.
Analyst Notes: Verdict: true positive. Queries used are attached. Handover: confirm with the user that no MFA prompts were approved overnight.`

function check(text: string) {
  const t = text.toLowerCase()
  return {
    sections: SECTIONS.map(s => ({ s, ok: t.includes(s.toLowerCase()) })),
    utc: /\butc\b|\d{2}:\d{2}(:\d{2})?z/i.test(text),
    timestamps: /\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}/.test(text),
    verdict: /(true positive|false positive|benign|needs investigation)/i.test(text),
    entity: /@|\b\d{1,3}(\.\d{1,3}){3}\b|-ws-|\.exe\b/i.test(text),
    mitre: /\bT\d{4}(\.\d{3})?\b/.test(text),
    length: text.trim().split(/\s+/).length,
  }
}

export default function Tickets() {
  const [draft, setDraft] = useState(SECTIONS.map(s => `${s}: `).join('\n'))
  const [shown, setShown] = useState(false)
  const r = check(draft)
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Module 33 · Ticket writing" title="Write incident notes the next shift can act on">
        A good ticket separates facts from assessment, states times in UTC, names exact entities, records what you checked (including what you found nothing in), and ends with a clear verdict and next step.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-2 text-sm font-semibold" style={{ color: 'var(--danger)' }}>Weak ticket</div>
          <pre className="code whitespace-pre-wrap">{POOR}</pre>
          <ul className="prose-lesson mt-3 text-sm">
            <li>"Some users" — which? Nobody can scope from this.</li>
            <li>No times, no time zone, no source IP, no detection name.</li>
            <li>"Looks like brute force" — no evidence, and the pattern was actually spraying.</li>
            <li>Didn't check whether any attempt succeeded — the most important question.</li>
            <li>"Closing" without verdict, containment details or approvals.</li>
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-2 text-sm font-semibold" style={{ color: 'var(--both)' }}>Improved ticket (same incident)</div>
          {shown ? <pre className="code max-h-[28rem] overflow-y-auto whitespace-pre-wrap scrollbar-thin">{GOOD}</pre> : (
            <div className="rounded-lg surface-2 p-4 text-sm">Try improving the weak ticket yourself first using the template below, then compare. <button className="btn mt-3" onClick={() => setShown(true)}>Show improved version</button></div>
          )}
        </Card>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div>
          <h2 className="mb-2 text-lg font-semibold">Practice: write your ticket</h2>
          <p className="mb-3 text-sm muted">Use a scenario from any lesson's "Security example", or your own lab. Saved only while this page is open — copy it into your notes to keep it.</p>
          <textarea className="input min-h-[28rem] font-mono text-sm" value={draft} onChange={e => setDraft(e.target.value)} aria-label="Ticket draft" />
        </div>
        <Card className="h-fit p-5 text-sm">
          <div className="mb-2 font-semibold">Checklist</div>
          <ul className="space-y-1">
            {r.sections.map(({ s, ok }) => <li key={s} style={{ color: ok ? 'var(--both)' : undefined }} className={ok ? '' : 'muted'}>{ok ? '✓' : '○'} {s}</li>)}
          </ul>
          <div className="mt-4 mb-2 font-semibold">Quality signals</div>
          <ul className="space-y-1">
            {([['Timestamps present', r.timestamps], ['Time zone stated (UTC)', r.utc], ['Specific entities (user, IP, host)', r.entity], ['MITRE technique ID', r.mitre], ['Clear verdict', r.verdict], ['Enough detail (80+ words)', r.length >= 80]] as [string, boolean][]).map(([t, ok]) => (
              <li key={t} style={{ color: ok ? 'var(--both)' : undefined }} className={ok ? '' : 'muted'}>{ok ? '✓' : '○'} {t}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs muted">The checklist only detects structure. Whether the content is correct and useful is your job — compare with the improved example.</p>
        </Card>
      </section>

      <div className="mt-10"><Callout tone="tip" title="Writing rule of thumb">If you were off sick tomorrow, could a colleague continue this incident from your ticket alone without re-running your queries? If not, add what's missing.</Callout></div>
      <section className="mt-10"><h2 className="mb-4 text-lg font-semibold">Further reading</h2><ResourceCards resources={res('irOverview', 'nist61', 'sentinelIncidents')} /></section>
    </div>
  )
}
