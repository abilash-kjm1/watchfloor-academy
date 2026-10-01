import { SKILLS } from '../data/curriculum'
import { ALL_QUESTIONS, LESSONS, ORDERED_LESSONS, lessonForQuestion } from '../data'
import { INTERVIEW } from '../data/interview'
import type { Lesson, SkillId } from '../data/types'
import type { ProgressState } from './store'

export interface SkillScore {
  id: SkillId
  name: string
  score: number // 0–100
  level: string
  accuracy: number | null
  answered: number
  lessonsDone: number
  lessonsTotal: number
}

const LEVEL_NAMES = ['Not started', 'Beginner', 'Understands', 'Recognizes', 'Practices', 'Investigates', 'Analyzes']

/**
 * Skill level is driven by performance, not completion:
 * 15% lessons completed, 65% question accuracy (weighted by how much evidence exists),
 * 20% interview key-point coverage.
 */
export function computeSkills(s: ProgressState): SkillScore[] {
  return SKILLS.map(sk => {
    const lessons = LESSONS.filter(l => l.skills.includes(sk.id))
    const done = lessons.filter(l => s.completed[l.id]).length
    const qs = ALL_QUESTIONS.filter(q => q.skill === sk.id)
    let attempted = 0, firstTryish = 0
    for (const q of qs) {
      const a = s.answers[q.id]
      if (!a) continue
      attempted++
      // reward getting it right, but count repeated failures against you
      firstTryish += a.lastCorrect ? Math.max(0.5, a.correct / a.attempts) : 0
    }
    const accuracy = attempted ? firstTryish / attempted : null
    const evidence = Math.min(1, attempted / Math.max(4, Math.ceil(qs.length * 0.6)))
    const ivs = INTERVIEW.filter(q => q.skill === sk.id).map(q => s.interview[q.id]?.best).filter((x): x is number => x !== undefined)
    const ivScore = ivs.length ? (ivs.reduce((a, b) => a + b, 0) / ivs.length / 100) * Math.min(1, ivs.length / 2) : 0
    const lessonPart = lessons.length ? done / lessons.length : 0
    const score = Math.round(100 * (0.15 * lessonPart + 0.65 * (accuracy ?? 0) * evidence + 0.2 * ivScore))
    const level = score === 0 ? LEVEL_NAMES[0] : LEVEL_NAMES[Math.min(LEVEL_NAMES.length - 1, 1 + Math.floor(score / 18))]
    return { id: sk.id, name: sk.name, score, level, accuracy, answered: attempted, lessonsDone: done, lessonsTotal: lessons.length }
  })
}

export interface WeakConcept { concept: string; accuracy: number; attempts: number; lesson?: Lesson; questionIds: string[] }

/** Concepts the learner keeps getting wrong, with the lesson that teaches them. */
export function weakConcepts(s: ProgressState): WeakConcept[] {
  const by = new Map<string, { right: number; total: number; qids: string[] }>()
  for (const q of ALL_QUESTIONS) {
    const a = s.answers[q.id]
    if (!a) continue
    const e = by.get(q.concept) ?? { right: 0, total: 0, qids: [] }
    e.right += a.correct; e.total += a.attempts; e.qids.push(q.id)
    by.set(q.concept, e)
  }
  const out: WeakConcept[] = []
  for (const [concept, e] of by) {
    const acc = e.right / e.total
    const lastWrong = e.qids.some(id => !s.answers[id].lastCorrect)
    if (acc < 0.6 || lastWrong) out.push({ concept, accuracy: acc, attempts: e.total, lesson: lessonForQuestion(e.qids[0]), questionIds: e.qids })
  }
  return out.sort((a, b) => a.accuracy - b.accuracy)
}

export function recommendedLesson(s: ProgressState): Lesson | undefined {
  const weak = weakConcepts(s).find(w => w.lesson)
  if (weak?.lesson && s.completed[weak.lesson.id]) return weak.lesson
  return ORDERED_LESSONS.find(l => !s.completed[l.id])
}

export function overallProgress(s: ProgressState) {
  const total = LESSONS.length
  const done = LESSONS.filter(l => s.completed[l.id]).length
  const answered = Object.keys(s.answers).length
  const correct = Object.values(s.answers).filter(a => a.lastCorrect).length
  return { total, done, pct: Math.round((done / total) * 100), answered, accuracy: answered ? Math.round((correct / answered) * 100) : null }
}

export function interviewReadiness(s: ProgressState) {
  const scores = INTERVIEW.map(q => s.interview[q.id]?.best ?? 0)
  return Math.round(scores.reduce((a, b) => a + b, 0) / INTERVIEW.length)
}
