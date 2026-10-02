import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenCheck, Brain, CheckCircle2, Layers, RotateCcw, Sparkles, Trophy, XCircle } from 'lucide-react'
import { GLOSSARY } from '../data/glossary'
import { ALL_QUESTIONS, lessonForQuestion } from '../data'
import { actions, useProgress } from '../progress/store'
import { EmptyState, PageHeader, Pill, Progress, cx } from '../components/ui'

interface Card { id: string; deck: 'terms' | 'missed'; front: string; kind: string; back: string; extra?: string; href?: string }

const TERM_CARDS: Card[] = GLOSSARY.map(g => ({ id: `fc:g:${g.id}`, deck: 'terms', kind: g.category, front: g.term, back: g.definition, extra: `Why it matters: ${g.why}`, href: `/glossary?term=${g.id}` }))

type Deck = 'terms' | 'missed' | 'all'

/** Spaced-repetition flashcards: glossary terms and the questions you got wrong. */
export default function Flashcards() {
  const p = useProgress()
  const [deck, setDeck] = useState<Deck>('all')
  const [flipped, setFlipped] = useState(false)
  const [session, setSession] = useState({ seen: 0, knew: 0 })

  const missed: Card[] = useMemo(() => ALL_QUESTIONS.filter(q => p.answers[q.id] && !p.answers[q.id].lastCorrect).map(q => {
    const l = lessonForQuestion(q.id)
    return { id: `fc:q:${q.id}`, deck: 'missed' as const, kind: 'Question you missed', front: q.prompt, back: q.answer.map(a => q.options[a]).join(' + '), extra: q.explanation, href: l ? `/lesson/${l.id}` : '/sc200/practice' }
  }), [p.answers])

  const pool = deck === 'terms' ? TERM_CARDS : deck === 'missed' ? missed : [...missed, ...TERM_CARDS]
  const now = Date.now()
  const due = pool.filter(c => (p.cards[c.id]?.due ?? 0) <= now)
  // Missed questions and never-seen cards first, then the most overdue.
  const queue = [...due].sort((a, b) => (a.deck === 'missed' ? -1 : 0) - (b.deck === 'missed' ? -1 : 0) || (p.cards[a.id]?.due ?? 0) - (p.cards[b.id]?.due ?? 0))
  const card = queue[0]
  const mastered = pool.filter(c => (p.cards[c.id]?.box ?? 0) >= 5).length
  const learning = pool.filter(c => p.cards[c.id] && (p.cards[c.id].box ?? 0) < 5).length

  const answer = (knew: boolean) => {
    if (!card) return
    actions.reviewCard(card.id, knew)
    setSession(s => ({ seen: s.seen + 1, knew: s.knew + (knew ? 1 : 0) }))
    setFlipped(false)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Study tools" title="Flashcards" icon={Layers} color="var(--t-identity)">
        Spaced repetition: cards you know come back after longer and longer gaps (1, 3, 7, 16, 35 days); cards you miss come back today. Questions you got wrong are added automatically.
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Choose a deck">
        {([['all', 'All cards', missed.length + TERM_CARDS.length], ['missed', 'Questions you missed', missed.length], ['terms', 'Glossary terms', TERM_CARDS.length]] as const).map(([k, label, n]) => (
          <button key={k} onClick={() => { setDeck(k); setFlipped(false) }} aria-pressed={deck === k} className={cx('rounded-full border px-3.5 py-1.5 text-sm transition', deck === k ? 'border-transparent bg-accent font-medium text-[var(--on-accent)]' : 'border-base hover:bg-[var(--surface-2)]')}>{label} <span className="opacity-75">({n})</span></button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="card p-3"><div className="text-2xl font-semibold tabular-nums">{due.length}</div><div className="muted">due now</div></div>
        <div className="card p-3"><div className="text-2xl font-semibold tabular-nums">{learning}</div><div className="muted">learning</div></div>
        <div className="card p-3"><div className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--ok)' }}>{mastered}</div><div className="muted">mastered</div></div>
      </div>

      {deck === 'missed' && missed.length === 0 ? (
        <EmptyState icon={Sparkles} color="var(--t-identity)" title="No missed questions yet" action={{ to: '/sc200/practice', label: 'Practise some questions' }}>
          Questions you answer incorrectly anywhere in the academy become flashcards here, so your weak spots get extra practice.
        </EmptyState>
      ) : !card ? (
        <EmptyState icon={Trophy} color="var(--ok)" title="All caught up!" action={{ to: '/sc200', label: 'Check your exam readiness' }}>
          No cards are due in this deck right now. Come back tomorrow — spaced repetition works best a little every day.
        </EmptyState>
      ) : (
        <div>
          <button onClick={() => setFlipped(f => !f)} aria-live="polite" aria-label={flipped ? 'Hide answer' : 'Show answer'}
            className="card card-hover block min-h-[16rem] w-full p-6 text-left md:p-8" style={{ borderTop: `4px solid ${card.deck === 'missed' ? 'var(--danger)' : 'var(--t-identity)'}` }}>
            <div className="flex items-center justify-between gap-2">
              <Pill color={card.deck === 'missed' ? 'var(--danger)' : 'var(--t-identity)'}>{card.deck === 'missed' ? <XCircle size={11} aria-hidden /> : <BookOpenCheck size={11} aria-hidden />} {card.kind}</Pill>
              <span className="text-xs muted">Box {p.cards[card.id]?.box ?? 0} of 5</span>
            </div>
            <p className={cx('mt-5 leading-relaxed', card.deck === 'terms' ? 'font-serif text-3xl font-semibold' : 'text-lg font-medium')}>{card.front}</p>
            {flipped ? (
              <div className="mt-5 border-t border-base pt-5 animate-rise">
                <p className="text-[16px] font-semibold leading-relaxed">{card.back}</p>
                {card.extra && <p className="mt-2 text-sm leading-relaxed muted">{card.extra}</p>}
              </div>
            ) : <p className="mt-6 text-sm muted">{card.deck === 'terms' ? 'Explain it out loud in one sentence, then tap to check.' : 'Answer it in your head, then tap to check.'}</p>}
          </button>
          {flipped ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="btn !py-3" onClick={() => answer(false)} style={{ color: 'var(--danger)' }}><RotateCcw size={16} aria-hidden /> Not yet</button>
              <button className="btn btn-primary !py-3" onClick={() => answer(true)}><CheckCircle2 size={16} aria-hidden /> I knew it</button>
            </div>
          ) : (
            <button className="btn btn-primary mt-4 w-full !py-3" onClick={() => setFlipped(true)}><Brain size={16} aria-hidden /> Show answer</button>
          )}
          {card.href && flipped && <p className="mt-3 text-center text-sm"><Link className="text-accent" to={card.href}>Review where this is taught →</Link></p>}
          {session.seen > 0 && (
            <div className="mt-6">
              <div className="mb-1 flex justify-between text-xs muted"><span>This session</span><span>{session.knew}/{session.seen} known</span></div>
              <Progress value={(session.knew / session.seen) * 100} color="var(--ok)" label="Session accuracy" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
