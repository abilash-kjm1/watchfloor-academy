import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Search, Moon, Sun, Menu, X, ChevronRight, CheckCircle2, Circle, LayoutDashboard, BookOpenCheck, Terminal, GraduationCap, MessagesSquare, CalendarCheck, FileText, StickyNote, Bookmark, CalendarRange, Settings, Library, ListChecks } from 'lucide-react'
import { MODULES, TRACKS } from '../data/curriculum'
import { lessonById } from '../data'
import { useProgress } from '../progress/store'
import { search, type SearchItem } from './searchIndex'
import { cx } from './ui'

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('soc-academy:theme', dark ? 'dark' : 'light') } catch { /* ignore */ }
  }, [dark])
  return [dark, setDark] as const
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-semibold">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="7" fill="var(--accent)" />
        <path d="M16 6l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V9z" fill="none" stroke="var(--surface)" strokeWidth="2.2" />
        <path d="M12 16l3 3 5-6" fill="none" stroke="var(--surface)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[15px] tracking-tight">Watchfloor <span className="muted font-normal">Academy</span></span>
    </Link>
  )
}

const TOOLS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/curriculum', label: 'Curriculum', icon: Library },
  { to: '/kql', label: 'KQL reference', icon: Terminal },
  { to: '/sc200', label: 'SC-200 objectives', icon: GraduationCap },
  { to: '/sc200/practice', label: 'Exam practice', icon: ListChecks },
  { to: '/interview', label: 'Interview mode', icon: MessagesSquare },
  { to: '/daily', label: 'Daily challenge', icon: CalendarCheck },
  { to: '/tickets', label: 'Ticket writing', icon: FileText },
  { to: '/glossary', label: 'Glossary', icon: BookOpenCheck },
]
const MINE = [
  { to: '/plan', label: 'Study plan', icon: CalendarRange },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/settings', label: 'Settings & data', icon: Settings },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const p = useProgress()
  const loc = useLocation()
  const activeModule = MODULES.find(m => loc.pathname === `/module/${m.id}` || m.lessons.some(l => loc.pathname === `/lesson/${l}`))?.id
  const [open, setOpen] = useState<Record<string, boolean>>(() => (activeModule ? { [activeModule]: true } : {}))
  useEffect(() => { if (activeModule) setOpen(o => ({ ...o, [activeModule]: true })) }, [activeModule])
  const item = 'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition hover:bg-[var(--surface-2)]'
  const activeCls = 'bg-accent-soft text-accent font-medium'
  return (
    <nav className="space-y-6 text-sm" aria-label="Main">
      <div className="space-y-0.5">
        {TOOLS.map(t => (
          <NavLink key={t.to} to={t.to} end onClick={onNavigate} className={({ isActive }) => cx(item, isActive && activeCls)}>
            <t.icon size={16} aria-hidden /> {t.label}
          </NavLink>
        ))}
      </div>
      <div>
        <div className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider muted">Curriculum</div>
        {TRACKS.map(track => (
          <div key={track.id} className="mb-3">
            <div className="px-2.5 py-1 text-xs font-semibold">{track.title}</div>
            {track.modules.map(mid => {
              const m = MODULES.find(x => x.id === mid)
              if (!m) return null
              const done = m.lessons.filter(l => p.completed[l]).length
              const isOpen = open[m.id]
              return (
                <div key={m.id}>
                  <div className="flex items-center">
                    <button className="rounded p-1 muted hover:bg-[var(--surface-2)]" onClick={() => setOpen(o => ({ ...o, [m.id]: !o[m.id] }))} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${m.title}`} aria-expanded={!!isOpen} disabled={!m.lessons.length}>
                      <ChevronRight size={14} className={cx('transition', isOpen && 'rotate-90', !m.lessons.length && 'opacity-0')} />
                    </button>
                    <NavLink to={`/module/${m.id}`} onClick={onNavigate} className={({ isActive }) => cx('flex flex-1 items-center justify-between gap-2 rounded-md px-1.5 py-1 hover:bg-[var(--surface-2)]', isActive && activeCls)}>
                      <span className={cx(m.status === 'outline' && 'muted')}>{m.title}</span>
                      {m.lessons.length > 0 && <span className="font-mono text-[10px] muted">{done}/{m.lessons.length}</span>}
                    </NavLink>
                  </div>
                  {isOpen && m.lessons.map(lid => {
                    const l = lessonById.get(lid)
                    if (!l) return null
                    return (
                      <NavLink key={lid} to={`/lesson/${lid}`} onClick={onNavigate} className={({ isActive }) => cx('ml-6 flex items-start gap-2 rounded-md px-2 py-1 text-[13px] hover:bg-[var(--surface-2)]', isActive && activeCls)}>
                        {p.completed[lid] ? <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--both)' }} /> : <Circle size={13} className="mt-0.5 shrink-0 muted" />}
                        <span className="leading-snug">{l.title}</span>
                      </NavLink>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="space-y-0.5">
        <div className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider muted">My learning</div>
        {MINE.map(t => (
          <NavLink key={t.to} to={t.to} onClick={onNavigate} className={({ isActive }) => cx(item, isActive && activeCls)}>
            <t.icon size={16} aria-hidden /> {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const nav = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const results: SearchItem[] = search(q)
  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => setSel(0), [q])
  const go = (r: SearchItem) => { onClose(); nav(r.href) }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh]" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search">
      <div className="card w-full max-w-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-base px-4">
          <Search size={18} className="muted" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(results.length - 1, s + 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)) }
              if (e.key === 'Enter' && results[sel]) go(results[sel])
            }}
            placeholder="Search lessons, concepts, KQL, Event IDs, MITRE, tables, objectives…"
            className="w-full bg-transparent py-4 text-[15px] outline-none"
            aria-label="Search the academy"
          />
          <kbd className="rounded border border-base px-1.5 text-[11px] muted">Esc</kbd>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin" role="listbox">
          {q && results.length === 0 && <li className="p-6 text-center text-sm muted">No matches. Try a table name, an Event ID such as 4624, or a technique such as T1110.</li>}
          {!q && <li className="p-6 text-center text-sm muted">Try “4624”, “has vs contains”, “DeviceNetworkEvents”, “T1059”, “playbook”.</li>}
          {results.map((r, i) => (
            <li key={r.kind + r.href + r.title} role="option" aria-selected={i === sel}>
              <button onClick={() => go(r)} onMouseEnter={() => setSel(i)} className={cx('w-full rounded-lg px-3 py-2.5 text-left', i === sel && 'bg-[var(--surface-2)]')}>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">{r.kind}</span>
                  <span className="truncate text-sm font-medium">{r.title}</span>
                </div>
                <div className="mt-0.5 truncate text-xs muted">{r.subtitle}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const [dark, setDark] = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const loc = useLocation()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    if (loc.hash) {
      const t = setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ block: 'start' }), 30)
      return () => clearTimeout(t)
    }
    window.scrollTo(0, 0)
  }, [loc.pathname, loc.hash])

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 btn">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-base" style={{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(8px)' }}>
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4">
          <button className="btn !p-1.5 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open navigation"><Menu size={18} /></button>
          <Logo />
          <button onClick={() => setSearchOpen(true)} className="ml-auto flex w-full max-w-sm items-center gap-2 rounded-lg border border-base px-3 py-1.5 text-sm muted transition hover:bg-[var(--surface-2)] sm:ml-8" aria-label="Search (Ctrl+K)">
            <Search size={15} aria-hidden />
            <span className="hidden sm:inline">Search the academy…</span>
            <kbd className="ml-auto hidden rounded border border-base px-1.5 text-[11px] sm:inline">Ctrl K</kbd>
          </button>
          <button className="btn !p-1.5" onClick={() => setDark(!dark)} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r border-base px-3 py-6 scrollbar-thin lg:block">
          <Sidebar />
        </aside>
        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto px-3 py-4 scrollbar-thin" style={{ background: 'var(--bg)' }}>
              <div className="mb-4 flex items-center justify-between px-2"><Logo /><button className="btn !p-1.5" onClick={() => setDrawer(false)} aria-label="Close navigation"><X size={18} /></button></div>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        )}
        <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12">{children}</main>
      </div>
      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
