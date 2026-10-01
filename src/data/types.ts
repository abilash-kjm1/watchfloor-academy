/** Content models. Curriculum content lives in data files; UI components only render it. */

export type Mode = 'soc' | 'exam' | 'both'

export type Level = 'beginner' | 'understand' | 'recognize' | 'practice' | 'investigate' | 'analyze' | 'hunt' | 'detect'
export const LEVELS: Level[] = ['beginner', 'understand', 'recognize', 'practice', 'investigate', 'analyze', 'hunt', 'detect']

export type SkillId =
  | 'soc' | 'computers' | 'networking' | 'windows' | 'linux' | 'identity'
  | 'logging' | 'siem' | 'kql' | 'sentinel' | 'defender' | 'hunting' | 'ir' | 'mitre' | 'threatintel'

export interface Skill { id: SkillId; name: string; blurb: string }

export type ResourceKind = 'primary' | 'video' | 'docs' | 'optional' | 'lab'
export interface Resource {
  kind: ResourceKind
  title: string
  url: string
  source: string
  /** True when the page describes product UI/features that Microsoft changes often. */
  volatile?: boolean
  note?: string
}

export interface Question {
  id: string
  prompt: string
  options: string[]
  /** Indexes of correct options. More than one = multiple response. */
  answer: number[]
  explanation: string
  /** Optional per-option "why this is wrong" teaching notes. */
  whyWrong?: Record<number, string>
  concept: string
  skill: SkillId
  kind?: 'knowledge' | 'scenario'
  /** SC-200 objective id(s) this question supports. */
  objectives?: string[]
  mode?: Mode
}

export interface InterviewQuestion {
  id: string
  level: 'beginner' | 'intermediate' | 'advanced'
  question: string
  /** Key points a strong answer covers. Each has trigger words used for self-check feedback. */
  points: { text: string; keywords: string[] }[]
  model: string
  tip: string
  followUp: string
  skill: SkillId
  lessonId?: string
}

export interface KqlSnippet { title: string; query: string; explain: string; table?: string }
export interface MitreRef { id: string; name: string; tactic: string; note: string }

/** Ordered teaching sections. Every lesson uses the same order; empty sections are skipped. */
export const SECTION_ORDER = [
  ['what', 'What is it?'],
  ['why', 'Why does it exist?'],
  ['name', 'Why is it called that?'],
  ['problem', 'What problem does it solve?'],
  ['how', 'How does it work?'],
  ['analogy', 'Simple analogy'],
  ['realWorld', 'Real-world example'],
  ['securityExample', 'Security example'],
  ['normal', 'What does normal look like?'],
  ['suspicious', 'What does suspicious look like?'],
  ['abuse', 'How can attackers abuse it?'],
  ['evidence', 'What evidence does it create?'],
  ['where', 'Where does that evidence appear?'],
  ['analyst', 'How does a SOC analyst use it?'],
  ['microsoft', 'Microsoft connection'],
] as const
export type SectionKey = (typeof SECTION_ORDER)[number][0]

export interface Lesson {
  id: string
  moduleId: string
  title: string
  summary: string
  mode: Mode
  minutes: number
  levels: Level[]
  skills: SkillId[]
  sections: Partial<Record<SectionKey, string>>
  /** "Where this fits": how the lesson builds on earlier ones (from the lesson's Markdown). */
  bridge?: string
  /** Feynman-style self-checks: explain the idea back in plain words. */
  explainBack?: { q: string; a: string }[]
  /** Visual diagram: a flow the lesson walks through. */
  diagram?: { title: string; caption?: string; steps: { label: string; detail: string }[] }
  /** Optional extra deep-dive blocks rendered after "How does it work?". */
  deepDives?: { title: string; body: string }[]
  kql?: KqlSnippet[]
  mitre?: MitreRef[]
  sc200: { note: string; objectives: string[] }
  lab: { title: string; environment: string; steps: string[]; reflect: string[] }
  quiz: Question[]
  interview: string[]
  mistakes: string[]
  tip: string
  think: { prompt: string; answer: string }
  takeaways: string[]
  /** Connect-the-dots chain: glossary term ids in order. */
  connect: string[]
  resources: Resource[]
}

export interface Module {
  id: string
  number: number
  title: string
  track: string
  blurb: string
  objectives: string[]
  prereqs: string[]
  skills: SkillId[]
  mode: Mode
  lessons: string[]
  /** 'ready' modules have full lessons; 'outline' modules show objectives and where the topic is taught today. */
  status: 'ready' | 'outline'
  coveredIn?: string[]
}

export interface GlossaryTerm {
  id: string
  term: string
  aka?: string[]
  category: 'concept' | 'role' | 'network' | 'windows' | 'identity' | 'product' | 'table' | 'kql' | 'mitre' | 'event' | 'process'
  definition: string
  why: string
  example: string
  related: string[]
  products?: string[]
  kql?: string
  mitre?: string[]
  lessons?: string[]
}

export interface Note { id: string; lessonId?: string; title: string; body: string; created: number; updated: number }
export interface Bookmark { id: string; kind: 'lesson' | 'resource' | 'question' | 'kql' | 'glossary' | 'objective'; title: string; href: string; created: number }
