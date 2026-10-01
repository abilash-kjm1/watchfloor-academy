import { SECTION_ORDER, type SectionKey } from '../types'

/**
 * Lesson teaching text lives in ./text/<lesson-id>.md, split by "## <key>" headings.
 * Teaching sections: what, why, name, problem, how, analogy, realWorld, securityExample,
 * normal, suspicious, abuse, evidence, where, analyst, microsoft.
 * Extras: "## bridge" (where this lesson fits) and "## explainBack" (Q:/A: pairs).
 */
const files = import.meta.glob('./text/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
const KEYS = new Set<string>(SECTION_ORDER.map(([k]) => k))

export interface LessonText {
  sections: Partial<Record<SectionKey, string>>
  bridge?: string
  explainBack?: { q: string; a: string }[]
}

function parsePairs(text: string) {
  const pairs: { q: string; a: string }[] = []
  for (const block of text.split(/^Q:\s*/m).slice(1)) {
    const [q, a = ''] = block.split(/^A:\s*/m)
    pairs.push({ q: q.trim(), a: a.trim() })
  }
  return pairs
}

function parse(md: string): LessonText {
  const out: LessonText = { sections: {} }
  const parts = md.replace(/\r\n/g, '\n').split(/^## +(\w+)\s*$/m)
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i]
    const body = parts[i + 1].trim()
    if (key === 'bridge') out.bridge = body
    else if (key === 'explainBack') out.explainBack = parsePairs(body)
    else if (KEYS.has(key)) out.sections[key as SectionKey] = body
    else throw new Error(`Unknown lesson section "## ${key}"`)
  }
  return out
}

export const LESSON_TEXT: Record<string, LessonText> = Object.fromEntries(
  Object.entries(files).map(([path, md]) => [path.replace(/^.*\/|\.md$/g, ''), parse(md)]),
)
