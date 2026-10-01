import { GLOSSARY } from '../data/glossary'
import type { Question } from '../data/types'

/**
 * Teaching note for a wrong option: an authored note if present, otherwise
 * what the chosen thing actually is (from the glossary), so the learner sees
 * why it doesn't fit rather than a bare "incorrect".
 */
export function whyWrong(q: Question, idx: number): string {
  const authored = q.whyWrong?.[idx]
  if (authored) return authored
  const opt = q.options[idx].toLowerCase()
  const hit = GLOSSARY
    .filter(g => [g.term, ...(g.aka ?? [])].some(t => t.length > 2 && (opt === t.toLowerCase() || new RegExp(`\\b${t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(opt))))
    .sort((a, b) => b.term.length - a.term.length)[0]
  if (hit) return `${hit.term} is ${hit.definition.charAt(0).toLowerCase()}${hit.definition.slice(1)} That doesn't match what this question needs — compare with the explanation below.`
  return 'It doesn\'t satisfy the requirement in the question — compare it with the explanation below.'
}
