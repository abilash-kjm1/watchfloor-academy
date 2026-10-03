import type { Module, ModuleStarter, Skill } from './types'
import { res } from './resources'

export const SKILLS: Skill[] = [
  { id: 'soc', name: 'SOC Operations', blurb: 'Roles, workflow, triage, escalation, verdicts.' },
  { id: 'computers', name: 'Computer Fundamentals', blurb: 'Processes, services, memory, permissions.' },
  { id: 'networking', name: 'Networking', blurb: 'TCP/IP, ports, DNS, protocols and their evidence.' },
  { id: 'windows', name: 'Windows', blurb: 'Processes, event logs, Event IDs as evidence.' },
  { id: 'linux', name: 'Linux', blurb: 'Users, permissions, services, syslog.' },
  { id: 'identity', name: 'Identity', blurb: 'Active Directory, Entra ID, authentication.' },
  { id: 'logging', name: 'Logging & Telemetry', blurb: 'Reading log fields and sources.' },
  { id: 'siem', name: 'SIEM', blurb: 'Ingestion, normalization, correlation, detection.' },
  { id: 'kql', name: 'KQL', blurb: 'Querying security data with Kusto Query Language.' },
  { id: 'sentinel', name: 'Microsoft Sentinel', blurb: 'Workspace, connectors, analytics rules, incidents.' },
  { id: 'defender', name: 'Defender XDR', blurb: 'Unified incidents across endpoint, email, identity, cloud.' },
  { id: 'hunting', name: 'Threat Hunting', blurb: 'Advanced Hunting tables and hypothesis-driven hunts.' },
  { id: 'ir', name: 'Incident Response', blurb: 'Triage, scope, contain, eradicate, recover.' },
  { id: 'mitre', name: 'MITRE ATT&CK', blurb: 'Tactics, techniques, mapping detections.' },
  { id: 'threatintel', name: 'Threat Intelligence', blurb: 'IOCs, IOAs, TTPs, enrichment.' },
]

/** Sidebar grouping (brief §54). Module ids in display order. */
export const TRACKS: { id: string; title: string; modules: string[] }[] = [
  { id: 'start', title: 'Start here', modules: ['orientation'] },
  { id: 'foundations', title: 'Foundations', modules: ['computers', 'networking', 'windows', 'linux'] },
  { id: 'identity', title: 'Identity', modules: ['active-directory', 'entra-id', 'identity-security'] },
  { id: 'security', title: 'Security Concepts', modules: ['cyber-fundamentals', 'malware', 'phishing'] },
  { id: 'soc', title: 'SOC', modules: ['soc', 'logging', 'siem', 'threat-intel', 'mitre'] },
  { id: 'microsoft', title: 'Microsoft Security', modules: ['sentinel', 'defender-xdr', 'mde', 'mdo', 'mdi', 'cloud-security', 'm365-investigation'] },
  { id: 'investigation', title: 'Investigation', modules: ['kql', 'advanced-hunting', 'incident-response', 'detection-engineering', 'soar', 'threat-hunting'] },
  { id: 'cert', title: 'Certification', modules: ['sc200'] },
  { id: 'career', title: 'Career', modules: ['interview', 'ticket-writing', 'projects'] },
]

/** Recommended learning order (brief §1). */
export const LEARNING_PATH = [
  'orientation', 'computers', 'networking', 'windows', 'linux', 'active-directory', 'entra-id', 'identity-security', 'cyber-fundamentals', 'malware', 'phishing',
  'soc', 'threat-intel', 'mitre', 'logging', 'siem', 'kql', 'sentinel', 'defender-xdr', 'mde', 'mdo', 'mdi', 'cloud-security', 'm365-investigation',
  'advanced-hunting', 'incident-response', 'detection-engineering', 'soar', 'threat-hunting', 'sc200',
  'interview', 'ticket-writing', 'projects',
]

