import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import type { Bookmark, Note } from '../data/types'

/** Everything the learner does is stored locally in this browser. No backend, no account. */
export interface AnswerStat { attempts: number; correct: number; lastCorrect: boolean; ts: number }
export interface ExamRecord { ts: number; mode: string; total: number; correct: number; seconds: number; byObjective: Record<string, [number, number]> }
export interface ProgressState {
  version: 1
  completed: Record<string, number>
  answers: Record<string, AnswerStat>
  labs: Record<string, number>
  interview: Record<string, { best: number; attempts: number; ts: number }>
  exams: ExamRecord[]
  notes: Note[]
  bookmarks: Bookmark[]
  activity: { ts: number; text: string; href: string }[]
  days: string[]
  xp: number
  studyHours: 1 | 2 | 3
  timeSpent: Record<string, number>
  dailyDone: Record<string, { correct: number; total: number; seconds: number }>
}

const KEY = 'soc-academy:progress:v1'
const EMPTY: ProgressState = { version: 1, completed: {}, answers: {}, labs: {}, interview: {}, exams: [], notes: [], bookmarks: [], activity: [], days: [], xp: 0, studyHours: 1, timeSpent: {}, dailyDone: {} }

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    return { ...EMPTY, ...JSON.parse(raw) }
  } catch { return EMPTY }
}

let state: ProgressState = load()
const listeners = new Set<() => void>()
function emit() { for (const l of listeners) l() }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage unavailable — keep in memory */ } }

export const today = () => new Date().toISOString().slice(0, 10)

function update(fn: (s: ProgressState) => ProgressState) {
  state = fn(state)
  const d = today()
  if (!state.days.includes(d)) state = { ...state, days: [...state.days, d].slice(-400) }
  persist(); emit()
}
const act = (s: ProgressState, text: string, href: string) => ({ ...s, activity: [{ ts: Date.now(), text, href }, ...s.activity].slice(0, 50) })
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const actions = {
  completeLesson(id: string, title: string) {
    update(s => (s.completed[id] ? s : act({ ...s, completed: { ...s.completed, [id]: Date.now() }, xp: s.xp + 50 }, `Completed lesson: ${title}`, `/lesson/${id}`)))
  },
  uncompleteLesson(id: string) {
    update(s => { const c = { ...s.completed }; delete c[id]; return { ...s, completed: c } })
  },
  recordAnswer(qid: string, correct: boolean) {
    update(s => {
      const prev = s.answers[qid] ?? { attempts: 0, correct: 0, lastCorrect: false, ts: 0 }
      const firstCorrect = correct && prev.correct === 0
      return { ...s, xp: s.xp + (firstCorrect ? 10 : 0), answers: { ...s.answers, [qid]: { attempts: prev.attempts + 1, correct: prev.correct + (correct ? 1 : 0), lastCorrect: correct, ts: Date.now() } } }
    })
  },
  completeLab(id: string, title: string) {
    update(s => (s.labs[id] ? s : act({ ...s, labs: { ...s.labs, [id]: Date.now() }, xp: s.xp + 30 }, `Completed lab: ${title}`, `/lesson/${id}`)))
  },
  recordInterview(id: string, score: number) {
    update(s => {
      const prev = s.interview[id]
      return act({ ...s, xp: s.xp + (prev ? 0 : 15), interview: { ...s.interview, [id]: { best: Math.max(prev?.best ?? 0, score), attempts: (prev?.attempts ?? 0) + 1, ts: Date.now() } } }, `Interview practice: ${score}% key-point coverage`, '/interview')
    })
  },
  recordExam(rec: ExamRecord) {
    update(s => act({ ...s, exams: [rec, ...s.exams].slice(0, 50), xp: s.xp + rec.correct * 5 }, `SC-200 practice (${rec.mode}): ${rec.correct}/${rec.total}`, '/sc200/practice'))
  },
  recordDaily(day: string, correct: number, total: number, seconds: number) {
    update(s => (s.dailyDone[day] ? s : act({ ...s, dailyDone: { ...s.dailyDone, [day]: { correct, total, seconds } }, xp: s.xp + 25 }, `Daily challenge: ${correct}/${total}`, '/daily')))
  },
  addTime(lessonId: string, seconds: number) {
    if (seconds <= 0) return
    state = { ...state, timeSpent: { ...state.timeSpent, [lessonId]: (state.timeSpent[lessonId] ?? 0) + seconds } }
    persist() // no emit: avoid re-rendering for timing updates
  },
  setStudyHours(h: 1 | 2 | 3) { update(s => ({ ...s, studyHours: h })) },
  saveNote(n: Partial<Note> & { title: string; body: string }) {
    update(s => {
      if (n.id && s.notes.some(x => x.id === n.id)) return { ...s, notes: s.notes.map(x => (x.id === n.id ? { ...x, ...n, updated: Date.now() } : x)) }
      const note: Note = { id: uid(), created: Date.now(), updated: Date.now(), lessonId: n.lessonId, title: n.title, body: n.body }
      return { ...s, notes: [note, ...s.notes] }
    })
  },
  deleteNote(id: string) { update(s => ({ ...s, notes: s.notes.filter(n => n.id !== id) })) },
  toggleBookmark(b: Omit<Bookmark, 'created'>) {
    update(s => (s.bookmarks.some(x => x.id === b.id) ? { ...s, bookmarks: s.bookmarks.filter(x => x.id !== b.id) } : { ...s, bookmarks: [{ ...b, created: Date.now() }, ...s.bookmarks] }))
  },
  exportJson() { return JSON.stringify(state, null, 2) },
  importJson(json: string) {
    const parsed = JSON.parse(json)
    if (parsed?.version !== 1) throw new Error('Unrecognized progress file.')
    update(() => ({ ...EMPTY, ...parsed }))
  },
  reset() { update(() => ({ ...EMPTY, days: [] })) },
}

function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb) }
const Ctx = createContext<ProgressState>(EMPTY)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const s = useSyncExternalStore(subscribe, () => state, () => EMPTY)
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>
}
export const useProgress = () => useContext(Ctx)

export function streak(days: string[]): number {
  const set = new Set(days)
  let n = 0
  const d = new Date()
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1) // streak survives until end of today
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1) }
  return n
}

export function useMemoProgress<T>(fn: (s: ProgressState) => T, deps: unknown[] = []): T {
  const s = useProgress()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => fn(s), [s, ...deps])
}
