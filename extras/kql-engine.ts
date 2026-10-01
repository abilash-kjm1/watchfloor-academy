/*
 * Watchfloor KQL simulator.
 *
 * A teaching interpreter for a practical subset of the Kusto Query Language.
 * It runs entirely in the browser against SIMULATED datasets. It is not
 * Microsoft's engine; behaviour follows the official KQL documentation for the
 * supported operators, and differences are called out in hints/warnings.
 */

export class Timespan {
  constructor(public ms: number) {}
}
export type Scalar = string | number | boolean | Date | Timespan | null
export type Value = Scalar | Value[] | { [k: string]: Value }
export type Row = Record<string, Value>
export type ColType = 'string' | 'int' | 'real' | 'bool' | 'datetime' | 'timespan' | 'dynamic'
export interface Column { name: string; type: ColType }
export interface Table { name: string; columns: Column[]; rows: Row[] }

export interface Stage { op: string; text: string; rowsIn: number; rowsOut: number; explain: string }
export interface QueryResult {
  ok: true
  columns: Column[]
  rows: Row[]
  stages: Stage[]
  warnings: string[]
  elapsedMs: number
}
export interface QueryError { ok: false; message: string; hint?: string; pos?: number }

export class KqlError extends Error {
  constructor(message: string, public hint?: string, public pos?: number) { super(message) }
}

export interface Catalog {
  getTable(name: string): Table | undefined
  tableNames(): string[]
  now: Date
}

/* ------------------------------------------------------------------ LEXER */

type TokType = 'id' | 'num' | 'str' | 'span' | 'dt' | 'op' | 'eof'
interface Tok { t: TokType; v: string; pos: number; end: number; num?: number }

const SPAN_UNITS: Record<string, number> = {
  d: 86400000, day: 86400000, days: 86400000,
  h: 3600000, hr: 3600000, hrs: 3600000, hour: 3600000, hours: 3600000,
  m: 60000, min: 60000, minute: 60000, minutes: 60000,
  s: 1000, sec: 1000, second: 1000, seconds: 1000,
  ms: 1, millisecond: 1, milliseconds: 1,
}
const DASHED = new Set(['project-away', 'project-rename', 'project-reorder', 'project-keep', 'mv-expand', 'make-series', 'top-nested', 'mv-apply'])
const NEGATABLE = new Set(['contains', 'has', 'in', 'startswith', 'endswith', 'between', 'contains_cs', 'has_cs', 'startswith_cs', 'endswith_cs', 'has_any', 'has_all', 'hasprefix', 'hassuffix'])

function lex(src: string): Tok[] {
  const toks: Tok[] = []
  let i = 0
  const n = src.length
  const isIdStart = (c: string) => /[A-Za-z_$]/.test(c)
  const isId = (c: string) => /[A-Za-z0-9_]/.test(c)
  while (i < n) {
    const c = src[i]
    if (/\s/.test(c)) { i++; continue }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue }
    const start = i
    // verbatim string @"..."
    if ((c === '@' && (src[i + 1] === '"' || src[i + 1] === "'"))) {
      const q = src[i + 1]; i += 2; let s = ''
      while (i < n && src[i] !== q) s += src[i++]
      if (i >= n) throw new KqlError('Unterminated string literal.', 'Close the string with a matching quote.', start)
      i++; toks.push({ t: 'str', v: s, pos: start, end: i }); continue
    }
    if (c === '"' || c === "'") {
      const q = c; i++; let s = ''
      while (i < n && src[i] !== q) {
        if (src[i] === '\\' && i + 1 < n) {
          const e = src[i + 1]
          s += e === 'n' ? '\n' : e === 't' ? '\t' : e === '0' ? '\0' : e
          i += 2
        } else s += src[i++]
      }
      if (i >= n) throw new KqlError('Unterminated string literal.', 'Every string must start and end with the same quote character.', start)
      i++; toks.push({ t: 'str', v: s, pos: start, end: i }); continue
    }
    if (/[0-9]/.test(c)) {
      let s = ''
      while (i < n && /[0-9]/.test(src[i])) s += src[i++]
      if (src[i] === '.' && /[0-9]/.test(src[i + 1] ?? '')) { s += src[i++]; while (i < n && /[0-9]/.test(src[i])) s += src[i++] }
      // timespan literal like 1h, 30m, 7d, 500ms
      let u = ''
      let j = i
      while (j < n && /[a-z]/i.test(src[j])) u += src[j++]
      if (u && SPAN_UNITS[u.toLowerCase()] !== undefined) {
        i = j
        toks.push({ t: 'span', v: s + u, pos: start, end: i, num: parseFloat(s) * SPAN_UNITS[u.toLowerCase()] })
        continue
      }
      toks.push({ t: 'num', v: s, pos: start, end: i, num: parseFloat(s) }); continue
    }
    if (isIdStart(c)) {
      let s = ''
      while (i < n && (isId(src[i]) || (s === '' && src[i] === '$'))) s += src[i++]
      // dashed operator names
      if (src[i] === '-' && /[a-z]/i.test(src[i + 1] ?? '')) {
        let j = i + 1; let rest = ''
        while (j < n && isId(src[j])) rest += src[j++]
        if (DASHED.has(`${s}-${rest}`)) { s = `${s}-${rest}`; i = j }
      }
      if ((s === 'in' || s === 'has_any') && src[i] === '~') { s += '~'; i++ }
      if (s === 'datetime' || s === 'timespan') {
        let j = i; while (j < n && /\s/.test(src[j])) j++
        if (src[j] === '(') {
          const close = src.indexOf(')', j)
          if (close === -1) throw new KqlError(`Missing ")" for ${s}(...)`, undefined, start)
          const raw = src.slice(j + 1, close).trim()
          i = close + 1
          toks.push({ t: 'dt', v: `${s}:${raw}`, pos: start, end: i }); continue
        }
      }
      toks.push({ t: 'id', v: s, pos: start, end: i }); continue
    }
    if (c === '!' && isIdStart(src[i + 1] ?? '')) {
      let j = i + 1; let s = ''
      while (j < n && isId(src[j])) s += src[j++]
      if (NEGATABLE.has(s)) {
        if (s === 'in' && src[j] === '~') { s += '~'; j++ }
        i = j; toks.push({ t: 'op', v: '!' + s, pos: start, end: i }); continue
      }
    }
    const three = src.slice(i, i + 3)
    const two = src.slice(i, i + 2)
    if (['!~'].includes(two) || ['==', '!=', '=~', '<=', '>=', '..', '&&', '||', '<>'].includes(two)) {
      if (three === '..' ) { /* unreachable */ }
      i += 2; toks.push({ t: 'op', v: two, pos: start, end: i }); continue
    }
    if ('|(),;=<>+-*/%.[]:{}!'.includes(c)) { i++; toks.push({ t: 'op', v: c, pos: start, end: i }); continue }
    throw new KqlError(`Unexpected character "${c}".`, 'Check for stray punctuation. KQL uses | to chain operators and // for comments.', start)
  }
  toks.push({ t: 'eof', v: '', pos: n, end: n })
  return toks
}

/* ---------------------------------------------------------- VALUE HELPERS */

export function isDate(v: unknown): v is Date { return v instanceof Date }
export function isSpan(v: unknown): v is Timespan { return v instanceof Timespan }