export const MODULES: Module[] = [
  {
    id: 'orientation', number: 0, title: 'Orientation', track: 'start', mode: 'both', status: 'ready',
    blurb: 'What defenders do, the core vocabulary, and how this course is organized. Start here if you are new.',
    objectives: ['Describe what a SOC analyst does day to day', 'Distinguish threat, vulnerability and risk', 'Define endpoint, server, network, account, log, alert and evidence in plain words', 'Use the level structure of each lesson'],
    prereqs: [], skills: ['soc'],
    lessons: ['start-here'],
  },
  {
    id: 'soc', number: 1, title: 'SOC Fundamentals', track: 'soc', mode: 'both', status: 'ready',
    blurb: 'Why security operations centers exist, who works in them, and the vocabulary every analyst uses daily.',
    objectives: [
      'Explain why organizations build a SOC and what it is accountable for',
      'Describe Tier 1/2/3, detection engineering, hunting, IR and threat intel roles',
      'Trace how an event becomes a log, telemetry, an alert and an incident',
      'Explain IOC, IOA and TTP and when each is most useful',
      'Classify alerts as true positive, benign true positive or false positive and justify it',
    ],
    prereqs: ['computers', 'networking'], skills: ['soc', 'threatintel'],
    lessons: ['soc-what-is-a-soc', 'soc-event-to-incident', 'soc-ioc-ioa-ttp', 'soc-triage-verdicts'],
  },
  {
    id: 'computers', number: 2, title: 'Computer Fundamentals', track: 'foundations', mode: 'soc', status: 'ready',
    blurb: 'Hardware, operating system, files, servers, VMs, cloud, processes and permissions — the building blocks every piece of evidence describes.',
    objectives: [
      'Explain CPU, memory (RAM), storage and the operating system, and why each matters to security',
      'Explain kernel mode vs user mode and why privilege levels protect the system',
      'Explain files, file systems (paths, permissions, timestamps) and why file names can mislead',
      'Explain client/server, virtual machines and cloud models (IaaS, PaaS, SaaS) and the shared responsibility model',
      'Distinguish programs, processes, threads and services',
      'Read a process tree and explain why parent-child relationships matter',
      'Explain users, groups and permissions and the principle of least privilege',
    ],
    prereqs: ['orientation'], skills: ['computers'],
    lessons: ['comp-hardware-os', 'comp-files-systems', 'comp-processes', 'comp-users-permissions'],
  },
  {
    id: 'networking', number: 3, title: 'Networking Fundamentals', track: 'foundations', mode: 'soc', status: 'ready',
    blurb: 'How data moves, which protocols matter to defenders, and what network evidence looks like.',
    objectives: [
      'Explain IP addresses, ports, TCP vs UDP and the TCP handshake',
      'Use the OSI/TCP-IP models to reason about where evidence comes from',
      'Explain DNS resolution and why DNS logs are valuable to a SOC',
      'Recognize normal vs unusual network patterns at a high level',
    ],
    prereqs: ['computers'], skills: ['networking'],
    lessons: ['net-tcpip-ports', 'net-dns', 'net-http-tls', 'net-firewall-proxy'],
  },
  {
    id: 'windows', number: 4, title: 'Windows Fundamentals & Security', track: 'foundations', mode: 'both', status: 'ready',
    blurb: 'How Windows records what happens, and how to reason from a user action to an Event ID.',
    objectives: [
      'Explain what Windows event logs are and which channels matter to a SOC',
      'Reason from a user action to the event it generates (4624, 4625, 4688, 4672, 4720, 4728, 4732, 7045)',
      'Interpret key fields such as Logon Type, account and source address',
      'Know which Microsoft tables carry Windows evidence',
    ],
    prereqs: ['computers'], skills: ['windows'],
    lessons: ['win-event-logs', 'win-log-clearing', 'win-persistence', 'ps-logging'],
  },
  {
    id: 'linux', number: 5, title: 'Linux Security', track: 'foundations', mode: 'soc', status: 'ready',
    blurb: 'Users, permissions, services, systemd and syslog for analysts who triage Linux hosts.',
    objectives: ['Linux architecture, users, groups, permissions', 'Processes, services and systemd', 'syslog and journalctl as evidence sources', 'Why ls, grep, ps, ss, journalctl and friends matter to an analyst', 'Syslog via AMA into Microsoft Sentinel'],
    prereqs: ['computers'], skills: ['linux'], lessons: ['linux-security-basics'],
  },
  {
    id: 'active-directory', number: 6, title: 'Active Directory Security', track: 'identity', mode: 'both', status: 'ready',
    blurb: 'Domains, domain controllers, Kerberos and NTLM, and the identity evidence they produce.',
    objectives: ['Domains, DCs, OUs, GPOs', 'Kerberos and NTLM at a conceptual level', 'Privileged groups and why changes to them matter', 'Identity evidence in Defender for Identity'],
    prereqs: ['windows', 'networking'], skills: ['identity'], lessons: ['ad-domains-kerberos', 'ad-kerberos-attacks'],
  },
  {
    id: 'entra-id', number: 7, title: 'Microsoft Entra ID', track: 'identity', mode: 'both', status: 'ready',
    blurb: 'Cloud identity: sign-in and audit logs, MFA, Conditional Access, Identity Protection.',
    objectives: ['Explain users, groups, roles, applications and service principals', 'Read interactive and non-interactive sign-in logs and audit logs', 'Explain MFA, Conditional Access (signals → decision → enforcement) and their licensing', 'Distinguish user risk from sign-in risk and investigate risky users', 'Remediate a compromised identity: revoke sessions, reset, remove attacker changes'],
    prereqs: ['active-directory'], skills: ['identity'], lessons: ['entra-signins-audit', 'entra-ca-risk'],
  },
  {
    id: 'cyber-fundamentals', number: 8, title: 'Cybersecurity Fundamentals', track: 'security', mode: 'soc', status: 'ready',
    blurb: 'CIA triad, threat/vulnerability/risk, control types, defense in depth and Zero Trust.',
    objectives: ['CIA triad', 'Threat vs vulnerability vs risk', 'Preventive, detective, corrective controls', 'Defense in depth, Zero Trust, least privilege'],
    prereqs: [], skills: ['soc'], lessons: ['cyber-cia-risk-controls'],
  },
  {
    id: 'malware', number: 9, title: 'Malware Fundamentals', track: 'security', mode: 'soc', status: 'ready',
    blurb: 'Malware categories and, most importantly, the defensive evidence that execution leaves behind.',
    objectives: ['Common malware categories', 'Static vs behavioral indicators', 'How execution shows up as process, file and network evidence', 'Detection approaches'],
    prereqs: ['computers', 'networking'], skills: ['defender'], lessons: ['malware-evidence'],
  },
  {
    id: 'phishing', number: 10, title: 'Phishing & Email Security', track: 'security', mode: 'both', status: 'ready',
    blurb: 'Email anatomy, SPF/DKIM/DMARC, and investigation in Defender for Office 365.',
    objectives: ['Read email headers: From, Reply-To, MAIL FROM, Authentication-Results', 'Explain SPF, DKIM and DMARC and what they cannot prove', 'Recognize credential phishing, malicious attachments, BEC and adversary-in-the-middle phishing', 'Triage a reported email safely'],
    prereqs: ['networking'], skills: ['defender'], lessons: ['phish-email-auth'],
  },
  {
    id: 'identity-security', number: 11, title: 'Identity & Authentication Security', track: 'identity', mode: 'both', status: 'ready',
    blurb: 'Defensive view of password attacks, MFA, token and session risk, and authentication logs.',
    objectives: ['How failed-authentication patterns differ', 'MFA and its limits', 'Session/token risk concepts', 'Investigating authentication logs'],
    prereqs: ['entra-id'], skills: ['identity'], lessons: ['idsec-auth-attacks'],
  },
  {
    id: 'mitre', number: 12, title: 'MITRE ATT&CK', track: 'soc', mode: 'both', status: 'ready',
    blurb: 'A shared language for adversary behavior — and how SOCs use it to measure and improve detection coverage.',
    objectives: [
      'Explain why ATT&CK exists and how it differs from a checklist',
      'Distinguish tactics, techniques, sub-techniques and procedures',
      'Map evidence and detections to techniques',
      'Use the matrix to analyze detection coverage (an SC-200 objective)',
    ],
    prereqs: ['soc'], skills: ['mitre'],
    lessons: ['mitre-framework'],
  },
  {
    id: 'threat-intel', number: 13, title: 'IOC, IOA & Threat Intelligence', track: 'soc', mode: 'both', status: 'ready',
    blurb: 'Intelligence types, enrichment, STIX/TAXII and ingesting indicators into Sentinel.',
    objectives: ['Strategic, operational, tactical, technical intelligence', 'Enrichment and reputation', 'STIX and TAXII', 'Ingesting threat indicators into Microsoft Sentinel'],
    prereqs: ['soc'], skills: ['threatintel'], lessons: ['ti-intel-lifecycle'],
  },
  {
    id: 'logging', number: 14, title: 'Logging & Telemetry', track: 'soc', mode: 'both', status: 'ready',
    blurb: 'What a log actually contains, how to read one field by field, and where each log source comes from.',
    objectives: ['Distinguish event, log and telemetry', 'Read the core fields of any log (time, who, where, what, result)', 'Know the main log sources and what each can and cannot tell you', 'Handle time zones and JSON fields'],
    prereqs: ['windows', 'networking'], skills: ['logging'],
    lessons: ['log-anatomy'],
  },
  {
    id: 'siem', number: 15, title: 'SIEM Fundamentals', track: 'soc', mode: 'both', status: 'ready',
    blurb: 'Why centralizing security data changes what a SOC can see, and the pipeline from source to incident.',
    objectives: ['Explain the problem SIEM solves', 'Describe collection, ingestion, parsing, normalization, storage, query, detection', 'Explain correlation and why it reduces noise', 'Explain retention trade-offs'],
    prereqs: ['logging'], skills: ['siem'],
    lessons: ['siem-pipeline'],
  },
  {
    id: 'kql', number: 16, title: 'KQL From Zero', track: 'investigation', mode: 'both', status: 'ready',
    blurb: 'The query language behind Sentinel and Advanced Hunting, taught from tables and rows up.',
    objectives: ['Explain tables, rows, columns and data types', 'Use where, project, summarize, extend, join, let and time filters', 'Choose between has and contains', 'Read query results and avoid common mistakes'],
    prereqs: ['logging', 'siem'], skills: ['kql'],
    lessons: ['kql-what-why'],
  },
  {
    id: 'sentinel', number: 18, title: 'Microsoft Sentinel', track: 'microsoft', mode: 'both', status: 'ready',
    blurb: 'Microsoft\'s cloud-native SIEM: workspace, connectors, analytics rules, incidents, automation.',
    objectives: ['Explain the Sentinel architecture and Log Analytics workspace', 'Select data connectors for a data source', 'Configure scheduled and NRT analytics rules', 'Explain entities, incidents, automation rules and playbooks'],
    prereqs: ['siem', 'kql'], skills: ['sentinel'],
    lessons: ['sentinel-architecture', 'sentinel-analytics-rules'],
  },
  {
    id: 'defender-xdr', number: 19, title: 'Microsoft Defender XDR', track: 'microsoft', mode: 'both', status: 'ready',
    blurb: 'Why XDR exists and how Defender correlates endpoint, email, identity and cloud signals into one incident.',
    objectives: ['Explain XDR vs EDR vs SIEM', 'Navigate incidents, alerts, evidence and attack story', 'Explain automated investigation and automatic attack disruption', 'Relate Defender XDR to Sentinel in the unified portal'],
    prereqs: ['siem'], skills: ['defender'],
    lessons: ['xdr-unified-incidents'],
  },
  {
    id: 'mde', number: 20, title: 'Defender for Endpoint', track: 'microsoft', mode: 'both', status: 'ready',
    blurb: 'Device inventory, timelines, process trees, response actions and Live Response.',
    objectives: ['Investigate alert stories, process trees and device timelines', 'Explain ASR rules and review them in audit mode', 'Choose proportionate response actions: isolate, restrict, collect, live response', 'Explain device groups, automation levels and the Action center'],
    prereqs: ['defender-xdr', 'windows'], skills: ['defender'], lessons: ['mde-device-investigation', 'mde-response-actions', 'mde-indicators-tuning'],
  },
  {
    id: 'mdo', number: 21, title: 'Defender for Office 365', track: 'microsoft', mode: 'both', status: 'ready',
    blurb: 'Threat Explorer, campaigns, message investigation and remediation.',
    objectives: ['Explain Defender for Office 365 Plan 1 vs Plan 2', 'Use Explorer / Real-time detections to scope a campaign', 'Find clicks with Safe Links data and remediate messages', 'Check identity and endpoint consequences of a phishing click'],
    prereqs: ['defender-xdr'], skills: ['defender'], lessons: ['mdo-phish-investigation'],
  },
  {
    id: 'mdi', number: 22, title: 'Defender for Identity', track: 'microsoft', mode: 'both', status: 'ready',
    blurb: 'Domain controller sensors and the identity alerts they generate.',
    objectives: ['How MDI collects identity signals', 'Identity alerts and their evidence', 'IdentityLogonEvents / IdentityQueryEvents'],
    prereqs: ['active-directory', 'defender-xdr'], skills: ['identity', 'defender'], lessons: ['mdi-identity-alerts'],
  },
  {
    id: 'cloud-security', number: 28, title: 'Defender for Cloud & Cloud Apps', track: 'microsoft', mode: 'both', status: 'ready',
    blurb: 'Cloud workload alerts for VMs, storage, key vaults and the management plane — plus shadow IT and risky OAuth apps.',
    objectives: ['Explain Defender for Cloud posture management vs workload protection', 'Investigate Defender for Cloud alerts and respond with cloud-native actions', 'Explain Defender for Cloud Apps capabilities and app governance', 'Investigate and remediate consent phishing and risky OAuth apps'],
    prereqs: ['computers', 'entra-id', 'defender-xdr'], skills: ['defender', 'identity'], lessons: ['mdc-workload-alerts', 'mdca-oauth-apps'],
  },
  {
    id: 'm365-investigation', number: 29, title: 'Microsoft 365 Investigation', track: 'microsoft', mode: 'both', status: 'ready',
    blurb: 'Purview DLP, insider risk, audit and content search — and Microsoft Graph activity logs for API-level evidence.',
    objectives: ['Triage DLP and insider risk alerts with identity context', 'Use Purview Audit (Standard vs Premium) and MailItemsAccessed', 'Find and remove content with eDiscovery content search', 'Scope token theft with Microsoft Graph activity logs'],
    prereqs: ['phishing', 'entra-id', 'kql'], skills: ['ir', 'identity'], lessons: ['purview-alerts', 'graph-activity-logs'],
  },
  {
    id: 'advanced-hunting', number: 23, title: 'Advanced Hunting', track: 'investigation', mode: 'both', status: 'ready',
    blurb: 'Choosing the right Defender XDR table for a question — the skill SC-200 tests directly.',
    objectives: ['Explain the problem each core table solves', 'Choose the right table for a question', 'Know key columns and when not to use a table', 'Build hunting queries and custom detections'],
    prereqs: ['kql', 'defender-xdr'], skills: ['hunting', 'kql'],
    lessons: ['ah-choose-table'],
  },
  {
    id: 'incident-response', number: 24, title: 'Incident Response', track: 'investigation', mode: 'both', status: 'ready',
    blurb: 'From alert to lessons learned — the lifecycle, decisions and documentation of a response.',
    objectives: ['Walk through triage, investigation, scoping, containment, eradication, recovery, lessons learned', 'Choose proportionate containment', 'Document decisions for handover', 'Relate IR phases to Defender and Sentinel actions'],
    prereqs: ['soc', 'defender-xdr'], skills: ['ir'],
    lessons: ['ir-lifecycle'],
  },
  {
    id: 'detection-engineering', number: 25, title: 'Detection Engineering', track: 'investigation', mode: 'both', status: 'ready',
    blurb: 'Hypothesis → query → test → tune → deploy. Sentinel analytics rules and Defender custom detections.',
    objectives: ['Detection lifecycle', 'Tuning and false-positive handling', 'MITRE mapping of detections', 'Custom detection rules in Defender XDR'],
    prereqs: ['kql', 'sentinel'], skills: ['sentinel', 'mitre'], lessons: ['de-detection-lifecycle'],
  },
  {
    id: 'soar', number: 26, title: 'SOAR & Automation', track: 'investigation', mode: 'both', status: 'ready',
    blurb: 'Automation rules, playbooks and Logic Apps — and when not to automate.',
    objectives: ['Automation rules vs playbooks', 'Logic Apps connectors and actions', 'Safe automated remediation', 'When automation should stay human-approved'],
    prereqs: ['sentinel'], skills: ['sentinel'], lessons: ['soar-automation'],
  },
  {
    id: 'threat-hunting', number: 27, title: 'Threat Hunting', track: 'investigation', mode: 'both', status: 'ready',
    blurb: 'Hypothesis-driven hunting with Sentinel hunting queries, data lake KQL jobs and notebooks.',
    objectives: ['What hunting is and why it exists', 'Forming testable hypotheses', 'Hunting queries and bookmarks in Sentinel', 'Sentinel data lake KQL jobs and summary rules'],
    prereqs: ['advanced-hunting'], skills: ['hunting'], lessons: ['hunt-hypothesis', 'hunt-graphs-blast-radius'],
  },
  {
    id: 'sc200', number: 44, title: 'SC-200 Certification Academy', track: 'cert', mode: 'exam', status: 'ready',
    blurb: 'Every objective in the official skills outline mapped to lessons, products, labs and practice questions.',
    objectives: ['Map each official objective to prerequisite lessons', 'Separate exam knowledge from real SOC knowledge', 'Practice with explained questions and weak-area tracking'],
    prereqs: [], skills: ['sentinel', 'defender', 'kql'], lessons: [],
  },
  {
    id: 'interview', number: 34, title: 'Interview Academy', track: 'career', mode: 'soc', status: 'ready',
    blurb: 'Explain concepts out loud, check your answer against key points, and practice follow-ups.',
    objectives: ['Answer beginner, intermediate and advanced questions', 'Explain reasoning, not definitions', 'Handle follow-up questions'],
    prereqs: [], skills: ['soc'], lessons: [],
  },
  {
    id: 'ticket-writing', number: 33, title: 'SOC Ticket Writing', track: 'career', mode: 'soc', status: 'ready',
    blurb: 'How to write incident notes another analyst can act on — with weak and improved examples.',
    objectives: ['Use a consistent ticket template', 'Separate facts, assessment and recommendations', 'Write for the next shift'],
    prereqs: ['soc'], skills: ['soc', 'ir'], lessons: [],
  },
  {
    id: 'projects', number: 42, title: 'Portfolio Project Builder', track: 'career', mode: 'soc', status: 'ready',
    blurb: 'GitHub-ready project templates you build in your own free lab environment.',
    objectives: ['Plan a project in your own lab', 'Document objective, architecture, query and findings', 'Turn completed work into honest resume bullets'],
    prereqs: ['kql', 'sentinel'], skills: ['kql', 'sentinel'], lessons: ['proj-portfolio-lab'],
  },
]

