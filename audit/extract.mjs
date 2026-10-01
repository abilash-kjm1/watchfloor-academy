// Loads the real content modules through Vite (supports import.meta.glob) and dumps an audit inventory.
import { createServer } from 'vite'
import { writeFileSync } from 'node:fs'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const load = p => server.ssrLoadModule(p)
const data = await load('/src/data/index.ts')
const { GLOSSARY } = await load('/src/data/glossary.ts')
const { KQL_OPERATORS } = await load('/src/data/kqlOperators.ts')
const { R } = await load('/src/data/resources.ts')
const { OBJECTIVES, EXAM_QUESTIONS } = await load('/src/data/sc200.ts')
const { INTERVIEW } = await load('/src/data/interview.ts')
const { MODULES } = await load('/src/data/curriculum.ts')

const queries = []
const fence = /```kql\n([\s\S]*?)```/g
for (const l of data.LESSONS) {
  for (const k of l.kql ?? []) queries.push({ where: `lesson:${l.id}:kql:${k.title}`, query: k.query })
  for (const t of [...Object.values(l.sections), ...(l.deepDives ?? []).map(d => d.body)])
    for (const m of t.matchAll(fence)) queries.push({ where: `lesson:${l.id}:text`, query: m[1] })
}
for (const g of GLOSSARY) if (g.kql) queries.push({ where: `glossary:${g.id}`, query: g.kql })
for (const o of KQL_OPERATORS) for (const f of ['basic', 'security']) queries.push({ where: `operator:${o.id}:${f}`, query: o[f] })

const allText = JSON.stringify({ L: data.LESSONS, G: GLOSSARY, E: EXAM_QUESTIONS, I: INTERVIEW, O: OBJECTIVES })
const eventIds = [...new Set(allText.match(/\b(4624|4625|4634|4672|4688|4697|4720|4728|4732|4740|4756|4768|4769|4776|1102|7045)\b/g))].sort()
const mitre = [...new Set(allText.match(/\bT[A]?\d{4}(?:\.\d{3})?\b/g))].sort()
const links = [...new Set([...Object.values(R).map(r => r.url), ...KQL_OPERATORS.map(o => o.docs)])]

const inv = {
  counts: { modules: MODULES.length, lessons: data.LESSONS.length, questions: data.ALL_QUESTIONS.length, interview: INTERVIEW.length, objectives: OBJECTIVES.length, glossary: GLOSSARY.length, queries: queries.length, links: links.length },
  order: data.ORDERED_LESSONS.map(l => l.id),
  queries, eventIds, mitre, links,
}
writeFileSync('audit/inventory.json', JSON.stringify(inv, null, 2))
console.log(JSON.stringify({ ...inv.counts, eventIds, mitre }, null, 1))
await server.close()
