import { LESSONS } from '../data'
import { GLOSSARY } from '../data/glossary'
import { KQL_OPERATORS } from '../data/kqlOperators'
import { OBJECTIVES } from '../data/sc200'
import { INTERVIEW } from '../data/interview'
import { MODULES } from '../data/curriculum'

export interface SearchItem { kind: string; title: string; subtitle: string; href: string; text: string }

function build(): SearchItem[] {
  const items: SearchItem[] = []
  for (const m of MODULES) items.push({ kind: 'Module', title: m.title, subtitle: m.blurb, href: `/module/${m.id}`, text: [m.title, m.blurb, ...m.objectives].join(' ') })
  for (const l of LESSONS) {
    items.push({ kind: 'Lesson', title: l.title, subtitle: l.summary, href: `/lesson/${l.id}`, text: [l.title, l.summary, ...Object.values(l.sections), ...(l.mitre ?? []).map(t => `${t.id} ${t.name}`)].join(' ') })
    for (const k of l.kql ?? []) items.push({ kind: 'KQL example', title: k.title, subtitle: `${k.table ?? 'KQL'} · ${l.title}`, href: `/lesson/${l.id}#kql`, text: `${k.title} ${k.query} ${k.explain} ${k.table ?? ''}` })
    for (const t of l.mitre ?? []) items.push({ kind: 'MITRE', title: `${t.id} ${t.name}`, subtitle: `${t.tactic} · ${l.title}`, href: `/lesson/${l.id}#mitre`, text: `${t.id} ${t.name} ${t.tactic} ${t.note}` })
    items.push({ kind: 'Lab', title: l.lab.title, subtitle: `${l.lab.environment} · ${l.title}`, href: `/lesson/${l.id}#lab`, text: [l.lab.title, ...l.lab.steps].join(' ') })
  }
  for (const g of GLOSSARY) items.push({ kind: g.category === 'event' ? 'Event ID' : g.category === 'table' ? 'Table' : g.category === 'product' ? 'Product' : 'Glossary', title: g.term, subtitle: g.definition, href: `/glossary?term=${g.id}`, text: [g.term, ...(g.aka ?? []), g.definition, g.why, g.example].join(' ') })
  for (const o of KQL_OPERATORS) items.push({ kind: 'KQL operator', title: o.name, subtitle: o.plain, href: `/kql#${o.id}`, text: [o.name, o.plain, o.why, o.security].join(' ') })
  for (const o of OBJECTIVES) items.push({ kind: 'SC-200 objective', title: o.text, subtitle: o.group, href: `/sc200#${o.id}`, text: `${o.text} ${o.group} ${o.product}` })
  for (const q of INTERVIEW) items.push({ kind: 'Interview', title: q.question, subtitle: `${q.level} interview question`, href: `/interview?q=${q.id}`, text: `${q.question} ${q.model}` })
  return items
}

let cache: SearchItem[] | null = null
export function search(query: string, limit = 30): SearchItem[] {
  cache ??= build()
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  const scored: { item: SearchItem; score: number }[] = []
  for (const item of cache) {
    const title = item.title.toLowerCase(), text = item.text.toLowerCase()
    let score = 0
    for (const t of terms) {
      if (title === t) score += 20
      else if (title.startsWith(t)) score += 10
      else if (title.includes(t)) score += 6
      else if (text.includes(t)) score += 1
      else { score = -1; break }
    }
    if (score > 0) scored.push({ item, score })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(s => s.item)
}
