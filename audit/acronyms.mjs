// Beginner check: flags acronyms that appear (in learning order) before the course defines them.
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const data = await server.ssrLoadModule('/src/data/index.ts')

const CORE = ['SOC', 'DNS', 'TCP', 'UDP', 'HTTP', 'HTTPS', 'SSH', 'RDP', 'SMB', 'LDAP', 'DHCP', 'SMTP', 'MFA', 'IOC', 'IOA', 'TTP',
  'SIEM', 'EDR', 'XDR', 'SOAR', 'AD', 'DC', 'JSON', 'CEF', 'AMA', 'DCR', 'NAT', 'WEF', 'PIM', 'SQL', 'NRT', 'AIR', 'ASIM', 'MSSP',
  'CDN', 'TTL', 'SPF', 'STIX', 'TAXII', 'NTLM', 'SAMR', 'API', 'KQL', 'UTC', 'PID', 'OS', 'CPU', 'RAM', 'IR', 'FQDN', 'UPN', 'RBAC', 'ASR', 'MTTD', 'MTTR', 'NOC']

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// A definition looks like "Full Name (ACR)" or "ACR (Full Name" or "ACR — ..." or "**ACR**" heading-style.
// Allows plurals (DCRs), markup between term and definition (**NAT]]** (…)), and "LDAP / LDAPS — …" table rows.
const defined = a => new RegExp(`\\(${esc(a)}s?\\)|\\b${esc(a)}s?\\b[\\]*|a-z]*\\**\\s*(/\\s*\\w+\\s*)?(—|\\(|is a|is the|means|=)`)
const used = a => new RegExp(`\\b${esc(a)}\\b`)

const firstUse = new Map(); const firstDef = new Map()
const order = data.ORDERED_LESSONS.map(l => l.id)
for (const l of data.ORDERED_LESSONS) {
  const text = [l.bridge ?? '', ...Object.values(l.sections)].join('\n')
  for (const a of CORE) {
    if (!firstUse.has(a) && used(a).test(text)) firstUse.set(a, l.id)
    if (!firstDef.has(a) && defined(a).test(text)) firstDef.set(a, l.id)
  }
}
const issues = []
for (const [a, where] of firstUse) {
  const d = firstDef.get(a)
  if (!d) issues.push(`${a}: first used in "${where}" — never defined`)
  else if (order.indexOf(d) > order.indexOf(where)) issues.push(`${a}: first used in "${where}" — defined later in "${d}"`)
}
console.log(issues.length ? issues.join('\n') : 'No acronym is used before it is defined.')
await server.close()
