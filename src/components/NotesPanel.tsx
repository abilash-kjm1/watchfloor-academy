import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { actions, useProgress } from '../progress/store'
import type { Note } from '../data/types'

export function NoteEditor({ initial, lessonId, onDone }: { initial?: Note; lessonId?: string; onDone?: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const save = () => {
    if (!body.trim() && !title.trim()) return
    actions.saveNote({ id: initial?.id, lessonId: initial?.lessonId ?? lessonId, title: title.trim() || body.trim().slice(0, 40), body })
    if (!initial) { setTitle(''); setBody('') }
    onDone?.()
  }
  return (
    <div className="space-y-2">
      <input className="input" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} aria-label="Note title" />
      <textarea className="input min-h-24" placeholder="Write in your own words — explaining it is how you learn it." value={body} onChange={e => setBody(e.target.value)} aria-label="Note text" />
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={save}>{initial ? 'Save changes' : 'Add note'}</button>
        {onDone && initial && <button className="btn" onClick={onDone}>Cancel</button>}
      </div>
    </div>
  )
}

export function NoteItem({ n, showLesson }: { n: Note; showLesson?: string }) {
  const [editing, setEditing] = useState(false)
  if (editing) return <div className="card p-4"><NoteEditor initial={n} onDone={() => setEditing(false)} /></div>
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{n.title}</div>
          <div className="text-xs muted">{showLesson && <>{showLesson} · </>}{new Date(n.updated).toLocaleString()}</div>
        </div>
        <div className="flex gap-1">
          <button className="rounded p-1 hover:bg-[var(--surface-2)]" onClick={() => setEditing(true)} aria-label="Edit note"><Pencil size={14} /></button>
          <button className="rounded p-1 hover:bg-[var(--surface-2)]" onClick={() => { if (confirm('Delete this note?')) actions.deleteNote(n.id) }} aria-label="Delete note"><Trash2 size={14} /></button>
        </div>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{n.body}</p>
    </div>
  )
}

export function NotesPanel({ lessonId }: { lessonId: string }) {
  const p = useProgress()
  const notes = p.notes.filter(n => n.lessonId === lessonId)
  return (
    <div className="space-y-3">
      <NoteEditor lessonId={lessonId} />
      {notes.map(n => <NoteItem key={n.id} n={n} />)}
    </div>
  )
}
