// Cross-reference check: every glossary link, chain, objective, interview, module and question reference must resolve.
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const load = p => server.ssrLoadModule(p)
const d = await load('/src/data/index.ts')
const { GLOSSARY } = await load('/src/data/glossary.ts')
const { MODULES } = await load('/src/data/curriculum.ts')
const { OBJECTIVES } = await load('/src/data/sc200.ts')
const { INTERVIEW } = await load('/src/data/interview.ts')

const gl = new Set(GLOSSARY.map(x => x.id)), ls = new Set(d.LESSONS.map(x => x.id))
const obj = new Set(OBJECTIVES.map(x => x.id)), ivs = new Set(INTERVIEW.map(x => x.id)), mods = new Set(MODULES.map(x => x.id))
const bad = []
for (const l of d.LESSONS) {
  if (!mods.has(l.moduleId)) bad.push(`${l.id}: module ${l.moduleId}`)
  if (Object.keys(l.sections).length < 15) bad.push(`${l.id}: only ${Object.keys(l.sections).length} sections`)
  if (!l.bridge) bad.push(`${l.id}: no bridge`)
  if (!l.explainBack?.length) bad.push(`${l.id}: no explain-back`)
  if (!l.story) bad.push(`${l.id}: no investigation story`)
  else if (!l.story.moment.options.some(o => o.best)) bad.push(`${l.id}: story moment has no best option`)
  for (const id of l.connect) if (!gl.has(id)) bad.push(`${l.id}: connect → ${id}`)
  for (const t of [l.bridge ?? '', ...Object.values(l.sections), ...(l.deepDives ?? []).map(x => x.body)])
    for (const m of t.matchAll(/\[\[([^\]|]+)/g)) if (!gl.has(m[1])) bad.push(`${l.id}: [[${m[1]}]]`)
  for (const o of l.sc200.objectives) if (!obj.has(o)) bad.push(`${l.id}: objective ${o}`)
  for (const i of l.interview) if (!ivs.has(i)) bad.push(`${l.id}: interview ${i}`)
  for (const r of l.resources) if (!r?.url) bad.push(`${l.id}: missing resource`)
}
for (const g of GLOSSARY) {
  for (const r of g.related) if (!gl.has(r)) bad.push(`glossary ${g.id}: related ${r}`)
  for (const l of g.lessons ?? []) if (!ls.has(l)) bad.push(`glossary ${g.id}: lesson ${l}`)
}
for (const m of MODULES) for (const l of [...m.lessons, ...(m.coveredIn ?? [])]) if (!ls.has(l)) bad.push(`module ${m.id}: lesson ${l}`)
for (const o of OBJECTIVES) for (const l of o.lessons) if (!ls.has(l)) bad.push(`objective ${o.id}: lesson ${l}`)
for (const q of d.ALL_QUESTIONS) if (q.answer.some(a => a >= q.options.length)) bad.push(`question ${q.id}: answer index`)
for (const o of OBJECTIVES) { const n = d.ALL_QUESTIONS.filter(q => q.objectives?.includes(o.id)).length; if (n < 3) bad.push(`objective ${o.id}: only ${n} practice questions`) }
for (const q of d.ALL_QUESTIONS) for (const o of q.objectives ?? []) if (!obj.has(o)) bad.push(`question ${q.id}: objective ${o}`)
const ids = d.ALL_QUESTIONS.map(q => q.id); for (const id of ids.filter((x, i) => ids.indexOf(x) !== i)) bad.push(`duplicate question ${id}`)
const iids = INTERVIEW.map(q => q.id); for (const id of iids.filter((x, i) => iids.indexOf(x) !== i)) bad.push(`duplicate interview ${id}`)
// Beginner starter kits: every module with lessons has one, and its terms, lessons and links resolve.
for (const m of MODULES) {
  if (m.lessons.length && !m.starter) bad.push(`module ${m.id}: no beginner starter kit`)
  if (!m.starter) continue
  for (const t of m.starter.terms) if (!gl.has(t)) bad.push(`module ${m.id}: starter term ${t}`)
  for (const l of m.starter.revisit ?? []) if (!ls.has(l)) bad.push(`module ${m.id}: starter revisit ${l}`)
  for (const r of m.starter.resources) if (!r?.url) bad.push(`module ${m.id}: starter resource missing`)
}
// Mojibake: UTF-8 text that was saved through a legacy code page (e.g. "â€”" for "—").
{
  const { readdirSync, readFileSync } = await import('node:fs')
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`])
  for (const f of walk('src').filter(f => /\.(ts|tsx|md|css)$/.test(f)))
    if (/â€|Ã[\u0080-¿]|Â[§·°]/.test(readFileSync(f, 'utf8'))) bad.push(`${f}: garbled characters (encoding)`)
}
console.log(bad.length ? bad.join('\n') : `Integrity OK: ${d.LESSONS.length} lessons, ${d.ALL_QUESTIONS.length} questions, ${GLOSSARY.length} glossary terms, ${INTERVIEW.length} interview questions.`)
await server.close()
if (bad.length) process.exit(1)
