import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, Flame, FlaskConical, GraduationCap, History, LayoutDashboard, MessagesSquare, PlayCircle, Sparkles, Target, Terminal, TreeDeciduous, Trophy, Clock, CheckCircle2 } from 'lucide-react'
import { useProgress, streak, today } from '../progress/store'
import { computeSkills, interviewReadiness, overallProgress, recommendedLesson, weakConcepts } from '../progress/skills'
import { LESSONS, lessonById } from '../data'
import { moduleById } from '../data/curriculum'
import { OBJECTIVES } from '../data/sc200'
import { glossaryById } from '../data/glossary'
import { Card, EmptyState, IconBadge, PageHeader, Progress, ProgressRing, StatCard } from '../components/ui'
import { moduleIcon, trackTheme } from '../theme'

const SKILL_COLORS = ['var(--t-foundations)', 'var(--t-identity)', 'var(--t-security)', 'var(--t-soc)', 'var(--t-microsoft)', 'var(--t-investigation)', 'var(--t-cert)', 'var(--t-career)', 'var(--t-start)']

export default function Dashboard() {
  const p = useProgress()
  const ov = overallProgress(p)
  const skills = computeSkills(p)
  const weak = weakConcepts(p).slice(0, 5)
  const next = recommendedLesson(p)
  const mod = next ? moduleById(next.moduleId) : undefined
  const th = trackTheme(mod?.track)
  const NextIcon = moduleIcon(next?.moduleId ?? '')
  const st = streak(p.days)
  const iv = interviewReadiness(p)
  const kql = skills.find(s => s.id === 'kql')!
  const objCovered = OBJECTIVES.filter(o => o.lessons.length && o.lessons.every(l => p.completed[l])).length
  const lastExam = p.exams[0]
  const labsDone = Object.keys(p.labs).length
  const dailyDone = !!p.dailyDone[today()]

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Dashboard" title="Your learning at a glance" icon={LayoutDashboard}>Skill levels come from how you perform on questions and interview practice — not from how many pages you have opened.</PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={BookOpenCheck} color="var(--t-foundations)" label="Overall progress" value={`${ov.pct}%`} hint={`${ov.done} of ${ov.total} lessons`} />
        <StatCard icon={Target} color="var(--t-investigation)" label="Question accuracy" value={ov.accuracy === null ? '—' : `${ov.accuracy}%`} hint={`${ov.answered} questions answered`} />
        <StatCard icon={Flame} color="var(--t-soc)" label="Day streak" value={st} hint={`${p.xp} XP earned`} />
        <StatCard icon={MessagesSquare} color="var(--t-career)" label="Interview readiness" value={`${iv}%`} hint="Average key-point coverage" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {next ? (
          <Link to={`/lesson/${next.id}`} className="card card-hover group relative overflow-hidden p-6 lg:col-span-2">
            <div className="pointer-events-none absolute -right-8 -top-8 opacity-10" style={{ color: th.color }} aria-hidden><NextIcon size={180} /></div>
            <div className="relative flex items-center gap-2 text-sm font-semibold" style={{ color: th.color }}><PlayCircle size={16} aria-hidden /> Recommended next</div>
            <div className="relative mt-1 text-xs muted">Module {mod?.number}: {mod?.title}</div>
            <h2 className="relative mt-1 text-2xl font-semibold">{next.title}</h2>
            <p className="relative mt-1 max-w-xl text-sm leading-relaxed muted">{next.summary}</p>
            {weak[0]?.lesson?.id === next.id && <p className="relative mt-2 text-sm" style={{ color: 'var(--exam)' }}>Recommended because you've been missing questions on “{weak[0].concept}”.</p>}
            <div className="relative mt-5 flex flex-wrap items-center gap-4">
              <span className="btn btn-primary">Continue <ArrowRight size={16} aria-hidden /></span>
              <span className="inline-flex items-center gap-1 text-sm muted"><Clock size={14} aria-hidden /> about {next.minutes} min</span>
            </div>
          </Link>
        ) : (
          <div className="lg:col-span-2">
            <EmptyState icon={Trophy} color="var(--ok)" title="Every available lesson complete!" action={{ to: '/sc200/practice', label: 'Take a practice exam' }}>
              Brilliant work. Keep your knowledge sharp with the practice exam, interview mode and the daily challenge.
            </EmptyState>
          </div>
        )}
        <Card className="relative overflow-hidden p-6" style={{ background: 'linear-gradient(160deg, color-mix(in srgb, var(--t-soc) 12%, var(--surface)), var(--surface))' }}>
          <IconBadge icon={dailyDone ? CheckCircle2 : Flame} color={dailyDone ? 'var(--ok)' : 'var(--t-soc)'} />
          <div className="mt-3 font-semibold">Daily challenge</div>
          <p className="mt-1 text-sm leading-relaxed muted">{dailyDone ? `Done today: ${p.dailyDone[today()].correct}/${p.dailyDone[today()].total}. Come back tomorrow to keep your streak.` : 'Five quick questions mixed from what you have studied — about five minutes.'}</p>
          <Link to="/daily" className="btn mt-4">{dailyDone ? 'Review answers' : 'Start today\'s challenge'}</Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-1 flex items-center gap-2 font-semibold"><TreeDeciduous size={18} className="text-accent" aria-hidden /> Skill tree</h2>
          <p className="mb-5 text-xs muted">15% lessons completed · 65% question accuracy (weighted by how many you've answered) · 20% interview practice.</p>
          <div className="space-y-3.5">
            {skills.map((s, i) => (
              <div key={s.id} className="grid grid-cols-[8.5rem_1fr_6.5rem] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_7.5rem]">
                <span className="flex items-center gap-2 truncate"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SKILL_COLORS[i % SKILL_COLORS.length] }} aria-hidden />{s.name}</span>
                <Progress value={s.score} color={SKILL_COLORS[i % SKILL_COLORS.length]} label={`${s.name} skill`} />
                <span className="text-right text-xs muted">{s.level} · {s.score}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Focus areas</h2>
          <div className="grid grid-cols-2 gap-4 text-center text-sm">
            <div className="flex flex-col items-center gap-2"><ProgressRing value={kql.score} size={76} stroke={8} color="var(--t-investigation)" label="KQL skill" /><span className="flex items-center gap-1"><Terminal size={13} aria-hidden /> KQL</span></div>
            <div className="flex flex-col items-center gap-2"><ProgressRing value={(objCovered / OBJECTIVES.length) * 100} size={76} stroke={8} color="var(--t-cert)" label="SC-200 objectives studied">{objCovered}/{OBJECTIVES.length}</ProgressRing><span className="flex items-center gap-1"><GraduationCap size={13} aria-hidden /> SC-200</span></div>
          </div>
          <dl className="mt-5 space-y-2.5 border-t border-base pt-4 text-sm">
            <div className="flex justify-between"><dt className="flex items-center gap-1.5"><Trophy size={14} style={{ color: 'var(--t-cert)' }} aria-hidden /> Last practice exam</dt><dd className="font-medium">{lastExam ? `${Math.round((lastExam.correct / lastExam.total) * 100)}%` : '—'}</dd></div>
            <div className="flex justify-between"><dt className="flex items-center gap-1.5"><FlaskConical size={14} style={{ color: 'var(--t-career)' }} aria-hidden /> Labs completed</dt><dd className="font-medium">{labsDone}/{LESSONS.length}</dd></div>
          </dl>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-1 flex items-center gap-2 font-semibold"><Sparkles size={16} style={{ color: 'var(--t-identity)' }} aria-hidden /> Personalized review</h2>
          <p className="mb-4 text-xs muted">Concepts you've answered incorrectly recently or below 60% accuracy.</p>
          {weak.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-base p-6 text-center">
              <Sparkles size={26} className="mx-auto" style={{ color: 'var(--t-identity)' }} aria-hidden />
              <div className="mt-2 font-medium">No weak spots detected yet</div>
              <p className="mt-1 text-sm muted">Answer quiz questions in any lesson and this list will adapt to what you find tricky.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {weak.map(w => {
                const g = [...glossaryById.values()].find(t => t.term.toLowerCase() === w.concept.toLowerCase() || w.concept.toLowerCase().includes(t.term.toLowerCase()))
                return (
                  <li key={w.concept} className="rounded-2xl border border-base p-4 text-sm">
                    <div className="flex justify-between gap-2"><span className="font-semibold">{w.concept}</span><span className="text-xs muted">{Math.round(w.accuracy * 100)}% over {w.attempts} attempt{w.attempts === 1 ? '' : 's'}</span></div>
                    <Progress className="mt-2 !h-1.5" value={w.accuracy * 100} color="var(--danger)" label={`${w.concept} accuracy`} />
                    <div className="mt-3 flex flex-wrap gap-2">
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
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><History size={16} style={{ color: 'var(--t-microsoft)' }} aria-hidden /> Recent activity</h2>
          {p.activity.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-base p-6 text-center">
              <History size={26} className="mx-auto" style={{ color: 'var(--t-microsoft)' }} aria-hidden />
              <div className="mt-2 font-medium">Your learning history starts here</div>
              <p className="mt-1 text-sm muted">Complete a lesson or a lab and it will appear in this timeline.</p>
              <Link to="/lesson/start-here" className="btn btn-primary mt-4">Start the first lesson</Link>
            </div>
          ) : (
            <ol className="relative space-y-3 border-l-2 border-base pl-5">
              {p.activity.slice(0, 8).map(a => (
                <li key={a.ts} className="relative text-sm">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2" style={{ borderColor: 'var(--t-microsoft)', background: 'var(--surface)' }} aria-hidden />
                  <Link to={a.href} className="font-medium hover:text-accent">{a.text}</Link>
                  <div className="text-xs muted">{new Date(a.ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                </li>
              ))}
            </ol>
          )}
          {Object.keys(p.completed).length > 0 && (
            <div className="mt-5 border-t border-base pt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider muted">Completed lessons</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(p.completed).map(id => lessonById.get(id)).filter(Boolean).map(l => <Link key={l!.id} to={`/lesson/${l!.id}`} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}><CheckCircle2 size={11} aria-hidden />{l!.title}</Link>)}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
