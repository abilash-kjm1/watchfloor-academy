import { createServer } from 'vite'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { OBJECTIVES, DOMAINS } = await server.ssrLoadModule('/src/data/sc200.ts')
const d = await server.ssrLoadModule('/src/data/index.ts')
for (const dom of DOMAINS) {
  const os = OBJECTIVES.filter(o => o.domain === dom.id)
  const covered = os.filter(o => o.lessons.length)
  console.log(`\n${dom.title} (${dom.weight}) — ${covered.length}/${os.length} have lessons`)
  for (const o of os.filter(o => !o.lessons.length)) {
    const qs = d.ALL_QUESTIONS.filter(q => q.objectives?.includes(o.id)).length
    console.log(`  NO LESSON: ${o.text}${qs ? `  [${qs} practice q]` : ''}`)
  }
}
await server.close()
