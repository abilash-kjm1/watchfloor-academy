import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <div className="font-mono text-sm muted">404</div>
      <h1 className="mt-2 font-serif text-3xl font-semibold">Nothing logged at this address</h1>
      <p className="mt-3 muted">The page you're looking for doesn't exist. Try search (Ctrl K) or the curriculum.</p>
      <div className="mt-6 flex justify-center gap-3"><Link className="btn btn-primary" to="/curriculum">Curriculum</Link><Link className="btn" to="/">Home</Link></div>
    </div>
  )
}
