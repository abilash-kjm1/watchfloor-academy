import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

const KEYWORDS = new Set(['where', 'project', 'extend', 'summarize', 'by', 'sort', 'order', 'top', 'take', 'limit', 'join', 'kind', 'on', 'union', 'let', 'count', 'distinct', 'parse', 'with', 'and', 'or', 'in', 'has', 'contains', 'startswith', 'endswith', 'between', 'asc', 'desc', 'getschema', 'render', 'mv-expand', 'project-away', 'project-rename', 'has_any', 'withsource', 'inner', 'leftouter', 'leftanti', 'innerunique', 'true', 'false'])

function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?(?:d|h|m|s|ms)?\b)|([A-Za-z_][A-Za-z0-9_-]*)(?=\s*\()|([A-Za-z_][A-Za-z0-9_~-]*)/g
  let last = 0; let m: RegExpExecArray | null; let k = 0
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index))
    if (m[1]) out.push(<span key={k++} className="cmt">{m[1]}</span>)
    else if (m[2]) out.push(<span key={k++} className="str">{m[2]}</span>)
    else if (m[3]) out.push(<span key={k++} className="num">{m[3]}</span>)
    else if (m[4]) out.push(<span key={k++} className="fn">{m[4]}</span>)
    else if (m[5]) out.push(KEYWORDS.has(m[5]) ? <span key={k++} className="kw">{m[5]}</span> : m[5])
    last = m.index + m[0].length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

export function KqlCode({ code, actions, plain }: { code: string; actions?: ReactNode; plain?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard unavailable */ }
  }
  return (
    <div className="group relative my-3">
      <pre className="code scrollbar-thin" aria-label={plain ? undefined : 'KQL query'}><code>{plain ? code : highlight(code)}</code></pre>
      <div className="absolute right-2 top-2 flex gap-1 opacity-80 group-hover:opacity-100">
        {actions}
        <button onClick={copy} className="btn !px-2 !py-1 text-xs" aria-label="Copy query">
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  )
}
