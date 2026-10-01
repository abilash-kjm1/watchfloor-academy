import { Link } from 'react-router-dom'
import { ArrowRight, Flame, Sparkles, Target, Trophy } from 'lucide-react'
import { useProgress, streak, today } from '../progress/store'
import { computeSkills, interviewReadiness, overallProgress, recommendedLesson, weakConcepts } from '../progress/skills'
import { LESSONS, lessonById } from '../data'
import { moduleById } from '../data/curriculum'
import { OBJECTIVES } from '../data/sc200'
import { glossaryById } from '../data/glossary'
import { Card, Empty, PageHeader, Progress } from '../components/ui'

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase tracking-wider muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs muted">{sub}</div>}
    </Card>
  )
}

export default function Dashboard() {
  const p = useProgress()
  const ov = overallProgress(p)
  const skills = computeSkills(p)
  const weak = weakConcepts(p).slice(0, 5)
  const next = recommendedLesson(p)
  const mod = next ? moduleById(next.moduleId) : undefined
  const st = streak(p.days)
  const iv = interviewReadiness(p)
  const kql = skills.find(s => s.id === 'kql')!
  const objCovered = OBJECTIVES.filter(o => o.lessons.length && o.lessons.every(l => p.completed[l])).length
  const lastExam = p.exams[0]
  const labsDone = Object.keys(p.labs).length
  const dailyDone = !!p.dailyDone[today()]

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Dashboard" title="Your learning at a glance">Skill levels below come from how you perform on questions and interview practice — not from how many pages you have opened.</PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Overall progress" value={`${ov.pct}%`} sub={`${ov.done} of ${ov.total} lessons`} />
        <Stat label="Question accuracy" value={ov.accuracy === null ? '—' : `${ov.accuracy}%`} sub={`${ov.answered} questions answered`} />
        <Stat label="Streak" value={`${st} day${st === 1 ? '' : 's'}`} sub={`${p.xp} XP earned`} />
        <Stat label="Interview readiness" value={`${iv}%`} sub="Avg key-point coverage" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent"><Target size={16} /> Recommended next</div>
          {next ? (
            <>
              <div className="text-xs muted">Module {mod?.number}: {mod?.title}</div>
              <h2 className="mt-1 text-xl font-semibold">{next.title}</h2>
              <p className="mt-1 text-sm muted">{next.summary}</p>
              {weak[0]?.lesson?.id === next.id && <p className="mt-2 text-sm" style={{ color: 'var(--exam)' }}>Recommended because you've been missing questions on “{weak[0].concept}”.</p>}
              <Link to={`/lesson/${next.id}`} className="btn btn-primary mt-4">Continue <ArrowRight size={16} /></Link>
            </>
          ) : <p className="text-sm muted">You've completed every available lesson. Head to <Link className="text-accent" to="/sc200/practice">exam practice</Link> or <Link className="text-accent" to="/interview">interview mode</Link>.</p>}
        </Card>
        <Card className="p-6">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent"><Flame size={16} /> Daily challenge</div>
          <p className="text-sm muted">{dailyDone ? `Done today: ${p.dailyDone[today()].correct}/${p.dailyDone[today()].total}. Come back tomorrow.` : 'Five quick questions mixed from what you have studied — about five minutes.'}</p>
          <Link to="/daily" className="btn mt-4">{dailyDone ? 'Review' : 'Start today\'s challenge'}</Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-1 font-semibold">Skill tree</h2>
          <p className="mb-4 text-xs muted">15% lessons completed · 65% question accuracy (weighted by how many you've answered) · 20% interview practice.</p>
          <div className="space-y-3">
            {skills.map(s => (
              <div key={s.id} className="grid grid-cols-[9rem_1fr_6.5rem] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_7rem]">
                <span className="truncate">{s.name}</span>
                <Progress value={s.score} label={`${s.name} skill`} />
                <span className="text-right text-xs muted">{s.level} · {s.score}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 font-semibold">Focus areas</h2>
            <div className="space-y-4 text-sm">
              <div><div className="flex justify-between"><span>KQL</span><span className="muted">{kql.score}/100</span></div><Progress className="mt-1" value={kql.score} label="KQL" /></div>
              <div><div className="flex justify-between"><span>SC-200 objectives studied</span><span className="muted">{objCovered}/{OBJECTIVES.length}</span></div><Progress className="mt-1" value={(objCovered / OBJECTIVES.length) * 100} label="SC-200 objectives" /></div>
              <div className="flex justify-between"><span>Last practice exam</span><span className="muted">{lastExam ? `${Math.round((lastExam.correct / lastExam.total) * 100)}%` : '—'}</span></div>
              <div className="flex justify-between"><span>Labs completed</span><span className="muted">{labsDone}/{LESSONS.length}</span></div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-1 flex items-center gap-2 font-semibold"><Sparkles size={16} className="text-accent" /> Personalized review</h2>
          <p className="mb-4 text-xs muted">Concepts you've answered incorrectly recently or below 60% accuracy.</p>
          {weak.length === 0 ? <Empty>No weak spots detected yet. Answer some quiz questions and this will adapt.</Empty> : (
            <ul className="space-y-3">
              {weak.map(w => {
                const g = [...glossaryById.values()].find(t => t.term.toLowerCase() === w.concept.toLowerCase() || w.concept.toLowerCase().includes(t.term.toLowerCase()))
                return (
                  <li key={w.concept} className="rounded-lg surface-2 p-3 text-sm">
                    <div className="flex justify-between gap-2"><span className="font-medium">{w.concept}</span><span className="muted">{Math.round(w.accuracy * 100)}% over {w.attempts} attempt{w.attempts === 1 ? '' : 's'}</span></div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {w.lesson && <Link className="btn !py-1 text-xs" to={`/lesson/${w.lesson.id}`}>1 · Re-read: {w.lesson.title}</Link>}
                      {g && <Link className="btn !py-1 text-xs" to={`/glossary?term=${g.id}`}>2 · Glossary: {g.term}</Link>}
                      {w.lesson && <Link className="btn !py-1 text-xs" to={`/lesson/${w.lesson.id}#quiz`}>3 · Retry the questions</Link>}
                      {w.lesson && <Link className="btn !py-1 text-xs" to={`/lesson/${w.lesson.id}#think`}>4 · Analyst exercise</Link>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Trophy size={16} className="text-accent" /> Recent activity</h2>
          {p.activity.length === 0 ? <Empty>Nothing yet — complete a lesson or a lab to start your history.</Empty> : (
            <ul className="space-y-2 text-sm">
              {p.activity.slice(0, 8).map(a => (
                <li key={a.ts} className="flex justify-between gap-3">
                  <Link to={a.href} className="hover:text-accent">{a.text}</Link>
                  <span className="shrink-0 text-xs muted">{new Date(a.ts).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
          {Object.keys(p.completed).length > 0 && (
            <div className="mt-5 border-t border-base pt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider muted">Completed lessons</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(p.completed).map(id => lessonById.get(id)).filter(Boolean).map(l => <Link key={l!.id} to={`/lesson/${l!.id}`} className="rounded-full border border-base px-2.5 py-0.5 text-xs hover:border-[var(--accent)]">{l!.title}</Link>)}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
