import { ALL_QUESTIONS } from '../data'
import { DOMAINS, OBJECTIVES, type Objective } from '../data/sc200'
import type { ProgressState } from './store'

export type ReadinessLevel = 'Not started' | 'Learning' | 'Nearly ready' | 'Ready'
export interface ObjectiveReadiness { objective: Objective; score: number; level: ReadinessLevel; lessonsDone: number; lessonsTotal: number; answered: number; total: number; correct: number }

const QUESTIONS_BY_OBJECTIVE = new Map(OBJECTIVES.map(o => [o.id, ALL_QUESTIONS.filter(q => q.objectives?.includes(o.id))]))
/** Exam domain weights (midpoint of Microsoft's published range). */
export const DOMAIN_WEIGHT: Record<string, number> = { env: 0.425, ir: 0.375, hunt: 0.225 }

const level = (score: number, answered: number): ReadinessLevel =>
  answered === 0 && score === 0 ? 'Not started' : score >= 80 ? 'Ready' : score >= 60 ? 'Nearly ready' : 'Learning'

/**
 * Readiness per objective: 30% lessons studied + 70% accuracy on the objective's questions
 * (accuracy is weighted by how many of its questions have been answered, so one lucky answer
 * doesn't count as "ready").
 */
export function objectiveReadiness(p: ProgressState, o: Objective): ObjectiveReadiness {
  const qs = QUESTIONS_BY_OBJECTIVE.get(o.id) ?? []
  const answered = qs.filter(q => p.answers[q.id])
  const correct = answered.filter(q => p.answers[q.id].lastCorrect).length
  const coverage = qs.length ? answered.length / qs.length : 0
  const accuracy = answered.length ? correct / answered.length : 0
  const lessonsDone = o.lessons.filter(l => p.completed[l]).length
  const lessonPart = o.lessons.length ? lessonsDone / o.lessons.length : coverage
  const score = Math.round(100 * (0.3 * lessonPart + 0.7 * accuracy * Math.min(1, coverage * 1.5)))
  return { objective: o, score, level: level(score, answered.length), lessonsDone, lessonsTotal: o.lessons.length, answered: answered.length, total: qs.length, correct }
}

export function examReadiness(p: ProgressState) {
  const all = OBJECTIVES.map(o => objectiveReadiness(p, o))
  const domains = DOMAINS.map(d => {
    const items = all.filter(r => r.objective.domain === d.id)
    const score = Math.round(items.reduce((a, r) => a + r.score, 0) / Math.max(1, items.length))
    return { domain: d, score, items }
  })
  const overall = Math.round(domains.reduce((a, d) => a + d.score * (DOMAIN_WEIGHT[d.domain.id] ?? 0), 0) / domains.reduce((a, d) => a + (DOMAIN_WEIGHT[d.domain.id] ?? 0), 0))
  const weakest = [...all].filter(r => r.level !== 'Ready').sort((a, b) => a.score - b.score).slice(0, 5)
  return { all, domains, overall, weakest }
}

export const READINESS_COLOR: Record<ReadinessLevel, string> = {
  'Not started': 'var(--muted)', Learning: 'var(--danger)', 'Nearly ready': 'var(--t-soc)', Ready: 'var(--ok)',
}
