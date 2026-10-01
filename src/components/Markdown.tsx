import { Fragment, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { glossaryById } from '../data/glossary'
import { KqlCode } from './KqlCode'

/**
 * Minimal markdown for lesson content:
 *   ### Sub-heading            > Key idea callout (consecutive "> " lines join)
 *   - bullet / 1. numbered     "  - " (indented) = nested bullet under the previous item
 *   | tables |   ``` code fences   **bold**  *italic*  `code`  [[glossary-id|label]]
 */
export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text)
  return <div className={`prose-lesson ${className ?? ''}`}>{blocks.map((b, i) => <Fragment key={i}>{renderBlock(b)}</Fragment>)}</div>
}

interface Item { text: string; children: string[] }
type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'quote'; text: string }
  | { t: 'ul' | 'ol'; items: Item[] }
  | { t: 'table'; rows: string[][] }
  | { t: 'code'; text: string; plain: boolean }

const BLOCK_START = /^\s*(- |\d+\. |\||```|### |> )/
const LIST_ITEM = /^(- |\d+\. )/
const NESTED_ITEM = /^ {2,}- /

function parseBlocks(text: string): Block[] {
  const lines = text.split('\n')
  const out: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    if (line.trim().startsWith('```')) {
      const plain = line.trim().slice(3).trim() !== 'kql'
      const buf: string[] = []; i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++])
      i++; out.push({ t: 'code', text: buf.join('\n'), plain }); continue
    }
    if (line.startsWith('### ')) { out.push({ t: 'h', text: line.slice(4) }); i++; continue }
    if (line.startsWith('> ')) {
      const buf: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) buf.push(lines[i++].slice(2))
      out.push({ t: 'quote', text: buf.join(' ') }); continue
    }
    if (line.trim().startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
        if (!cells.every(c => /^:?-{2,}:?$/.test(c))) rows.push(cells)
        i++
      }
      out.push({ t: 'table', rows }); continue
    }
    if (LIST_ITEM.test(line)) {
      const t = line.startsWith('- ') ? 'ul' : 'ol'
      const items: Item[] = []
      while (i < lines.length && (LIST_ITEM.test(lines[i]) || NESTED_ITEM.test(lines[i]))) {
        const l = lines[i++]
        if (NESTED_ITEM.test(l)) { if (items.length) items[items.length - 1].children.push(l.replace(/^ +- /, '')) }
        else items.push({ text: l.replace(LIST_ITEM, ''), children: [] })
      }
      out.push({ t, items }); continue
    }
    const buf: string[] = []
    while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i])) buf.push(lines[i++])
    out.push({ t: 'p', text: buf.join(' ') })
  }
  return out
}

function renderItems(items: Item[]) {
  return items.map((x, i) => (
    <li key={i}>
      {inline(x.text)}
      {x.children.length > 0 && <ul>{x.children.map((c, k) => <li key={k}>{inline(c)}</li>)}</ul>}
    </li>
  ))
}

function renderBlock(b: Block): ReactNode {
  switch (b.t) {
    case 'p': return <p>{inline(b.text)}</p>
    case 'h': return <h3>{inline(b.text)}</h3>
    case 'quote': return <div className="key-idea"><span className="key-idea-label">Key idea</span>{inline(b.text)}</div>
    case 'ul': return <ul>{renderItems(b.items)}</ul>
    case 'ol': return <ol>{renderItems(b.items)}</ol>
    case 'code': return <KqlCode code={b.text} plain={b.plain} />
    case 'table': {
      const [head, ...body] = b.rows
      return (
        <div className="overflow-x-auto scrollbar-thin">
          <table>
            <thead><tr>{head.map((c, i) => <th key={i}>{inline(c)}</th>)}</tr></thead>
            <tbody>{body.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )
    }
  }
}

export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[\[[^\]]+\]\])/g
  let last = 0; let m: RegExpExecArray | null; let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) out.push(<strong key={k++}>{inline(tok.slice(2, -2))}</strong>)
    else if (tok.startsWith('*')) out.push(<em key={k++}>{inline(tok.slice(1, -1))}</em>)
    else if (tok.startsWith('`')) out.push(<code key={k++}>{tok.slice(1, -1)}</code>)
    else {
      const [id, label] = tok.slice(2, -2).split('|')
      out.push(<TermLink key={k++} id={id} label={label} />)
    }
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function TermLink({ id, label }: { id: string; label?: string }) {
  const g = glossaryById.get(id)
  const [open, setOpen] = useState(false)
  if (!g) return <>{label ?? id}</>
  return (
    <span className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link to={`/glossary?term=${g.id}`} className="glossary-link" onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} aria-describedby={open ? `tip-${g.id}` : undefined}>
        {label ?? g.term}
      </Link>
      {open && (
        <span id={`tip-${g.id}`} role="tooltip" className="card absolute left-0 top-full z-40 mt-1 block w-72 p-3 text-left text-sm shadow-lg" style={{ fontWeight: 400 }}>
          <span className="block font-semibold">{g.term}</span>
          <span className="mt-1 block leading-snug">{g.definition}</span>
          <span className="mt-1.5 block text-xs muted">Why it matters: {g.why}</span>
        </span>
      )}
    </span>
  )
}
