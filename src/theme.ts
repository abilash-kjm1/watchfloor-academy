import {
  Compass, Cpu, Network, MonitorSmartphone, TerminalSquare, Fingerprint, KeyRound, ShieldHalf, Bug, MailWarning, UserCheck,
  Crosshair, Radar, ScrollText, Database, Search, Shield, Layers, Laptop, Mail, Users, Telescope, Siren, FlaskConical, Workflow,
  Binoculars, GraduationCap, MessagesSquare, FileText, Briefcase, Rocket, Boxes, BookOpen, Cloud, FileSearch, type LucideIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'

export interface TrackTheme { id: string; color: string; soft: string; deep: string; icon: LucideIcon; tagline: string }

const t = (id: string, icon: LucideIcon, tagline: string): TrackTheme => ({
  id, icon, tagline, color: `var(--t-${id})`, soft: `var(--t-${id}-soft)`, deep: `var(--t-${id}-deep)`,
})

export const TRACK_THEME: Record<string, TrackTheme> = {
  start: t('start', Compass, 'Find your bearings'),
  foundations: t('foundations', Cpu, 'How computers and networks really work'),
  identity: t('identity', Fingerprint, 'Who is signing in — and should they be?'),
  security: t('security', ShieldHalf, 'Threats, malware and phishing, explained'),
  soc: t('soc', Radar, 'How a security operations center thinks'),
  microsoft: t('microsoft', Shield, 'Sentinel and the Defender family'),
  investigation: t('investigation', Search, 'KQL, hunting and incident response'),
  cert: t('cert', GraduationCap, 'Pass SC-200 with confidence'),
  career: t('career', Briefcase, 'Interviews, tickets and portfolio'),
}

export const trackTheme = (id: string | undefined): TrackTheme => TRACK_THEME[id ?? ''] ?? TRACK_THEME.start

export const MODULE_ICON: Record<string, LucideIcon> = {
  orientation: Compass, computers: Cpu, networking: Network, windows: MonitorSmartphone, linux: TerminalSquare,
  'active-directory': Users, 'entra-id': KeyRound, 'identity-security': UserCheck,
  'cyber-fundamentals': ShieldHalf, malware: Bug, phishing: MailWarning,
  soc: Radar, logging: ScrollText, siem: Database, 'threat-intel': Telescope, mitre: Crosshair,
  sentinel: Shield, 'defender-xdr': Layers, mde: Laptop, mdo: Mail, mdi: Fingerprint, 'cloud-security': Cloud, 'm365-investigation': FileSearch,
  kql: Search, 'advanced-hunting': Binoculars, 'incident-response': Siren, 'detection-engineering': FlaskConical,
  soar: Workflow, 'threat-hunting': Binoculars, sc200: GraduationCap, interview: MessagesSquare,
  'ticket-writing': FileText, projects: Rocket,
}
export const moduleIcon = (id: string): LucideIcon => MODULE_ICON[id] ?? Boxes
export const LessonIcon = BookOpen

/** CSS variables that recolor lesson prose (headings, bullets, key ideas) to the track color. */
export const lessonVars = (trackId: string | undefined): CSSProperties => ({ ['--lesson-color' as string]: trackTheme(trackId).color })
