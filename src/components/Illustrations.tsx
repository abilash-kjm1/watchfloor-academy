/**
 * Decorative SVG illustrations. Colors come from CSS tokens so they adapt to
 * light and dark mode. All are aria-hidden with a text alternative nearby.
 */
import type { ReactNode } from 'react'

function Node({ x, y, color, label, children }: { x: number; y: number; color: string; label: string; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-34} y={-30} width={68} height={60} rx={16} fill="var(--surface)" stroke={`color-mix(in srgb, ${color} 45%, var(--border))`} strokeWidth={1.5} />
      <g stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(-12 -20)">{children}</g>
      <text y={22} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--muted)" fontFamily="Inter, sans-serif">{label}</text>
    </g>
  )
}

export function HeroIllustration() {
  const hub = { x: 250, y: 190 }
  const sources = [
    { x: 70, y: 70, color: 'var(--t-foundations)', label: 'Devices', icon: <><rect x={2} y={3} width={20} height={13} rx={2} /><path d="M8 20h8M12 16v4" /></> },
    { x: 70, y: 190, color: 'var(--t-identity)', label: 'Identity', icon: <><circle cx={12} cy={8} r={4} /><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" /></> },
    { x: 70, y: 310, color: 'var(--t-security)', label: 'Email', icon: <><rect x={2} y={4} width={20} height={16} rx={2} /><path d="M2 6l10 7 10-7" /></> },
    { x: 430, y: 70, color: 'var(--t-microsoft)', label: 'Cloud', icon: <path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 2A3 3 0 0 0 7 18z" /> },
  ]
  return (
    <div className="relative" aria-hidden>
      <svg viewBox="0 0 500 380" className="w-full drop-shadow-sm">
        <defs>
          <linearGradient id="hub-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--t-identity)" /><stop offset="1" stopColor="var(--t-foundations)" /></linearGradient>
          <radialGradient id="glow"><stop offset="0" stopColor="var(--t-foundations)" stopOpacity=".28" /><stop offset="1" stopColor="var(--t-foundations)" stopOpacity="0" /></radialGradient>
        </defs>
        <circle cx={hub.x} cy={hub.y} r={120} fill="url(#glow)" />
        <circle cx={hub.x} cy={hub.y} r={92} fill="none" stroke="var(--border)" strokeDasharray="3 6" />
        {sources.map(s => (
          <path key={s.label} d={`M${s.x + (s.x < hub.x ? 34 : -34)} ${s.y} C ${(s.x + hub.x) / 2} ${s.y}, ${(s.x + hub.x) / 2} ${hub.y}, ${hub.x + (s.x < hub.x ? -46 : 46)} ${hub.y}`} fill="none" stroke={s.color} strokeWidth={2} className="animate-dash" opacity={.75} />
        ))}
        <path d={`M${hub.x + 46} ${hub.y} C 360 ${hub.y}, 360 300, 392 300`} fill="none" stroke="var(--t-investigation)" strokeWidth={2} className="animate-dash" opacity={.8} />
        {sources.map(s => <Node key={s.label} x={s.x} y={s.y} color={s.color} label={s.label}>{s.icon}</Node>)}
        {/* hub: the SOC / SIEM */}
        <g transform={`translate(${hub.x} ${hub.y})`}>
          <rect x={-46} y={-46} width={92} height={92} rx={26} fill="url(#hub-g)" />
          <path d="M0 -24l18 7v13c0 11-7.5 19-18 22-10.5-3-18-11-18-22v-13z" fill="none" stroke="#fff" strokeWidth={3} />
          <path d="M-8 0l6 6 11-12" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          <text y={66} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)" fontFamily="Inter, sans-serif">SOC · SIEM</text>
        </g>
        {/* analyst card */}
        <g transform="translate(392 262)">
          <rect x={0} y={0} width={100} height={80} rx={14} fill="var(--surface)" stroke="color-mix(in srgb, var(--t-investigation) 45%, var(--border))" strokeWidth={1.5} />
          <circle cx={16} cy={18} r={5} fill="var(--t-soc)" />
          <rect x={27} y={14} width={58} height={8} rx={4} fill="var(--surface-2)" />
          <rect x={12} y={34} width={76} height={6} rx={3} fill="var(--surface-2)" />
          <rect x={12} y={46} width={56} height={6} rx={3} fill="var(--surface-2)" />
          <rect x={12} y={60} width={40} height={10} rx={5} fill="color-mix(in srgb, var(--t-investigation) 22%, transparent)" />
          <text x={50} y={96} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--muted)" fontFamily="Inter, sans-serif">Analyst</text>
        </g>
      </svg>
      <div className="card absolute -bottom-2 left-2 hidden items-center gap-2 px-3 py-2 text-xs font-medium animate-float sm:flex">
        <span className="h-2 w-2 rounded-full" style={{ background: 'var(--ok)' }} /> Signals → evidence → decision
      </div>
    </div>
  )
}