/**
 * Beginner starter kits — written after walking through every module as a newcomer.
 * Each says what the module is about in plain words, which terms to know first,
 * which earlier lessons to revisit, and free beginner resources.
 */
const STARTERS: Record<string, ModuleStarter> = {
  orientation: {
    intro: 'You need no security background. This module explains what a security analyst does and the handful of words every later lesson uses. If any word feels new later on, hover over it or look it up in the Glossary.',
    terms: ['threat', 'vulnerability', 'risk', 'endpoint', 'log', 'alert', 'soc'],
    resources: res('sec101Cyber', 'learnCyberBasics', 'nistGlossary'),
  },
  computers: {
    intro: 'Every piece of security evidence describes something a computer did: a program started, a file changed, an account signed in. This module explains those building blocks in everyday language. You only need to have used a computer before.',
    terms: ['cpu', 'ram', 'storage', 'operating-system', 'process', 'parent-process', 'digital-signature', 'registry', 'sha256'],
    revisit: ['start-here'],
    resources: res('processExplorer', 'learnCloudConcepts', 'learnAzureCore', 'messerYoutube'),
  },
  networking: {
    intro: 'Computers talk to each other using addresses (IP), doors (ports) and shared rules (protocols). Learn these and every firewall, DNS and connection log becomes readable. Start with "TCP/IP, ports and protocols" — the later lessons build on it.',
    terms: ['packet', 'ip-address', 'port', 'tcp', 'udp', 'dns', 'firewall', 'proxy', 'tls'],
    revisit: ['comp-processes'],
    resources: res('messerNet', 'cfDns', 'cfTls', 'cfFirewall'),
  },
  windows: {
    intro: 'Windows writes a diary of what happens — sign-ins, programs starting, settings changing — called the event log. This module teaches you to read it. Make sure processes, accounts and the registry feel familiar first.',
    terms: ['event', 'log', 'process', 'registry', 'logon-type', 'logon-id', 'sid', 'service', 'scheduled-task'],
    revisit: ['comp-processes', 'comp-users-permissions'],
    resources: res('processExplorer', 'auditPolicies', 'psOverview', 'sysmon'),
  },
  linux: {
    intro: 'Most servers and cloud workloads run Linux. The ideas are the same as on Windows — users, permissions, processes, logs — with different names. You will see short commands like ls and grep; trying them yourself makes everything click.',
    terms: ['linux', 'sudo', 'ssh', 'syslog', 'permission', 'process'],
    revisit: ['comp-users-permissions'],
    resources: res('ubuntuCli', 'bandit', 'syslogAma'),
  },
  'active-directory': {
    intro: 'Active Directory is the central list of users and computers inside most companies, and the system that checks their passwords. Attackers aim for it because controlling it means controlling everything. Read the first lesson slowly; the second (Kerberos attacks) builds directly on it.',
    terms: ['active-directory', 'domain-controller', 'ou', 'group-policy', 'kerberos', 'ntlm', 'ldap', 'spn'],
    revisit: ['comp-users-permissions', 'win-event-logs'],
    resources: res('adOverview', 'learnSecConcepts', 'kerberos'),
  },
  'entra-id': {
    intro: 'Microsoft Entra ID is Active Directory\'s cloud cousin: it checks sign-ins to Microsoft 365, Teams, Azure and thousands of apps. This module teaches the two logs analysts read most — sign-ins and audit — and the controls (MFA, Conditional Access) that protect accounts.',
    terms: ['entra-id', 'tenant', 'authentication', 'mfa', 'conditional-access', 'service-principal', 'hybrid-identity', 'session-token'],
    revisit: ['comp-users-permissions', 'ad-domains-kerberos'],
    resources: res('entraWhatIs', 'learnIdentityTypes', 'learnEntraCaps', 'sec101Iam'),
  },
  'identity-security': {
    intro: 'This module looks at how attackers try to get into accounts — guessing passwords, tricking people, stealing sign-in sessions — and the log patterns each leaves. Read Entra ID first: everything here is seen through its sign-in logs.',
    terms: ['brute-force', 'password-spraying', 'mfa', 'session-token', 'aitm', 'identity-protection'],
    revisit: ['entra-signins-audit'],
    resources: res('learnEntraCaps', 'sec101Iam', 'entraMfa'),
  },
  'cyber-fundamentals': {
    intro: 'The core ideas of security in one place: what we protect (confidentiality, integrity, availability), how we think about risk, and the kinds of controls that reduce it. No technical background needed.',
    terms: ['cia-triad', 'threat', 'vulnerability', 'risk', 'exploit', 'patch', 'defense-in-depth', 'zero-trust', 'least-privilege'],
    resources: res('learnCyberBasics', 'learnThreats', 'sec101ZeroTrust', 'nistCsf'),
  },
  malware: {
    intro: 'Malware is software written to cause harm. You will not analyze malware code here — you will learn the traces it leaves (processes, files, connections, autostart entries), which is what SOC analysts actually work with.',
    terms: ['malware', 'ransomware', 'process', 'persistence', 'c2', 'sha256', 'sandbox', 'living-off-the-land'],
    revisit: ['comp-processes', 'win-persistence'],
    resources: res('sec101Malware', 'learnThreats', 'sec101Edr'),
  },
  phishing: {
    intro: 'Phishing is the most common way attacks start: a fake email that tricks someone into clicking, opening or signing in. This module explains how email works, how to read headers, and what SPF, DKIM and DMARC can (and can\'t) prove.',
    terms: ['phishing', 'spf', 'dkim', 'dmarc', 'bec', 'aitm', 'dns'],
    revisit: ['net-dns'],
    resources: res('sec101Phishing', 'learnThreats', 'emailAuth'),
  },
  soc: {
    intro: 'A security operations center (SOC) is the team that watches for attacks and responds. This module explains how the team works, how a single event becomes an incident, and how analysts decide whether an alert is real.',
    terms: ['soc', 'event', 'alert', 'incident', 'triage', 'true-positive', 'false-positive', 'ioc', 'ttp', 'soc-metrics'],
    revisit: ['start-here'],
    resources: res('sec101Soc', 'secOpsGuide', 'learnSecSolutions'),
  },
  mitre: {
    intro: 'MITRE ATT&CK is a shared encyclopedia of attacker behavior. Analysts use it to name what they see ("this is credential dumping") and to check which behaviors their detections cover. You don\'t memorize it — you learn to look things up.',
    terms: ['mitre-attack', 'tactic', 'technique', 'ttp', 'persistence', 'lateral-movement'],
    revisit: ['soc-ioc-ioa-ttp'],
    resources: res('attackStart', 'attack', 'navigator'),
  },
  'threat-intel': {
    intro: 'Threat intelligence is knowledge about attackers — who they are, what they do and the clues they leave — turned into action. This module shows the different kinds of intelligence and how indicators get into Microsoft Sentinel.',
    terms: ['threat-intel', 'ioc', 'ioa', 'ttp', 'pyramid-of-pain', 'stix-taxii', 'api'],
    revisit: ['soc-ioc-ioa-ttp'],
    resources: res('cisaBasics', 'cisa', 'stix'),
  },
  logging: {
    intro: 'Every investigation is built from logs. This module teaches you to read any log line the same way — when, who, where, what, result — and warns about the traps (time zones, nested JSON fields).',
    terms: ['log', 'event', 'telemetry', 'utc', 'json', 'entity'],
    revisit: ['win-event-logs', 'net-tcpip-ports'],
    resources: res('sec101Siem', 'auditPolicies', 'nistGlossary'),
  },
  siem: {
    intro: 'A SIEM gathers logs from everywhere into one searchable place and runs detection rules on them. This module explains the pipeline from a log on one device to an incident in front of an analyst.',
    terms: ['siem', 'log', 'data-connector', 'normalization', 'analytics-rule', 'incident'],
    revisit: ['log-anatomy'],
    resources: res('sec101Siem', 'learnSentinelIntro', 'sentinelOverview'),
  },
  kql: {
    intro: 'KQL is how you ask questions of security data: start with a table, then filter, shape and count it step by step. It looks like code but reads like a recipe. Practice is everything — run the free sample queries as you go.',
    terms: ['kql', 'json', 'utc', 'log-analytics', 'advanced-hunting'],
    revisit: ['log-anatomy', 'siem-pipeline'],
    resources: res('learnFirstKql', 'learnKqlResults', 'kustoDetective', 'kc7', 'adx'),
  },
  sentinel: {
    intro: 'Microsoft Sentinel is Microsoft\'s cloud SIEM. Everything from the SIEM and KQL modules applies here, with Microsoft names: workspace, data connectors, analytics rules, incidents and automation. A basic idea of Azure (tenant, subscription, resource group) helps.',
    terms: ['sentinel', 'log-analytics', 'data-connector', 'ama', 'dcr', 'analytics-rule', 'incident', 'subscription'],
    revisit: ['siem-pipeline', 'kql-what-why', 'comp-files-systems'],
    resources: res('learnSentinelIntro', 'learnAzureCore', 'learnSentinelEnv'),
  },
  'defender-xdr': {
    intro: 'Microsoft Defender XDR watches devices, email, identities and cloud apps, and joins related alerts into one incident. This module explains what XDR adds on top of a SIEM and how to read an incident\'s attack story.',
    terms: ['xdr', 'edr', 'defender-xdr', 'incident', 'alert', 'entity', 'attack-disruption'],
    revisit: ['soc-event-to-incident'],
    resources: res('sec101Xdr', 'sec101Edr', 'learnXdrIntro', 'learnXdrPath'),
  },
  mde: {
    intro: 'Defender for Endpoint is the security sensor on each computer. It records processes, files, connections and registry changes, and lets you respond (isolate, collect evidence). The Computer Fundamentals and Windows modules are the foundation here.',
    terms: ['mde', 'edr', 'process', 'parent-process', 'device-isolation', 'live-response', 'asr-rules', 'custom-indicator'],
    revisit: ['comp-processes', 'win-event-logs'],
    resources: res('sec101Edr', 'learnXdrPath', 'processExplorer'),
  },
  mdo: {
    intro: 'Defender for Office 365 protects email and Teams. You will learn to find every copy of a phishing email, see who clicked, and remove it from mailboxes. Read the Phishing module first.',
    terms: ['mdo', 'phishing', 'safe-links', 'zap', 'emailevents', 'bec'],
    revisit: ['phish-email-auth'],
    resources: res('sec101Phishing', 'learnXdrIntro', 'mdo'),
  },
  mdi: {
    intro: 'Defender for Identity watches domain controllers and spots attacks on Active Directory: reconnaissance, stolen credentials, lateral movement. The Active Directory module is essential background.',
    terms: ['mdi', 'domain-controller', 'kerberos', 'ldap', 'credential-dumping', 'pass-the-hash', 'lateral-movement'],
    revisit: ['ad-domains-kerberos', 'ad-kerberos-attacks'],
    resources: res('adOverview', 'learnXdrIntro', 'mdi'),
  },
  'cloud-security': {
    intro: 'Cloud attacks often never touch a laptop: a leaked key, a stolen token or a malicious app is enough. Before starting, make sure you know how Azure is organized — tenant → subscription → resource group → resource — and that every change goes through Azure Resource Manager.',
    terms: ['cloud-computing', 'tenant', 'subscription', 'resource-group', 'azure-resource-manager', 'storage-account', 'key-vault', 'oauth-consent'],
    revisit: ['comp-files-systems', 'entra-signins-audit'],
    resources: res('learnAzureCore', 'sec101Cloud', 'learnCloudMgmt', 'learnMdcPath'),
  },
  'm365-investigation': {
    intro: 'Microsoft Purview protects and audits company data: what was shared, downloaded or accessed. Graph activity logs show what apps and tokens did through Microsoft\'s APIs. These lessons are more advanced — finish Entra ID and Phishing first.',
    terms: ['dlp', 'unified-audit-log', 'graph-activity-logs', 'api', 'session-token', 'tenant'],
    revisit: ['entra-signins-audit', 'phish-email-auth'],
    resources: res('sec101Dlp', 'learnCompliance', 'purviewAudit'),
  },
  'advanced-hunting': {
    intro: 'Advanced Hunting is KQL inside Defender XDR. The hard part isn\'t the syntax — it\'s knowing which table answers your question. This module is a map from questions to tables.',
    terms: ['advanced-hunting', 'kql', 'deviceprocessevents', 'devicenetworkevents', 'emailevents', 'identitylogonevents'],
    revisit: ['kql-what-why'],
    resources: res('ahLanguage', 'learnFirstKql', 'kc7'),
  },
  'incident-response': {
    intro: 'Incident response is what happens after an attack is confirmed: understand it, stop it, clean up, recover, and learn. This module walks through each phase and the decisions analysts make along the way.',
    terms: ['incident', 'triage', 'containment', 'device-isolation', 'blast-radius'],
    revisit: ['soc-triage-verdicts'],
    resources: res('sec101Ir', 'irOverview', 'cisaPlaybooks'),
  },
  'detection-engineering': {
    intro: 'Detection engineering is building the rules that create alerts — and making sure they are accurate. You will turn an idea ("password spraying looks like this") into a tested, tuned KQL rule.',
    terms: ['detection-engineering', 'analytics-rule', 'false-positive', 'baseline', 'watchlist', 'mitre-attack'],
    revisit: ['kql-what-why', 'sentinel-analytics-rules'],
    resources: res('learnSentinelEnv', 'attackStart', 'sentinelCreateRule'),
  },
  soar: {
    intro: 'SOAR means letting software do repetitive response steps — enrich an alert, notify a team, disable an account — so analysts can focus on decisions. This module also covers when automation should still ask a human.',
    terms: ['soar', 'automation-rule', 'playbook', 'attack-disruption', 'soc-metrics'],
    revisit: ['sentinel-analytics-rules'],
    resources: res('sec101Soar', 'sentinelAutomation', 'sentinelPlaybooks'),
  },
  'threat-hunting': {
    intro: 'Hunting means searching for attackers that no rule has caught yet, starting from an idea you can test. It combines everything before it: knowing normal behavior, MITRE techniques and KQL.',
    terms: ['threat-hunting', 'baseline', 'mitre-attack', 'advanced-hunting', 'blast-radius', 'jupyter-notebook'],
    revisit: ['ah-choose-table', 'mitre-framework'],
    resources: res('sec101Hunting', 'kc7', 'sentinelHunting'),
  },
  projects: {
    intro: 'Build real things in your own free lab and write them up for your portfolio. Each project uses free trials or sample data — never your employer\'s systems without permission.',
    terms: ['log-analytics', 'data-connector', 'kql', 'analytics-rule'],
    revisit: ['kql-what-why', 'sentinel-architecture'],
    resources: res('adx', 'learnFirstKql', 'kustoDetective'),
  },
}
for (const m of MODULES) m.starter ??= STARTERS[m.id]

export const moduleById = (id: string) => MODULES.find(m => m.id === id)