function pad(n: number, w = 2) { return String(n).padStart(w, '0') }
export function fmtDate(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`
}
export function fmtSpan(t: Timespan) {
  let ms = Math.abs(t.ms)
  const sign = t.ms < 0 ? '-' : ''
  const d = Math.floor(ms / 86400000); ms -= d * 86400000
  const h = Math.floor(ms / 3600000); ms -= h * 3600000
  const m = Math.floor(ms / 60000); ms -= m * 60000
  const s = Math.floor(ms / 1000); ms -= s * 1000
  return `${sign}${d ? d + '.' : ''}${pad(h)}:${pad(m)}:${pad(s)}${ms ? '.' + pad(ms, 3) : ''}`
}
export function display(v: Value): string {
  if (v === null || v === undefined) return ''
  if (isDate(v)) return fmtDate(v)
  if (isSpan(v)) return fmtSpan(v)
  if (Array.isArray(v) || typeof v === 'object') return JSON.stringify(v, (_k, x) => (isDate(x) ? fmtDate(x) : x))
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 10000) / 10000)
  return String(v)
}
function toStr(v: Value): string { return display(v) }
function toNum(v: Value): number | null {
  if (v === null) return null
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (isDate(v)) return v.getTime()
  if (isSpan(v)) return v.ms
  const f = parseFloat(String(v))
  return isNaN(f) ? null : f
}
function truthy(v: Value): boolean { return v === true }
function keyOf(v: Value): string {
  if (isDate(v)) return 'd:' + v.getTime()
  if (isSpan(v)) return 't:' + v.ms
  if (v === null) return 'null'
  if (typeof v === 'object') return 'o:' + JSON.stringify(v)
  return typeof v + ':' + String(v)
}
function compare(a: Value, b: Value): number {
  if (a === null && b === null) return 0
  if (a === null) return -1
  if (b === null) return 1
  if (isDate(a) && isDate(b)) return a.getTime() - b.getTime()
  if (isSpan(a) && isSpan(b)) return a.ms - b.ms
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  const na = toNum(a), nb = toNum(b)
  if (typeof a !== 'string' && typeof b !== 'string' && na !== null && nb !== null) return na - nb
  return toStr(a).localeCompare(toStr(b))
}
function eq(a: Value, b: Value): boolean {
  if (a === null || b === null) return false
  if (isDate(a) || isDate(b) || isSpan(a) || isSpan(b)) return compare(a, b) === 0
  if (typeof a === 'number' || typeof b === 'number') return toNum(a) === toNum(b)
  if (typeof a === 'boolean' || typeof b === 'boolean') return String(a).toLowerCase() === String(b).toLowerCase()
  return toStr(a) === toStr(b)
}
function terms(s: string): string[] { return s.toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean) }
function hasTerm(hay: string, needle: string): boolean {
  const n = needle.toLowerCase()
  if (!n) return true
  // KQL "has" matches whole terms (alphanumeric runs). Multi-term needles match as a phrase.
  const nt = terms(n)
  if (nt.length === 0) return hay.toLowerCase().includes(n)
  const ht = terms(hay)
  if (nt.length === 1) return ht.includes(nt[0])
  for (let i = 0; i + nt.length <= ht.length; i++) if (nt.every((t, k) => ht[i + k] === t)) return true
  return false
}
function parseDateLiteral(raw: string): Date {
  let s = raw.trim().replace(/^["']|["']$/g, '')
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00:00Z'
  else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) s = s.replace(' ', 'T') + 'Z'
  const d = new Date(s)
  if (isNaN(d.getTime())) throw new KqlError(`Could not parse datetime "${raw}".`, 'Use ISO 8601 such as datetime(2026-09-28 14:00) or datetime(2026-09-28T14:00:00Z).')
  return d
}
function parseSpanLiteral(raw: string): Timespan {
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)([a-z]+)$/i)
  if (m && SPAN_UNITS[m[2].toLowerCase()]) return new Timespan(parseFloat(m[1]) * SPAN_UNITS[m[2].toLowerCase()])
  const hms = raw.trim().match(/^(?:(\d+)\.)?(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (hms) return new Timespan((+(hms[1] ?? 0)) * 86400000 + +hms[2] * 3600000 + +hms[3] * 60000 + +(hms[4] ?? 0) * 1000)
  throw new KqlError(`Could not parse timespan "${raw}".`, 'Examples: 1h, 30m, 7d, timespan(01:30:00).')
}
function inferType(v: Value): ColType {
  if (v === null) return 'string'
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'real'
  if (typeof v === 'boolean') return 'bool'
  if (isDate(v)) return 'datetime'
  if (isSpan(v)) return 'timespan'
  if (typeof v === 'object') return 'dynamic'
  return 'string'
}

/* ---------------------------------------------------------------- PARSER */

type Expr =
  | { k: 'lit'; v: Value; pos: number }
  | { k: 'col'; name: string; pos: number }
  | { k: 'call'; name: string; args: Expr[]; pos: number; star?: boolean }
  | { k: 'bin'; op: string; l: Expr; r: Expr; pos: number }
  | { k: 'un'; op: string; e: Expr; pos: number }
  | { k: 'in'; neg: boolean; ci: boolean; l: Expr; items: (Expr | { k: 'tab'; q: Query })[]; pos: number; op: string }
  | { k: 'between'; neg: boolean; l: Expr; lo: Expr; hi: Expr; pos: number }
  | { k: 'member'; e: Expr; key: Expr | string; pos: number }
  | { k: 'arr'; items: Expr[]; pos: number }
  | { k: 'side'; side: 'left' | 'right'; name: string; pos: number }

interface Assign { name?: string; e: Expr; text: string }
type Op =
  | { op: 'where'; e: Expr; text: string }
  | { op: 'take'; n: number; text: string }
  | { op: 'project'; items: Assign[]; text: string }
  | { op: 'project-away'; cols: string[]; text: string }
  | { op: 'project-rename'; pairs: [string, string][]; text: string }
  | { op: 'extend'; items: Assign[]; text: string }
  | { op: 'distinct'; cols: string[]; text: string }
  | { op: 'count'; text: string }
  | { op: 'summarize'; aggs: Assign[]; by: Assign[]; text: string }
  | { op: 'sort'; keys: { e: Expr; desc: boolean; label: string }[]; text: string }
  | { op: 'top'; n: number; e: Expr; desc: boolean; label: string; text: string }
  | { op: 'join'; kind: string; right: Query; on: { l: string; r: string }[]; text: string }
  | { op: 'union'; sources: Query[]; text: string }
  | { op: 'parse'; e: Expr; pattern: ({ lit: string } | { name: string; type?: string } | { star: true })[]; text: string }
  | { op: 'search'; term: string; text: string }
  | { op: 'getschema'; text: string }
  | { op: 'render'; text: string }
  | { op: 'mv-expand'; col: string; text: string }

type Source =
  | { s: 'table'; name: string; pos: number }
  | { s: 'union'; parts: Query[] }
  | { s: 'sub'; q: Query }
  | { s: 'print'; items: Assign[] }
  | { s: 'search'; term: string; tables?: string[] }
interface Query { src: Source; ops: Op[]; srcText: string }
type Stmt = { kind: 'let'; name: string; tab?: Query; e?: Expr } | { kind: 'query'; q: Query }

const AGGS = new Set(['count', 'countif', 'dcount', 'dcountif', 'sum', 'sumif', 'avg', 'avgif', 'min', 'max', 'make_set', 'make_list', 'make_set_if', 'make_list_if', 'arg_max', 'arg_min', 'take_any', 'any', 'percentile', 'stdev'])
const SUPPORTED_OPS = ['where', 'filter', 'take', 'limit', 'project', 'project-away', 'project-rename', 'extend', 'distinct', 'count', 'summarize', 'sort', 'order', 'top', 'join', 'union', 'parse', 'search', 'getschema', 'render', 'mv-expand']

class Parser {
  i = 0
  constructor(public toks: Tok[], public src: string, public tabularNames: Set<string>) {}
  peek(o = 0) { return this.toks[Math.min(this.i + o, this.toks.length - 1)] }
  next() { return this.toks[this.i++] }
  isOp(v: string, o = 0) { const t = this.peek(o); return t.t === 'op' && t.v === v }
  isId(v?: string, o = 0) { const t = this.peek(o); return t.t === 'id' && (v === undefined || t.v === v) }
  expectOp(v: string, ctx?: string) {
    const t = this.next()
    if (t.t !== 'op' || t.v !== v) {
      let hint: string | undefined
      if (v === ')' ) hint = 'Check that every "(" has a matching ")".'
      throw new KqlError(`Expected "${v}"${ctx ? ' ' + ctx : ''} but found "${t.v || 'end of query'}".`, hint, t.pos)
    }
    return t
  }
  ident(ctx: string): Tok {
    const t = this.next()
    if (t.t !== 'id') throw new KqlError(`Expected a name ${ctx} but found "${t.v || 'end of query'}".`, undefined, t.pos)
    return t
  }
  text(from: number, to: number) { return this.src.slice(from, to).trim() }

  program(): Stmt[] {
    const out: Stmt[] = []
    while (this.peek().t !== 'eof') {
      if (this.isOp(';')) { this.next(); continue }
      if (this.isId('let')) {
        this.next()
        const name = this.ident('after let').v
        this.expectOp('=', `after "let ${name}"`)
        const t = this.peek()
        const tabular = (t.t === 'id' && (this.tabularNames.has(t.v) || t.v === 'union' || (this.peek(1).t === 'op' && this.peek(1).v === '|'))) || (this.isOp('(') && this.looksTabularParen())
        if (tabular) {
          const q = this.query()
          out.push({ kind: 'let', name, tab: q })
          this.tabularNames.add(name)
        } else {
          out.push({ kind: 'let', name, e: this.expr() })
        }
        if (this.isOp(';')) this.next()
        else if (this.peek().t !== 'eof') throw new KqlError(`Missing ";" after the let statement for "${name}".`, 'Every let statement must end with a semicolon, e.g. let threshold = 10;', this.peek().pos)
        continue
      }
      out.push({ kind: 'query', q: this.query() })
      if (this.isOp(';')) this.next()
      else if (this.peek().t !== 'eof') {
        const t = this.peek()
        throw new KqlError(`Unexpected "${t.v}".`, t.t === 'id' ? `Did you forget a pipe "|" before "${t.v}"?` : undefined, t.pos)
      }
    }
    return out
  }
  looksTabularParen() {
    // (Table | ...) at let position
    const t = this.peek(1)
    return t.t === 'id' && (this.tabularNames.has(t.v))
  }

  query(): Query {
    const startPos = this.peek().pos
    let src: Source
    const t = this.peek()
    if (this.isOp('(')) {
      this.next(); const q = this.query(); this.expectOp(')', 'to close the sub-query'); src = { s: 'sub', q }
    } else if (t.t === 'id' && t.v === 'union') {
      this.next(); src = { s: 'union', parts: this.unionParts() }
    } else if (t.t === 'id' && t.v === 'print') {
      this.next(); src = { s: 'print', items: this.assignList('print') }
    } else if (t.t === 'id' && t.v === 'search') {
      this.next(); const s = this.next()
      if (s.t !== 'str') throw new KqlError('search needs a quoted term, e.g. search "powershell"', undefined, s.pos)
      src = { s: 'search', term: s.v }
    } else if (t.t === 'id') {
      this.next()
      const upper = t.v.toUpperCase()
      if (upper === 'SELECT') throw new KqlError('KQL is not SQL.', 'KQL starts with the table name and flows left-to-right through pipes: SigninLogs | where ResultType != 0 | project UserPrincipalName', t.pos)
      src = { s: 'table', name: t.v, pos: t.pos }
    } else {
      throw new KqlError(`A query must start with a table name, but found "${t.v || 'nothing'}".`, 'Try starting with a table such as SigninLogs or DeviceProcessEvents.', t.pos)
    }
    const srcText = this.text(startPos, this.toks[this.i - 1].end)
    const ops: Op[] = []
    while (this.isOp('|')) {
      this.next()
      ops.push(this.operator())
    }
    return { src, ops, srcText }
  }

  unionParts(): Query[] {
    const parts: Query[] = []
    // skip options like kind=outer withsource=X
    while (this.isId() && this.isOp('=', 1)) { this.next(); this.next(); this.next() }
    do {
      if (this.isOp('(')) { this.next(); parts.push(this.query()); this.expectOp(')') }
      else { const t = this.ident('in union'); parts.push({ src: { s: 'table', name: t.v, pos: t.pos }, ops: [], srcText: t.v }) }
    } while (this.isOp(',') && this.next())
    return parts
  }

  operator(): Op {
    const t = this.next()
    const start = t.pos
    if (t.t !== 'id') throw new KqlError(`Expected an operator after "|" but found "${t.v || 'end of query'}".`, 'Examples: | where ..., | project ..., | summarize ...', t.pos)
    const name = t.v
    const done = <T extends Op>(o: Omit<T, 'text'>): T => ({ ...o, text: this.text(start, this.toks[this.i - 1].end) } as T)
    switch (name) {
      case 'where': case 'filter': {
        const e = this.expr()
        return done({ op: 'where', e })
      }
      case 'take': case 'limit': {
        const n = this.next()
        if (n.t !== 'num') throw new KqlError(`${name} needs a number, e.g. | ${name} 10`, undefined, n.pos)
        return done({ op: 'take', n: n.num! })
      }
      case 'project': return done({ op: 'project', items: this.assignList('project') })
      case 'extend': return done({ op: 'extend', items: this.assignList('extend') })
      case 'project-away': {
        const cols = this.nameList(); return done({ op: 'project-away', cols })
      }
      case 'project-rename': {
        const pairs: [string, string][] = []
        do {
          const a = this.ident('in project-rename').v; this.expectOp('='); const b = this.ident('in project-rename').v; pairs.push([a, b])
        } while (this.isOp(',') && this.next())
        return done({ op: 'project-rename', pairs })
      }
      case 'distinct': {
        if (this.isOp('*')) { this.next(); return done({ op: 'distinct', cols: ['*'] }) }
        return done({ op: 'distinct', cols: this.nameList() })
      }
      case 'count': return done({ op: 'count' })
      case 'summarize': {
        const aggs: Assign[] = []
        if (!this.isId('by')) {
          do { aggs.push(this.assign()) } while (this.isOp(',') && this.next())
        }
        let by: Assign[] = []
        if (this.isId('by')) { this.next(); by = this.assignList('summarize by') }
        if (aggs.length === 0 && by.length === 0) throw new KqlError('summarize needs an aggregation and/or a by clause.', 'Example: | summarize count() by UserPrincipalName', t.pos)
        return done({ op: 'summarize', aggs, by })
      }
      case 'sort': case 'order': {
        if (!this.isId('by')) throw new KqlError(`${name} must be followed by "by".`, `Example: | ${name} by TimeGenerated desc`, this.peek().pos)
        this.next()
        const keys: { e: Expr; desc: boolean; label: string }[] = []
        do {
          const p0 = this.peek().pos
          const e = this.expr()
          const label = this.text(p0, this.toks[this.i - 1].end)
          let desc = true
          if (this.isId('asc')) { this.next(); desc = false } else if (this.isId('desc')) { this.next() }
          if (this.isId('nulls')) { this.next(); this.next() }
          keys.push({ e, desc, label })
        } while (this.isOp(',') && this.next())
        return done({ op: 'sort', keys })
      }
      case 'top': {
        const n = this.next()
        if (n.t !== 'num') throw new KqlError('top needs a number, e.g. | top 10 by Count', undefined, n.pos)
        if (!this.isId('by')) throw new KqlError('top needs "by", e.g. | top 10 by Count desc', undefined, this.peek().pos)
        this.next()
        const p0 = this.peek().pos
        const e = this.expr()
        const label = this.text(p0, this.toks[this.i - 1].end)
        let desc = true
        if (this.isId('asc')) { this.next(); desc = false } else if (this.isId('desc')) this.next()
        return done({ op: 'top', n: n.num!, e, desc, label })
      }
      case 'join': {
        let kind = 'innerunique'
        while (this.isId() && this.isOp('=', 1)) {
          const k = this.next().v; this.next(); const v = this.next().v
          if (k === 'kind') kind = v
        }
        let right: Query
        if (this.isOp('(')) { this.next(); right = this.query(); this.expectOp(')', 'to close the join sub-query') }
        else { const r = this.ident('as the right side of join'); right = { src: { s: 'table', name: r.v, pos: r.pos }, ops: [], srcText: r.v } }
        if (!this.isId('on')) throw new KqlError('join needs an "on" clause.', 'Example: | join kind=inner (DeviceNetworkEvents) on DeviceName', this.peek().pos)
        this.next()
        const on: { l: string; r: string }[] = []
        do {
          if (this.isOp('$') || this.isId('$left') || this.isId('$right')) {
            const a = this.sideRef(); this.expectOp('==', 'in join condition'); const b = this.sideRef()
            const l = a.side === 'left' ? a.name : b.name
            const r = a.side === 'left' ? b.name : a.name
            on.push({ l, r })
          } else {
            const c = this.ident('in join on clause').v; on.push({ l: c, r: c })
          }
        } while (this.isOp(',') && this.next())
        return done({ op: 'join', kind, right, on })
      }
      case 'union': return done({ op: 'union', sources: this.unionParts() })
      case 'parse': {
        while (this.isId('kind') || this.isId('flags')) { this.next(); this.expectOp('='); this.next() }
        const e = this.postfix()
        if (!this.isId('with')) throw new KqlError('parse needs "with", e.g. | parse Msg with * "user=" User " " *', undefined, this.peek().pos)
        this.next()
        const pattern: ({ lit: string } | { name: string; type?: string } | { star: true })[] = []
        while (!this.isOp('|') && !this.isOp(';') && this.peek().t !== 'eof' && !this.isOp(')')) {
          const p = this.next()
          if (p.t === 'str') pattern.push({ lit: p.v })
          else if (p.t === 'op' && p.v === '*') pattern.push({ star: true })
          else if (p.t === 'id') {
            let type: string | undefined
            if (this.isOp(':')) { this.next(); type = this.ident('as a type').v }
            pattern.push({ name: p.v, type })
          } else throw new KqlError(`Unexpected "${p.v}" in parse pattern.`, undefined, p.pos)
        }
        return done({ op: 'parse', e, pattern })
      }
      case 'search': {
        const s = this.next()
        if (s.t !== 'str') throw new KqlError('search needs a quoted term, e.g. | search "mimikatz"', undefined, s.pos)
        return done({ op: 'search', term: s.v })
      }
      case 'getschema': return done({ op: 'getschema' })
      case 'render': {
        while (!this.isOp('|') && !this.isOp(';') && this.peek().t !== 'eof') this.next()
        return done({ op: 'render' })
      }
      case 'mv-expand': {
        const c = this.ident('after mv-expand').v
        return done({ op: 'mv-expand', col: c })
      }
      default: {
        const lower = name.toLowerCase()
        if (SUPPORTED_OPS.includes(lower) && lower !== name) throw new KqlError(`Unknown operator "${name}".`, `KQL operators are lower-case: use "${lower}".`, t.pos)
        if (['select', 'group', 'having', 'from'].includes(lower)) throw new KqlError(`"${name}" is SQL, not KQL.`, 'KQL equivalents: select → project, group by → summarize ... by, having → where after summarize.', t.pos)
        throw new KqlError(`Operator "${name}" is not supported in this simulator.`, `Supported: ${SUPPORTED_OPS.filter(o => o !== 'filter' && o !== 'limit' && o !== 'order').join(', ')}. Real KQL has many more — see the official docs.`, t.pos)
      }
    }
  }

  sideRef(): { side: 'left' | 'right'; name: string } {
    const t = this.next()
    let side: string
    if (t.t === 'op' && t.v === '$') side = this.ident('after $').v
    else side = t.v.replace('$', '')
    if (side !== 'left' && side !== 'right') throw new KqlError('Use $left.Column == $right.Column in join conditions.', undefined, t.pos)
    this.expectOp('.')
    return { side: side as 'left' | 'right', name: this.ident('after $' + side + '.').v }
  }

  nameList(): string[] {
    const out: string[] = []
    do { out.push(this.ident('(column name)').v) } while (this.isOp(',') && this.next())
    return out
  }
  assignList(ctx: string): Assign[] {
    const out: Assign[] = []
    do { out.push(this.assign()) } while (this.isOp(',') && this.next())
    if (out.length === 0) throw new KqlError(`${ctx} needs at least one column.`)
    return out
  }
  assign(): Assign {
    const p0 = this.peek().pos
    if (this.isId() && this.isOp('=', 1)) {
      const name = this.next().v; this.next()
      const e = this.expr()
      return { name, e, text: this.text(p0, this.toks[this.i - 1].end) }
    }
    if (this.isOp('(') ) {
      // (a, b) = arg_max(...) style isn't supported; fall through to expression
    }
    const e = this.expr()
    return { e, text: this.text(p0, this.toks[this.i - 1].end) }
  }

  /* ---- expressions ---- */
  expr(): Expr { return this.orExpr() }
  orExpr(): Expr {
    let l = this.andExpr()
    while (this.isId('or') || this.isOp('||')) {
      const t = this.next()
      if (t.v === '||') throw new KqlError('Use "or" instead of "||".', 'KQL logical operators are the words and / or / not().', t.pos)
      l = { k: 'bin', op: 'or', l, r: this.andExpr(), pos: t.pos }
    }
    return l
  }
  andExpr(): Expr {
    let l = this.cmpExpr()
    while (this.isId('and') || this.isOp('&&')) {
      const t = this.next()
      if (t.v === '&&') throw new KqlError('Use "and" instead of "&&".', 'KQL logical operators are the words and / or / not().', t.pos)
      l = { k: 'bin', op: 'and', l, r: this.cmpExpr(), pos: t.pos }
    }
    return l
  }
  cmpExpr(): Expr {
    const l = this.addExpr()
    const t = this.peek()
    const cmpOps = ['==', '!=', '=~', '!~', '<', '>', '<=', '>=', '<>']
    if (t.t === 'op' && cmpOps.includes(t.v)) {
      this.next()
      if (t.v === '<>') throw new KqlError('Use != for "not equal" in KQL.', undefined, t.pos)
      return { k: 'bin', op: t.v, l, r: this.addExpr(), pos: t.pos }
    }
    if (t.t === 'op' && t.v === '=') {
      throw new KqlError('A single "=" is assignment, not comparison.', 'Use == to compare (case-sensitive) or =~ for case-insensitive equality. Example: | where ActionType == "LogonFailed"', t.pos)
    }
    const word = t.v
    const strOps = ['contains', 'contains_cs', 'has', 'has_cs', 'startswith', 'startswith_cs', 'endswith', 'endswith_cs', 'matches', 'hasprefix', 'hassuffix',
      '!contains', '!contains_cs', '!has', '!has_cs', '!startswith', '!startswith_cs', '!endswith', '!endswith_cs', '!hasprefix', '!hassuffix']
    if ((t.t === 'id' || t.t === 'op') && strOps.includes(word)) {
      this.next()
      if (word === 'matches') { if (!this.isId('regex')) throw new KqlError('Use "matches regex".', undefined, this.peek().pos); this.next() }
      return { k: 'bin', op: word === 'matches' ? 'matches regex' : word, l, r: this.addExpr(), pos: t.pos }
    }
    if ((t.t === 'id' || t.t === 'op') && ['in', 'in~', '!in', '!in~', 'has_any', 'has_all', '!has_any'].includes(word)) {
      this.next()
      this.expectOp('(', `after "${word}"`)
      const items: (Expr | { k: 'tab'; q: Query })[] = []
      if (!this.isOp(')')) {
        do {
          const p = this.peek()
          if (p.t === 'id' && this.tabularNames.has(p.v) && (this.isOp(')', 1) || this.isOp(',', 1) || this.isOp('|', 1))) {
            if (this.isOp('|', 1)) items.push({ k: 'tab', q: this.query() })
            else { this.next(); items.push({ k: 'tab', q: { src: { s: 'table', name: p.v, pos: p.pos }, ops: [], srcText: p.v } }) }
          } else if (this.isOp('(') && this.peek(1).t === 'id' && this.tabularNames.has(this.peek(1).v)) {
            this.next(); items.push({ k: 'tab', q: this.query() }); this.expectOp(')')
          } else items.push(this.expr())
        } while (this.isOp(',') && this.next())
      }
      this.expectOp(')', `to close the ${word} list`)
      return { k: 'in', neg: word.startsWith('!'), ci: word.endsWith('~'), l, items, pos: t.pos, op: word.replace('!', '').replace('~', '') }
    }
    if ((t.t === 'id' || t.t === 'op') && (word === 'between' || word === '!between')) {
      this.next()
      this.expectOp('(', 'after between')
      const lo = this.addExpr()
      this.expectOp('..', 'inside between (use: between (low .. high))')
      const hi = this.addExpr()
      this.expectOp(')', 'to close between')
      return { k: 'between', neg: word.startsWith('!'), l, lo, hi, pos: t.pos }
    }
    return l
  }
  addExpr(): Expr {
    let l = this.mulExpr()
    while (this.isOp('+') || this.isOp('-')) { const t = this.next(); l = { k: 'bin', op: t.v, l, r: this.mulExpr(), pos: t.pos } }
    return l
  }
  mulExpr(): Expr {
    let l = this.unary()
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) { const t = this.next(); l = { k: 'bin', op: t.v, l, r: this.unary(), pos: t.pos } }
    return l
  }
  unary(): Expr {
    if (this.isOp('-')) { const t = this.next(); return { k: 'un', op: '-', e: this.unary(), pos: t.pos } }
    if (this.isOp('!')) { const t = this.next(); throw new KqlError('Use not(...) to negate an expression in KQL.', 'Example: | where not(AccountName in ("system", "local service"))', t.pos) }
    return this.postfix()
  }
  postfix(): Expr {
    let e = this.primary()
    for (;;) {
      if (this.isOp('.') && this.peek(1).t === 'id') { const t = this.next(); e = { k: 'member', e, key: this.next().v, pos: t.pos }; continue }
      if (this.isOp('[')) { const t = this.next(); const key = this.expr(); this.expectOp(']'); e = { k: 'member', e, key, pos: t.pos }; continue }
      break
    }
    return e
  }
  primary(): Expr {
    const t = this.next()
    switch (t.t) {
      case 'num': return { k: 'lit', v: t.num!, pos: t.pos }
      case 'str': return { k: 'lit', v: t.v, pos: t.pos }
      case 'span': return { k: 'lit', v: new Timespan(t.num!), pos: t.pos }
      case 'dt': {
        const [kind, raw] = [t.v.slice(0, t.v.indexOf(':')), t.v.slice(t.v.indexOf(':') + 1)]
        if (kind === 'datetime') return raw === '' || raw === 'null' ? { k: 'lit', v: null, pos: t.pos } : { k: 'lit', v: parseDateLiteral(raw), pos: t.pos }
        return { k: 'lit', v: parseSpanLiteral(raw), pos: t.pos }
      }
      case 'op': {
        if (t.v === '(') { const e = this.expr(); this.expectOp(')'); return e }
        if (t.v === '[') {
          const items: Expr[] = []
          if (!this.isOp(']')) do { items.push(this.expr()) } while (this.isOp(',') && this.next())
          this.expectOp(']'); return { k: 'arr', items, pos: t.pos }
        }
        if (t.v === '$') { this.i--; const s = this.sideRef(); return { k: 'side', side: s.side, name: s.name, pos: t.pos } }
        throw new KqlError(`Unexpected "${t.v}" in expression.`, undefined, t.pos)
      }
      case 'id': {
        if (t.v === 'true' || t.v === 'false') return { k: 'lit', v: t.v === 'true', pos: t.pos }
        if (t.v === 'null') return { k: 'lit', v: null, pos: t.pos }
        if (this.isOp('(')) {
          this.next()
          const args: Expr[] = []
          let star = false
          if (!this.isOp(')')) {
            do {
              if (this.isOp('*')) { this.next(); star = true; continue }
              args.push(this.expr())
            } while (this.isOp(',') && this.next())
          }
          this.expectOp(')', `to close ${t.v}(`)
          return { k: 'call', name: t.v, args, pos: t.pos, star }
        }
        return { k: 'col', name: t.v, pos: t.pos }
      }
      default:
        throw new KqlError('The query ended unexpectedly.', 'An operator or expression seems incomplete.', t.pos)
    }
  }
}

/* ------------------------------------------------------------- EVALUATOR */

type Fn = (row: Row) => Value
interface Ctx { catalog: Catalog; scalars: Map<string, Value>; tabs: Map<string, Table>; warnings: string[] }

function suggest(name: string, options: string[]): string | undefined {
  const lower = name.toLowerCase()
  const exactCi = options.find(o => o.toLowerCase() === lower)
  if (exactCi) return exactCi
  let best: string | undefined; let bestD = 3
  for (const o of options) {
    const d = lev(lower, o.toLowerCase())
    if (d < bestD) { bestD = d; best = o }
  }
  if (best) return best
  return options.find(o => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()))
}
function lev(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}

function argCount(name: string, args: Expr[], min: number, max = min, pos?: number) {
  if (args.length < min || args.length > max)
    throw new KqlError(`${name}() expects ${min === max ? min : `${min}–${max}`} argument(s) but got ${args.length}.`, undefined, pos)
}

class Compiler {
  constructor(public ctx: Ctx, public cols: Column[]) {}
  colNames() { return this.cols.map(c => c.name) }

  compile(e: Expr): Fn {
    switch (e.k) {
      case 'lit': { const v = e.v; return () => v }
      case 'arr': { const fs = e.items.map(x => this.compile(x)); return r => fs.map(f => f(r)) }
      case 'side': return this.compile({ k: 'col', name: e.name, pos: e.pos })
      case 'col': {
        const name = e.name
        if (this.cols.some(c => c.name === name)) return r => (r[name] === undefined ? null : r[name])
        if (this.ctx.scalars.has(name)) { const v = this.ctx.scalars.get(name)!; return () => v }
        const s = suggest(name, this.colNames())
        if (this.ctx.tabs.has(name)) throw new KqlError(`"${name}" is a table (from let), not a column.`, `To match against a list, use: | where Column in (${name})`, e.pos)
        throw new KqlError(`Unknown column "${name}".`, s ? (s.toLowerCase() === name.toLowerCase() ? `Column names are case-sensitive. Did you mean "${s}"?` : `Did you mean "${s}"? Available columns: ${this.colNames().slice(0, 12).join(', ')}${this.cols.length > 12 ? ', …' : ''}`) : `Available columns: ${this.colNames().slice(0, 14).join(', ')}${this.cols.length > 14 ? ', …' : ''}`, e.pos)
      }
      case 'member': {
        const base = this.compile(e.e)
        const key = typeof e.key === 'string' ? (() => e.key as string) : this.compile(e.key)
        return r => {
          let b = base(r)
          if (typeof b === 'string') { try { b = JSON.parse(b) } catch { return null } }
          if (b === null || typeof b !== 'object') return null
          const k = key(r)
          if (Array.isArray(b)) { const idx = toNum(k); return idx === null ? null : (b[idx < 0 ? b.length + idx : idx] ?? null) }
          return (b as Record<string, Value>)[String(k)] ?? null
        }
      }
      case 'un': { const f = this.compile(e.e); return r => { const v = toNum(f(r)); return v === null ? null : -v } }
      case 'between': {
        const l = this.compile(e.l), lo = this.compile(e.lo), hi = this.compile(e.hi)
        return r => { const v = l(r); if (v === null) return false; const res = compare(v, lo(r)) >= 0 && compare(v, hi(r)) <= 0; return e.neg ? !res : res }
      }
      case 'in': {
        const l = this.compile(e.l)
        const getters: ((r: Row) => Value[])[] = e.items.map(it => {
          if ((it as { k: string }).k === 'tab') {
            const t = runQuery((it as { q: Query }).q, this.ctx)
            const c = t.columns[0]?.name
            const vals = c ? t.rows.map(row => row[c]) : []
            return () => vals
          }
          const f = this.compile(it as Expr)
          return (r: Row) => { const v = f(r); return Array.isArray(v) ? v : [v] }
        })
        return r => {
          const v = l(r)
          const list = getters.flatMap(g => g(r))
          let hit: boolean
          if (e.op === 'in') {
            hit = e.ci ? list.some(x => x !== null && v !== null && toStr(x).toLowerCase() === toStr(v).toLowerCase()) : list.some(x => eq(v, x))
          } else if (e.op === 'has_any') {
            hit = list.some(x => hasTerm(toStr(v), toStr(x)))
          } else { // has_all
            hit = list.every(x => hasTerm(toStr(v), toStr(x)))
          }
          return e.neg ? !hit : hit
        }
      }
      case 'bin': return this.compileBin(e)
      case 'call': return this.compileCall(e)
    }
  }

  compileBin(e: Extract<Expr, { k: 'bin' }>): Fn {
    const l = this.compile(e.l), r = this.compile(e.r)
    const op = e.op
    switch (op) {
      case 'and': return row => truthy(l(row)) && truthy(r(row))
      case 'or': return row => truthy(l(row)) || truthy(r(row))
      case '==': return row => eq(l(row), r(row))
      case '!=': return row => { const a = l(row), b = r(row); return a !== null && b !== null && !eq(a, b) }
      case '=~': return row => { const a = l(row), b = r(row); return a !== null && b !== null && toStr(a).toLowerCase() === toStr(b).toLowerCase() }
      case '!~': return row => { const a = l(row), b = r(row); return a !== null && b !== null && toStr(a).toLowerCase() !== toStr(b).toLowerCase() }
      case '<': return row => { const a = l(row), b = r(row); return a !== null && b !== null && compare(a, b) < 0 }
      case '>': return row => { const a = l(row), b = r(row); return a !== null && b !== null && compare(a, b) > 0 }
      case '<=': return row => { const a = l(row), b = r(row); return a !== null && b !== null && compare(a, b) <= 0 }
      case '>=': return row => { const a = l(row), b = r(row); return a !== null && b !== null && compare(a, b) >= 0 }
      case '+': case '-': case '*': case '/': case '%':
        return row => arith(op, l(row), r(row))
      case 'matches regex': {
        let re: RegExp | null = null
        return row => {
          const a = l(row); if (a === null) return false
          if (!re) { try { re = new RegExp(toStr(r(row))) } catch { throw new KqlError('Invalid regular expression in "matches regex".') } }
          return re.test(toStr(a))
        }
      }
    }
    const neg = op.startsWith('!')
    const base = op.replace('!', '')
    const cs = base.endsWith('_cs')
    const kind = base.replace('_cs', '')
    return row => {
      const a = l(row), b = r(row)
      if (a === null || b === null) return neg
      let hay = toStr(a), nee = toStr(b)
      if (!cs) { hay = hay.toLowerCase(); nee = nee.toLowerCase() }
      let res: boolean
      switch (kind) {
        case 'contains': res = hay.includes(nee); break
        case 'has': res = cs ? (hasTerm(hay, nee) && hay.includes(nee)) : hasTerm(hay, nee); break
        case 'startswith': res = hay.startsWith(nee); break
        case 'endswith': res = hay.endsWith(nee); break
        case 'hasprefix': res = terms(hay).some(t => t.startsWith(nee)); break
        case 'hassuffix': res = terms(hay).some(t => t.endsWith(nee)); break
        default: res = false
      }
      return neg ? !res : res
    }
  }

  compileCall(e: Extract<Expr, { k: 'call' }>): Fn {
    const name = e.name
    const a = e.args.map(x => this.compile(x))
    const now = this.ctx.catalog.now
    const need = (min: number, max = min) => argCount(name, e.args, min, max, e.pos)
    if (AGGS.has(name) && name !== 'count') {
      throw new KqlError(`${name}() is an aggregation function and can only be used inside summarize.`, `Example: | summarize ${name}(${e.args.length ? '...' : ''}) by SomeColumn`, e.pos)
    }
    switch (name) {
      case 'ago': need(1); return r => { const s = a[0](r); if (!isSpan(s)) throw new KqlError('ago() needs a timespan such as 1h, 7d, 30m.', undefined, e.pos); return new Date(now.getTime() - s.ms) }
      case 'now': need(0, 1); return r => (a[0] ? new Date(now.getTime() + ((a[0](r) as Timespan)?.ms ?? 0)) : now)
      case 'todatetime': need(1); return r => { const v = a[0](r); if (v === null) return null; if (isDate(v)) return v; try { return parseDateLiteral(toStr(v)) } catch { return null } }
      case 'totimespan': need(1); return r => { const v = a[0](r); if (isSpan(v)) return v; try { return parseSpanLiteral(toStr(v)) } catch { return null } }
      case 'bin': case 'floor': need(2); return r => {
        const v = a[0](r), s = a[1](r)
        if (v === null) return null
        if (isDate(v)) { const ms = isSpan(s) ? s.ms : toNum(s)!; return new Date(Math.floor(v.getTime() / ms) * ms) }
        if (isSpan(v)) { const ms = isSpan(s) ? s.ms : toNum(s)!; return new Timespan(Math.floor(v.ms / ms) * ms) }
        const n = toNum(v)!, size = toNum(s)!; return Math.floor(n / size) * size
      }
      case 'startofday': need(1); return r => { const v = a[0](r); if (!isDate(v)) return null; const d = new Date(v); d.setUTCHours(0, 0, 0, 0); return d }
      case 'endofday': need(1); return r => { const v = a[0](r); if (!isDate(v)) return null; const d = new Date(v); d.setUTCHours(23, 59, 59, 999); return d }
      case 'startofweek': need(1); return r => { const v = a[0](r); if (!isDate(v)) return null; const d = new Date(v); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d }
      case 'hourofday': need(1); return r => { const v = a[0](r); return isDate(v) ? v.getUTCHours() : null }
      case 'dayofweek': need(1); return r => { const v = a[0](r); return isDate(v) ? new Timespan(v.getUTCDay() * 86400000) : null }
      case 'datetime_diff': need(3); return r => {
        const unit = toStr(a[0](r)).toLowerCase(); const x = a[1](r), y = a[2](r)
        if (!isDate(x) || !isDate(y)) return null
        const div: Record<string, number> = { second: 1000, minute: 60000, hour: 3600000, day: 86400000 }
        return Math.trunc((x.getTime() - y.getTime()) / (div[unit] ?? 1000))
      }
      case 'format_datetime': need(2); return r => { const v = a[0](r); return isDate(v) ? fmtDate(v).replace('T', ' ').replace('Z', '') : null }
      case 'tolower': need(1); return r => { const v = a[0](r); return v === null ? null : toStr(v).toLowerCase() }
      case 'toupper': need(1); return r => { const v = a[0](r); return v === null ? null : toStr(v).toUpperCase() }
      case 'strlen': need(1); return r => { const v = a[0](r); return v === null ? null : toStr(v).length }
      case 'tostring': need(1); return r => { const v = a[0](r); return v === null ? '' : toStr(v) }
      case 'toint': case 'tolong': need(1); return r => { const v = toNum(a[0](r)); return v === null ? null : Math.trunc(v) }
      case 'toreal': case 'todouble': case 'todecimal': need(1); return r => toNum(a[0](r))
      case 'tobool': need(1); return r => { const v = a[0](r); return v === null ? null : ['true', '1'].includes(toStr(v).toLowerCase()) }
      case 'substring': need(2, 3); return r => { const s = toStr(a[0](r)); const st = toNum(a[1](r)) ?? 0; const len = a[2] ? toNum(a[2](r)) ?? undefined : undefined; return len === undefined ? s.substring(st) : s.substr(st, len) }
      case 'strcat': return r => a.map(f => toStr(f(r))).join('')
      case 'strcat_delim': return r => a.slice(1).map(f => toStr(f(r))).join(toStr(a[0](r)))
      case 'split': need(2, 3); return r => { const parts = toStr(a[0](r)).split(toStr(a[1](r))); if (a[2]) { const ix = toNum(a[2](r)) ?? 0; return parts[ix] !== undefined ? [parts[ix]] : [] } return parts }
      case 'replace_string': need(3); return r => toStr(a[0](r)).split(toStr(a[1](r))).join(toStr(a[2](r)))
      case 'trim': need(2); return r => { const re = new RegExp(`^(?:${toStr(a[0](r))})+|(?:${toStr(a[0](r))})+$`, 'g'); return toStr(a[1](r)).replace(re, '') }
      case 'indexof': need(2); return r => toStr(a[0](r)).indexOf(toStr(a[1](r)))
      case 'reverse': need(1); return r => toStr(a[0](r)).split('').reverse().join('')
      case 'extract': need(3, 4); return r => {
        let re: RegExp
        try { re = new RegExp(toStr(a[0](r))) } catch { throw new KqlError('Invalid regular expression in extract().', undefined, e.pos) }
        const m = toStr(a[2](r)).match(re); const g = toNum(a[1](r)) ?? 0
        return m ? (m[g] ?? null) : null
      }
      case 'countof': need(2); return r => { const s = toStr(a[0](r)), sub = toStr(a[1](r)); return sub ? s.split(sub).length - 1 : 0 }
      case 'base64_decode_tostring': need(1); return r => {
        const v = a[0](r); if (v === null) return null
        try {
          const bin = atob(toStr(v).trim())
          return bin.replace(/\0/g, '')
        } catch { return null }
      }
      case 'parse_json': case 'todynamic': case 'parse_xml': need(1); return r => { const v = a[0](r); if (typeof v !== 'string') return v; try { return JSON.parse(v) } catch { return v } }
      case 'dynamic': need(1); return r => a[0](r)
      case 'pack_array': return r => a.map(f => f(r))
      case 'array_length': need(1); return r => { const v = a[0](r); return Array.isArray(v) ? v.length : null }
      case 'set_has_element': need(2); return r => { const v = a[0](r); return Array.isArray(v) ? v.some(x => eq(x, a[1](r))) : false }
      case 'isempty': need(1); return r => { const v = a[0](r); return v === null || v === '' }
      case 'isnotempty': need(1); return r => { const v = a[0](r); return !(v === null || v === '') }
      case 'isnull': need(1); return r => a[0](r) === null
      case 'isnotnull': need(1); return r => a[0](r) !== null
      case 'iff': case 'iif': need(3); return r => (truthy(a[0](r)) ? a[1](r) : a[2](r))
      case 'case': {
        if (a.length < 3 || a.length % 2 === 0) throw new KqlError('case() needs pairs of (condition, value) and a final default value.', 'Example: case(Count > 50, "High", Count > 10, "Medium", "Low")', e.pos)
        return r => { for (let k = 0; k + 1 < a.length; k += 2) if (truthy(a[k](r))) return a[k + 1](r); return a[a.length - 1](r) }
      }
      case 'coalesce': return r => { for (const f of a) { const v = f(r); if (v !== null && v !== '') return v } return null }
      case 'not': need(1); return r => !truthy(a[0](r))
      case 'round': need(1, 2); return r => { const v = toNum(a[0](r)); if (v === null) return null; const p = a[1] ? toNum(a[1](r)) ?? 0 : 0; const m = 10 ** p; return Math.round(v * m) / m }
      case 'abs': need(1); return r => { const v = toNum(a[0](r)); return v === null ? null : Math.abs(v) }
      case 'max_of': return r => a.map(f => f(r)).reduce((x, y) => (compare(x, y) >= 0 ? x : y))
      case 'min_of': return r => a.map(f => f(r)).reduce((x, y) => (compare(x, y) <= 0 ? x : y))
      case 'ipv4_is_private': need(1); return r => {
        const ip = toStr(a[0](r)); const p = ip.split('.').map(Number)
        if (p.length !== 4 || p.some(isNaN)) return null
        return p[0] === 10 || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168)
      }
      case 'ipv4_is_in_range': need(2); return r => {
        const ip = toStr(a[0](r)); const [net, bits] = toStr(a[1](r)).split('/')
        const toInt = (s: string) => s.split('.').reduce((acc, o) => (acc << 8) + (+o), 0) >>> 0
        const b = bits === undefined ? 32 : +bits
        const mask = b === 0 ? 0 : (~0 << (32 - b)) >>> 0
        return ((toInt(ip) & mask) >>> 0) === ((toInt(net) & mask) >>> 0)
      }
      case 'hash_sha256': need(1); return r => 'sha256:' + toStr(a[0](r))
      case 'count':
        throw new KqlError('count() is an aggregation and only works inside summarize.', 'Use | count to count rows, or | summarize count() by Column to count per group.', e.pos)
    }
    const known = ['ago', 'now', 'bin', 'tolower', 'toupper', 'strlen', 'substring', 'strcat', 'split', 'extract', 'iff', 'case', 'isempty', 'isnotempty', 'tostring', 'toint', 'parse_json', 'base64_decode_tostring', 'ipv4_is_private', 'datetime_diff', 'hourofday', 'startofday', 'round', 'coalesce', 'not']
    const s = suggest(name, known)
    throw new KqlError(`Unknown function "${name}()".`, s ? `Did you mean ${s}()? (function names are case-sensitive and lower-case)` : 'This simulator supports common KQL functions such as ago, bin, tolower, strcat, extract, iff, case, parse_json and base64_decode_tostring.', e.pos)
  }
}

function arith(op: string, x: Value, y: Value): Value {
  if (x === null || y === null) return null
  if (op === '-' && isDate(x) && isDate(y)) return new Timespan(x.getTime() - y.getTime())
  if ((op === '+' || op === '-') && isDate(x) && isSpan(y)) return new Date(x.getTime() + (op === '+' ? y.ms : -y.ms))
  if (op === '+' && isSpan(x) && isDate(y)) return new Date(y.getTime() + x.ms)
  if (isSpan(x) && isSpan(y)) {
    if (op === '+') return new Timespan(x.ms + y.ms)
    if (op === '-') return new Timespan(x.ms - y.ms)
    if (op === '/') return x.ms / y.ms
  }
  if (isSpan(x) && typeof y === 'number') { if (op === '*') return new Timespan(x.ms * y); if (op === '/') return new Timespan(x.ms / y) }
  const a = toNum(x), b = toNum(y)
  if (a === null || b === null) return null
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return b === 0 ? null : (Number.isInteger(a) && Number.isInteger(b) && typeof x === 'number' && typeof y === 'number' && Number.isInteger(x) && Number.isInteger(y) ? Math.trunc(a / b) : a / b)
    case '%': return b === 0 ? null : a % b
  }
  return null
}

function exprLabel(a: Assign, idx: number, cols: Column[]): string {
  if (a.name) return a.name
  const e = a.e
  if (e.k === 'col') return e.name
  if (e.k === 'member' && typeof e.key === 'string') {
    // AdditionalFields.Foo -> AdditionalFields_Foo
    const base = e.e.k === 'col' ? e.e.name : 'Column'
    return `${base}_${e.key}`
  }
  let n = idx + 1
  let name = `Column${n}`
  while (cols.some(c => c.name === name)) name = `Column${++n}`
  return name
}

function aggDefaultName(call: Extract<Expr, { k: 'call' }>): string {
  const argName = call.args[0]?.k === 'col' ? (call.args[0] as { name: string }).name : ''
  switch (call.name) {
    case 'count': return 'count_'
    case 'countif': return 'countif_'
    case 'dcount': return `dcount_${argName}`
    case 'make_set': return `set_${argName}`
    case 'make_list': return `list_${argName}`
    case 'take_any': case 'any': return argName || 'any_'
    default: return `${call.name}_${argName}`
  }
}

function project(t: Table, items: Assign[], ctx: Ctx, keepExisting: boolean): Table {
  const comp = new Compiler(ctx, t.columns)
  const fns = items.map((a, i) => ({ name: exprLabel(a, i, t.columns), f: comp.compile(a.e), a }))
  const newCols: Column[] = keepExisting ? [...t.columns] : []
  const rows = t.rows.map(r => {
    const o: Row = keepExisting ? { ...r } : {}
    for (const { name, f } of fns) o[name] = f(r)
    return o
  })
  for (const { name, a } of fns) {
    const sample = rows.find(r => r[name] !== null && r[name] !== undefined)?.[name] ?? null
    const existing = a.e.k === 'col' ? t.columns.find(c => c.name === (a.e as { name: string }).name) : undefined
    const col: Column = { name, type: existing && !a.name ? existing.type : existing ? existing.type : inferType(sample) }
    const ix = newCols.findIndex(c => c.name === name)
    if (ix >= 0) newCols[ix] = col
    else newCols.push(col)
  }
  return { name: t.name, columns: newCols, rows }
}

function summarize(t: Table, op: Extract<Op, { op: 'summarize' }>, ctx: Ctx): Table {
  const comp = new Compiler(ctx, t.columns)
  const byFns = op.by.map((a, i) => ({ name: exprLabel(a, i, t.columns), f: comp.compile(a.e), a }))
  type AggSpec = { name: string; call: Extract<Expr, { k: 'call' }>; args: Fn[]; extraCols?: string[] }
  const aggs: AggSpec[] = op.aggs.map(a => {
    if (a.e.k !== 'call' || !AGGS.has(a.e.name)) {
      throw new KqlError(`"${a.text}" is not an aggregation.`, 'summarize expects aggregation functions such as count(), dcount(Col), make_set(Col), min(Col), max(Col), arg_max(TimeGenerated, *). Put grouping columns after "by".')
    }
    const call = a.e
    let extraCols: string[] | undefined
    if (call.name === 'arg_max' || call.name === 'arg_min') {
      if (call.star) extraCols = t.columns.map(c => c.name)
      else extraCols = call.args.slice(1).map(x => (x.k === 'col' ? x.name : ''))
      return { name: a.name ?? (call.args[0]?.k === 'col' ? call.args[0].name : 'arg'), call, args: [comp.compile(call.args[0])], extraCols }
    }
    return { name: a.name ?? aggDefaultName(call), call, args: call.args.map(x => comp.compile(x)) }
  })
  const groups = new Map<string, { key: Value[]; rows: Row[] }>()
  for (const r of t.rows) {
    const key = byFns.map(b => b.f(r))
    const k = key.map(keyOf).join('\u0001')
    let g = groups.get(k)
    if (!g) { g = { key, rows: [] }; groups.set(k, g) }
    g.rows.push(r)
  }
  if (byFns.length === 0 && groups.size === 0) groups.set('', { key: [], rows: [] })
  const outRows: Row[] = []
  for (const g of groups.values()) {
    const o: Row = {}
    byFns.forEach((b, i) => (o[b.name] = g.key[i]))
    for (const ag of aggs) {
      const vals = (k = 0) => g.rows.map(r => ag.args[k](r))
      switch (ag.call.name) {
        case 'count': o[ag.name] = g.rows.length; break
        case 'countif': o[ag.name] = vals().filter(truthy).length; break
        case 'dcount': o[ag.name] = new Set(vals().filter(v => v !== null && v !== '').map(keyOf)).size; break
        case 'dcountif': { const v = vals(), c = vals(1); o[ag.name] = new Set(v.filter((_, i) => truthy(c[i])).map(keyOf)).size; break }
        case 'sum': o[ag.name] = vals().reduce<number>((s, v) => s + (toNum(v) ?? 0), 0); break
        case 'sumif': { const v = vals(), c = vals(1); o[ag.name] = v.reduce<number>((s, x, i) => s + (truthy(c[i]) ? toNum(x) ?? 0 : 0), 0); break }
        case 'avg': { const v = vals().map(toNum).filter((x): x is number => x !== null); o[ag.name] = v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; break }
        case 'avgif': { const v = vals(), c = vals(1); const f = v.filter((_, i) => truthy(c[i])).map(toNum).filter((x): x is number => x !== null); o[ag.name] = f.length ? f.reduce((s, x) => s + x, 0) / f.length : null; break }
        case 'min': { const v = vals().filter(x => x !== null); o[ag.name] = v.length ? v.reduce((x, y) => (compare(x, y) <= 0 ? x : y)) : null; break }
        case 'max': { const v = vals().filter(x => x !== null); o[ag.name] = v.length ? v.reduce((x, y) => (compare(x, y) >= 0 ? x : y)) : null; break }
        case 'stdev': { const v = vals().map(toNum).filter((x): x is number => x !== null); const m = v.reduce((s, x) => s + x, 0) / (v.length || 1); o[ag.name] = v.length > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1)) : 0; break }
        case 'percentile': { const v = vals().map(toNum).filter((x): x is number => x !== null).sort((x, y) => x - y); const p = toNum(ag.args[1]?.({}) ?? 50) ?? 50; o[ag.name] = v.length ? v[Math.min(v.length - 1, Math.floor((p / 100) * v.length))] : null; break }
        case 'make_set': { const seen = new Map<string, Value>(); for (const v of vals()) { const arr = Array.isArray(v) ? v : [v]; for (const x of arr) if (x !== null && x !== '' && !seen.has(keyOf(x))) seen.set(keyOf(x), x) } o[ag.name] = [...seen.values()].slice(0, 1048576); break }
        case 'make_set_if': { const v = vals(), c = vals(1); const seen = new Map<string, Value>(); v.forEach((x, i) => { if (truthy(c[i]) && x !== null && !seen.has(keyOf(x))) seen.set(keyOf(x), x) }); o[ag.name] = [...seen.values()]; break }
        case 'make_list': o[ag.name] = vals().filter(x => x !== null); break
        case 'make_list_if': { const v = vals(), c = vals(1); o[ag.name] = v.filter((_, i) => truthy(c[i])); break }
        case 'take_any': case 'any': o[ag.name] = vals()[0] ?? null; break
        case 'arg_max': case 'arg_min': {
          let best: Row | null = null; let bestV: Value = null
          for (const r of g.rows) {
            const v = ag.args[0](r)
            if (v === null) continue
            if (best === null || (ag.call.name === 'arg_max' ? compare(v, bestV) > 0 : compare(v, bestV) < 0)) { best = r; bestV = v }
          }
          o[ag.name] = bestV
          for (const c of ag.extraCols ?? []) if (c && !(c in o)) o[c] = best ? best[c] ?? null : null
          break
        }
      }
    }
    outRows.push(o)
  }
  const cols: Column[] = []
  for (const b of byFns) {
    const src = b.a.e.k === 'col' ? t.columns.find(c => c.name === (b.a.e as { name: string }).name) : undefined
    cols.push({ name: b.name, type: src?.type ?? inferType(outRows.find(r => r[b.name] !== null)?.[b.name] ?? null) })
  }
  for (const ag of aggs) {
    cols.push({ name: ag.name, type: ['count', 'countif', 'dcount', 'dcountif'].includes(ag.call.name) ? 'int' : ['make_set', 'make_list', 'make_set_if', 'make_list_if'].includes(ag.call.name) ? 'dynamic' : inferType(outRows.find(r => r[ag.name] !== null)?.[ag.name] ?? null) })
    for (const c of ag.extraCols ?? []) if (c && !cols.some(x => x.name === c)) cols.push(t.columns.find(x => x.name === c) ?? { name: c, type: 'string' })
  }
  return { name: t.name, columns: cols, rows: outRows }
}

function sortRows(rows: Row[], keys: { f: Fn; desc: boolean }[]) {
  return [...rows].sort((x, y) => {
    for (const k of keys) {
      const a = k.f(x), b = k.f(y)
      // nulls last for desc, first for asc (KQL default)
      if (a === null && b !== null) return k.desc ? 1 : -1
      if (b === null && a !== null) return k.desc ? -1 : 1
      const c = compare(a, b)
      if (c !== 0) return k.desc ? -c : c
    }
    return 0
  })
}

function join(left: Table, right: Table, op: Extract<Op, { op: 'join' }>): Table {
  for (const k of op.on) {
    if (!left.columns.some(c => c.name === k.l)) throw new KqlError(`Join key "${k.l}" does not exist on the left side.`, `Left columns: ${left.columns.map(c => c.name).slice(0, 14).join(', ')}`)
    if (!right.columns.some(c => c.name === k.r)) throw new KqlError(`Join key "${k.r}" does not exist on the right side.`, `Right columns: ${right.columns.map(c => c.name).slice(0, 14).join(', ')}`)
  }
  const kind = op.kind
  const lk = (r: Row) => op.on.map(k => keyOf(r[k.l] ?? null)).join('\u0001')
  const rk = (r: Row) => op.on.map(k => keyOf(r[k.r] ?? null)).join('\u0001')
  let leftRows = left.rows
  if (kind === 'innerunique') {
    const seen = new Set<string>()
    leftRows = left.rows.filter(r => { const k = lk(r); if (seen.has(k)) return false; seen.add(k); return true })
  }
  const rIndex = new Map<string, Row[]>()
  for (const r of right.rows) { const k = rk(r); (rIndex.get(k) ?? rIndex.set(k, []).get(k)!).push(r) }
  if (kind === 'leftanti' || kind === 'anti' || kind === 'leftantisemi') return { ...left, rows: left.rows.filter(r => !rIndex.has(lk(r))) }
  if (kind === 'leftsemi') return { ...left, rows: left.rows.filter(r => rIndex.has(lk(r))) }
  const lIndex = new Map<string, Row[]>()
  for (const r of left.rows) { const k = lk(r); (lIndex.get(k) ?? lIndex.set(k, []).get(k)!).push(r) }
  if (kind === 'rightanti' || kind === 'rightantisemi') return { ...right, rows: right.rows.filter(r => !lIndex.has(rk(r))) }
  if (kind === 'rightsemi') return { ...right, rows: right.rows.filter(r => lIndex.has(rk(r))) }
  // column naming: right columns that collide get suffix 1
  const rename = new Map<string, string>()
  const cols: Column[] = [...left.columns]
  for (const c of right.columns) {
    let name = c.name
    if (cols.some(x => x.name === name)) { let n = 1; while (cols.some(x => x.name === `${c.name}${n}`)) n++; name = `${c.name}${n}` }
    rename.set(c.name, name)
    cols.push({ ...c, name })
  }
  const merge = (l: Row | null, r: Row | null): Row => {
    const o: Row = {}
    for (const c of left.columns) o[c.name] = l ? l[c.name] ?? null : null
    for (const c of right.columns) o[rename.get(c.name)!] = r ? r[c.name] ?? null : null
    return o
  }
  const rows: Row[] = []
  const matchedRight = new Set<Row>()
  for (const l of leftRows) {
    const matches = rIndex.get(lk(l))
    if (matches) for (const r of matches) { rows.push(merge(l, r)); matchedRight.add(r) }
    else if (kind === 'leftouter' || kind === 'fullouter') rows.push(merge(l, null))
  }
  if (kind === 'rightouter' || kind === 'fullouter') for (const r of right.rows) if (!matchedRight.has(r)) rows.push(merge(null, r))
  if (!['inner', 'innerunique', 'leftouter', 'rightouter', 'fullouter'].includes(kind))
    throw new KqlError(`Unsupported join kind "${kind}".`, 'Supported: innerunique (default), inner, leftouter, rightouter, fullouter, leftanti, rightanti, leftsemi, rightsemi.')
  return { name: left.name, columns: cols, rows }
}

function unionTables(tables: Table[]): Table {
  const cols: Column[] = []
  for (const t of tables) for (const c of t.columns) if (!cols.some(x => x.name === c.name)) cols.push(c)
  const rows: Row[] = []
  for (const t of tables) for (const r of t.rows) { const o: Row = {}; for (const c of cols) o[c.name] = r[c.name] ?? null; rows.push(o) }
  return { name: tables.map(t => t.name).join('+'), columns: cols, rows }
}

function resolveSource(q: Query, ctx: Ctx): Table {
  const s = q.src
  switch (s.s) {
    case 'table': {
      if (ctx.tabs.has(s.name)) return ctx.tabs.get(s.name)!
      const t = ctx.catalog.getTable(s.name)
      if (t) return t
      const names = [...ctx.catalog.tableNames(), ...ctx.tabs.keys()]
      const sg = suggest(s.name, names)
      if (ctx.scalars.has(s.name)) throw new KqlError(`"${s.name}" is a scalar value from let, not a table.`, undefined, s.pos)
      throw new KqlError(`Unknown table "${s.name}".`, sg ? (sg.toLowerCase() === s.name.toLowerCase() ? `Table names are case-sensitive. Did you mean "${sg}"?` : `Did you mean "${sg}"?`) : `Available tables: ${names.join(', ')}`, s.pos)
    }
    case 'sub': return runQuery(s.q, ctx)
    case 'union': return unionTables(s.parts.map(p => runQuery(p, ctx)))
    case 'print': {
      const one: Table = { name: 'print', columns: [], rows: [{}] }
      const items = s.items.map((a, i) => ({ ...a, name: a.name ?? `print_${i}` }))
      return project(one, items, ctx, false)
    }
    case 'search': {
      const parts: Table[] = []
      for (const name of ctx.catalog.tableNames()) {
        const t = ctx.catalog.getTable(name)!
        const rows = t.rows.filter(r => Object.values(r).some(v => v !== null && toStr(v).toLowerCase().includes(s.term.toLowerCase())))
        if (rows.length) parts.push({ name, columns: [{ name: '$table', type: 'string' }, ...t.columns], rows: rows.map(r => ({ $table: name, ...r })) })
      }
      return parts.length ? unionTables(parts) : { name: 'search', columns: [{ name: '$table', type: 'string' }], rows: [] }
    }
  }
}

function runQuery(q: Query, ctx: Ctx, stages?: Stage[]): Table {
  let t = resolveSource(q, ctx)
  if (stages) stages.push({ op: 'source', text: q.srcText, rowsIn: t.rows.length, rowsOut: t.rows.length, explain: describeSource(q, t) })
  for (const op of q.ops) {
    const before = t.rows.length
    t = applyOp(t, op, ctx)
    if (stages) stages.push({ op: op.op, text: op.text, rowsIn: before, rowsOut: t.rows.length, explain: describeOp(op, before, t.rows.length) })
  }
  return t
}

function describeSource(q: Query, t: Table): string {
  switch (q.src.s) {
    case 'table': return `Start with every row in ${q.src.name} (${t.rows.length} rows, ${t.columns.length} columns).`
    case 'union': return `Combine rows from several tables into one result (${t.rows.length} rows).`
    case 'print': return 'Evaluate expressions without reading any table (handy for testing functions).'
    case 'search': return `Search every table for "${q.src.term}" (${t.rows.length} matching rows).`
    default: return `Start from a sub-query (${t.rows.length} rows).`
  }
}
function describeOp(op: Op, before: number, after: number): string {
  const delta = `${before} → ${after} rows`
  switch (op.op) {
    case 'where': return `Keep only rows where the condition is true; everything else is discarded (${delta}).`
    case 'take': return `Return up to ${op.n} rows. Order is NOT guaranteed — take is for sampling, not "the first N" (${delta}).`
    case 'project': return `Keep only the listed columns${op.items.some(i => i.name) ? ' (and compute/rename some)' : ''}. Row count does not change.`
    case 'project-away': return `Remove the listed columns, keep the rest.`
    case 'project-rename': return `Rename columns without changing data.`
    case 'extend': return `Add calculated column(s) to every row: ${op.items.map(i => i.name ?? 'Column').join(', ')}.`
    case 'distinct': return `Collapse duplicate combinations of ${op.cols.join(', ')} into unique rows (${delta}).`
    case 'count': return `Replace the whole table with a single number: how many rows reached this point (${before}).`
    case 'summarize': return `Group rows${op.by.length ? ` by ${op.by.map(b => b.text).join(', ')}` : ''} and calculate ${op.aggs.map(a => a.text).join(', ') || 'unique groups'} for each group (${delta}).`
    case 'sort': return `Order rows by ${op.keys.map(k => `${k.label} ${k.desc ? 'descending' : 'ascending'}`).join(', ')}.`
    case 'top': return `Sort by ${op.label} ${op.desc ? 'descending' : 'ascending'} and keep the top ${op.n} (${delta}).`
    case 'join': return `Match rows with the right-hand query on ${op.on.map(k => (k.l === k.r ? k.l : `${k.l} = ${k.r}`)).join(', ')} using kind=${op.kind}${op.kind === 'innerunique' ? ' (the default: left side de-duplicated on the key)' : ''} (${delta}).`
    case 'union': return `Append rows from other tables (${delta}).`
    case 'parse': return `Extract new columns from text using a pattern: ${op.pattern.filter(p => 'name' in p).map(p => (p as { name: string }).name).join(', ')}.`
    case 'search': return `Keep rows where any column contains "${op.term}" (${delta}).`
    case 'getschema': return 'Show the column names and data types instead of data.'
    case 'render': return 'render draws charts in the real portal. This simulator shows the table instead.'
    case 'mv-expand': return `Turn each element of the array column ${op.col} into its own row (${delta}).`
  }
}

function applyOp(t: Table, op: Op, ctx: Ctx): Table {
  switch (op.op) {
    case 'where': {
      if (op.e.k === 'bin' && op.e.op === '==' && op.e.l.k === 'col' && op.e.r.k === 'lit' && typeof op.e.r.v === 'string') {
        // gentle nudge about case sensitivity when == returns nothing but =~ would
        const comp = new Compiler(ctx, t.columns)
        const f = comp.compile(op.e)
        const rows = t.rows.filter(r => truthy(f(r)))
        if (rows.length === 0) {
          const name = op.e.l.name, val = (op.e.r.v as string).toLowerCase()
          if (t.rows.some(r => r[name] !== null && toStr(r[name]).toLowerCase() === val))
            ctx.warnings.push(`"==" is case-sensitive and matched nothing, but a case-insensitive match exists. Try =~ instead of ==.`)
        }
        return { ...t, rows }
      }
      const f = new Compiler(ctx, t.columns).compile(op.e)
      return { ...t, rows: t.rows.filter(r => truthy(f(r))) }
    }
    case 'take': return { ...t, rows: t.rows.slice(0, op.n) }
    case 'project': return project(t, op.items, ctx, false)
    case 'extend': return project(t, op.items, ctx, true)
    case 'project-away': {
      for (const c of op.cols) if (!t.columns.some(x => x.name === c)) throw new KqlError(`Unknown column "${c}" in project-away.`, suggest(c, t.columns.map(x => x.name)) ? `Did you mean "${suggest(c, t.columns.map(x => x.name))}"?` : undefined)
      const cols = t.columns.filter(c => !op.cols.includes(c.name))
      return { ...t, columns: cols, rows: t.rows.map(r => { const o: Row = {}; for (const c of cols) o[c.name] = r[c.name]; return o }) }
    }
    case 'project-rename': {
      const map = new Map(op.pairs.map(([n, o]) => [o, n]))
      for (const o of map.keys()) if (!t.columns.some(c => c.name === o)) throw new KqlError(`Unknown column "${o}" in project-rename.`, 'Syntax: | project-rename NewName = ExistingName')
      return { ...t, columns: t.columns.map(c => ({ ...c, name: map.get(c.name) ?? c.name })), rows: t.rows.map(r => { const o: Row = {}; for (const [k, v] of Object.entries(r)) o[map.get(k) ?? k] = v; return o }) }
    }
    case 'distinct': {
      const cols = op.cols[0] === '*' ? t.columns : op.cols.map(c => {
        const col = t.columns.find(x => x.name === c)
        if (!col) { const s = suggest(c, t.columns.map(x => x.name)); throw new KqlError(`Unknown column "${c}" in distinct.`, s ? `Did you mean "${s}"?` : undefined) }
        return col
      })
      const seen = new Set<string>(); const rows: Row[] = []
      for (const r of t.rows) {
        const k = cols.map(c => keyOf(r[c.name] ?? null)).join('\u0001')
        if (!seen.has(k)) { seen.add(k); const o: Row = {}; for (const c of cols) o[c.name] = r[c.name] ?? null; rows.push(o) }
      }
      return { ...t, columns: cols, rows }
    }
    case 'count': return { name: t.name, columns: [{ name: 'Count', type: 'int' }], rows: [{ Count: t.rows.length }] }
    case 'summarize': return summarize(t, op, ctx)
    case 'sort': {
      const comp = new Compiler(ctx, t.columns)
      return { ...t, rows: sortRows(t.rows, op.keys.map(k => ({ f: comp.compile(k.e), desc: k.desc }))) }
    }
    case 'top': {
      const comp = new Compiler(ctx, t.columns)
      return { ...t, rows: sortRows(t.rows, [{ f: comp.compile(op.e), desc: op.desc }]).slice(0, op.n) }
    }
    case 'join': return join(t, runQuery(op.right, ctx), op)
    case 'union': return unionTables([t, ...op.sources.map(s => runQuery(s, ctx))])
    case 'search': return { ...t, rows: t.rows.filter(r => Object.values(r).some(v => v !== null && toStr(v).toLowerCase().includes(op.term.toLowerCase()))) }
    case 'getschema': return { name: 'schema', columns: [{ name: 'ColumnName', type: 'string' }, { name: 'ColumnOrdinal', type: 'int' }, { name: 'ColumnType', type: 'string' }], rows: t.columns.map((c, i) => ({ ColumnName: c.name, ColumnOrdinal: i, ColumnType: c.type })) }
    case 'render': ctx.warnings.push('render is ignored in the simulator — charts appear in the real Sentinel/Defender portals. Showing the table instead.'); return t
    case 'mv-expand': {
      if (!t.columns.some(c => c.name === op.col)) throw new KqlError(`Unknown column "${op.col}" in mv-expand.`)
      const rows: Row[] = []
      for (const r of t.rows) {
        let v = r[op.col]
        if (typeof v === 'string') { try { v = JSON.parse(v) } catch { /* keep */ } }
        if (Array.isArray(v)) { if (v.length === 0) continue; for (const x of v) rows.push({ ...r, [op.col]: x }) }
        else rows.push(r)
      }
      return { ...t, rows }
    }
    case 'parse': {
      const f = new Compiler(ctx, t.columns).compile(op.e)
      const names: { name: string; type?: string }[] = []
      let re = '^'
      op.pattern.forEach((p, idx) => {
        const last = idx === op.pattern.length - 1
        if ('lit' in p) re += p.lit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        else if ('star' in p) re += last ? '[\\s\\S]*' : '[\\s\\S]*?'
        else { names.push(p); re += last ? '([\\s\\S]*)' : '([\\s\\S]*?)' }
      })
      const rx = new RegExp(re)
      const cols = [...t.columns]
      for (const n of names) if (!cols.some(c => c.name === n.name)) cols.push({ name: n.name, type: n.type === 'int' || n.type === 'long' ? 'int' : n.type === 'real' ? 'real' : 'string' })
      const rows = t.rows.map(r => {
        const m = toStr(f(r)).match(rx)
        const o: Row = { ...r }
        names.forEach((n, i) => {
          const raw = m ? m[i + 1] : null
          o[n.name] = raw === null ? null : n.type === 'int' || n.type === 'long' ? (isNaN(parseInt(raw)) ? null : parseInt(raw)) : n.type === 'real' ? parseFloat(raw) : raw
        })
        return o
      })
      return { ...t, columns: cols, rows }
    }
  }
}

/* ------------------------------------------------------------- PUBLIC API */

export function runKql(src: string, catalog: Catalog): QueryResult | QueryError {
  const t0 = performance.now()
  try {
    if (!src.trim()) throw new KqlError('The query is empty.', 'Type a table name such as SigninLogs and press Run.')
    const trimmed = src.trim()
    if (/^select\s/i.test(trimmed)) throw new KqlError('KQL is not SQL.', 'Start with the table, then pipe: SigninLogs | where ResultType != "0" | project UserPrincipalName, IPAddress')
    const toks = lex(src)
    const tabular = new Set(catalog.tableNames())
    const parser = new Parser(toks, src, tabular)
    const stmts = parser.program()
    const ctx: Ctx = { catalog, scalars: new Map(), tabs: new Map(), warnings: [] }
    let last: Table | null = null
    let stages: Stage[] = []
    for (const s of stmts) {
      if (s.kind === 'let') {
        if (s.tab) ctx.tabs.set(s.name, runQuery(s.tab, ctx))
        else {
          const f = new Compiler(ctx, []).compile(s.e!)
          ctx.scalars.set(s.name, f({}))
        }
      } else {
        stages = []
        last = runQuery(s.q, ctx, stages)
      }
    }
    if (!last) throw new KqlError('No query to run — only let statements were found.', 'After your let statements, write the query that uses them (and end each let with ";").')
    return { ok: true, columns: last.columns, rows: last.rows, stages, warnings: ctx.warnings, elapsedMs: Math.round((performance.now() - t0) * 10) / 10 }
  } catch (e) {
    if (e instanceof KqlError) return { ok: false, message: e.message, hint: e.hint, pos: e.pos }
    return { ok: false, message: 'Internal simulator error: ' + (e as Error).message }
  }
}

/* ----------------------------------------------- result comparison (labs) */

export interface CheckResult { pass: boolean; message: string; details?: string[] }

function normCell(v: Value): string {
  if (Array.isArray(v)) return JSON.stringify([...v].map(x => display(x as Value)).sort())
  return display(v).toLowerCase()
}

/**
 * Compare a learner's result to the reference solution. Only the solution's
 * columns are compared; column order and row order are ignored unless ordered.
 */
export function checkAgainst(user: QueryResult, expected: QueryResult, opts: { ordered?: boolean; columns?: string[] } = {}): CheckResult {
  const cols = opts.columns ?? expected.columns.map(c => c.name)
  const userMap = new Map(user.columns.map(c => [c.name.toLowerCase(), c.name]))
  const missing = cols.filter(c => !userMap.has(c.toLowerCase()))
  if (missing.length) {
    return { pass: false, message: `Your result is missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`, details: [`Your columns: ${user.columns.map(c => c.name).join(', ') || '(none)'}`, 'Tip: use project or summarize ... by to shape the output, and name columns with alias = expression.'] }
  }
  const sig = (r: Row, names: string[]) => names.map(n => normCell(r[n] ?? null)).join('|')
  const uNames = cols.map(c => userMap.get(c.toLowerCase())!)
  const u = user.rows.map(r => sig(r, uNames))
  const e = expected.rows.map(r => sig(r, cols))
  if (u.length !== e.length) {
    return { pass: false, message: `Expected ${e.length} row${e.length === 1 ? '' : 's'} but your query returned ${u.length}.`, details: [u.length > e.length ? 'Your filter is probably too broad — check your where conditions and time range.' : 'Your filter is probably too narrow — check spelling, case-sensitivity (== vs =~), and the operator (has vs contains).'] }
  }
  if (opts.ordered) {
    const bad = u.findIndex((x, i) => x !== e[i])
    if (bad >= 0) return { pass: false, message: `Row ${bad + 1} does not match the expected order or values.`, details: ['Check your sort direction (asc/desc) and sort column.'] }
  } else {
    const count = new Map<string, number>()
    for (const x of e) count.set(x, (count.get(x) ?? 0) + 1)
    for (const x of u) { const c = count.get(x); if (!c) return { pass: false, message: 'Right number of rows, but some values differ from the expected result.', details: ['Compare your aggregation (count vs dcount) and grouping columns.'] }; count.set(x, c - 1) }
  }
  return { pass: true, message: 'Correct — your result matches the expected output.' }
}
