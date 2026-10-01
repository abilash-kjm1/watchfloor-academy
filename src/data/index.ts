import type { Lesson, Question } from './types'
import { orientationLessons } from './lessons/orientation'
import { socLessons } from './lessons/soc'
import { computerLessons } from './lessons/computers'
import { foundationLessons } from './lessons/foundations'
import { analysisLessons } from './lessons/analysis'
import { microsoftLessons } from './lessons/microsoft'
import { identityEmailEndpointLessons } from './lessons/identity-email-endpoint'
import { securityFoundationLessons } from './lessons/security-foundations'
import { operationsLessons } from './lessons/operations'
import { platformExtraLessons } from './lessons/platform-extras'
import { storyLessons } from './lessons/story-lessons'
import { MODULES, LEARNING_PATH } from './curriculum'
import { EXAM_QUESTIONS } from './sc200'
import { LESSON_TEXT } from './lessons/text'
import { STORIES } from './stories'

export const LESSONS: Lesson[] = [...orientationLessons, ...computerLessons, ...socLessons, ...foundationLessons, ...analysisLessons, ...microsoftLessons, ...identityEmailEndpointLessons, ...securityFoundationLessons, ...operationsLessons, ...platformExtraLessons, ...storyLessons]
  .map(l => { const t = LESSON_TEXT[l.id]; return { ...l, sections: t?.sections ?? {}, bridge: t?.bridge, explainBack: t?.explainBack, story: l.story ?? STORIES[l.id] } })
export const lessonById = new Map(LESSONS.map(l => [l.id, l]))

/** Lessons in recommended learning order. */
export const ORDERED_LESSONS: Lesson[] = LEARNING_PATH.flatMap(mid => (MODULES.find(m => m.id === mid)?.lessons ?? []).map(id => lessonById.get(id)!).filter(Boolean))

export const ALL_QUESTIONS: Question[] = [...LESSONS.flatMap(l => l.quiz), ...EXAM_QUESTIONS]
export const questionById = new Map(ALL_QUESTIONS.map(q => [q.id, q]))

/** Which lesson teaches a question's concept (for the review engine). */
export function lessonForQuestion(qid: string): Lesson | undefined {
  return LESSONS.find(l => l.quiz.some(q => q.id === qid))
}

export function nextLesson(id: string): Lesson | undefined {
  const i = ORDERED_LESSONS.findIndex(l => l.id === id)
  return i >= 0 ? ORDERED_LESSONS[i + 1] : undefined
}
export function prevLesson(id: string): Lesson | undefined {
  const i = ORDERED_LESSONS.findIndex(l => l.id === id)
  return i > 0 ? ORDERED_LESSONS[i - 1] : undefined
}
