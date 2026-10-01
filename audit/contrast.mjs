// WCAG contrast check for the design tokens in src/styles/index.css.
// Every text color must reach 4.5:1 on the backgrounds it is used on, in both themes.
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/styles/index.css', import.meta.url), 'utf8')
const block = sel => {
  const m = css.match(new RegExp(`^${sel.replace('.', '\\.')} \\{([\\s\\S]*?)^\\}`, 'm'))
  return Object.fromEntries([...m[1].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(x => [x[1], x[2]]))
}
const themes = { light: block(':root'), dark: block('.dark') }

const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

const tracks = ['start', 'foundations', 'identity', 'security', 'soc', 'microsoft', 'investigation', 'cert', 'career']
const pairs = [
  ['text', 'bg'], ['text', 'surface'], ['text', 'surface-2'], ['muted', 'bg'], ['muted', 'surface'], ['muted', 'surface-2'],
  ['accent', 'surface'], ['accent', 'accent-soft'], ['on-accent', 'accent'],
  ...['soc', 'exam', 'both', 'danger', 'ok'].flatMap(k => [[k, `${k}-soft`], [k, 'surface']]),
  ...tracks.flatMap(t => [[`t-${t}`, `t-${t}-soft`], [`t-${t}`, 'surface'], [`t-${t}`, 'bg']]),
]
let fail = 0
for (const [name, t] of Object.entries(themes)) {
  for (const [fg, bg] of pairs) {
    const r = ratio(t[fg], t[bg])
    if (r < 4.5) { fail++; console.log(`FAIL ${name}: --${fg} on --${bg} = ${r.toFixed(2)}:1`) }
  }
  // white banner text on deep track colors
  for (const tr of tracks) {
    const r = ratio('#ffffff', t[`t-${tr}-deep`])
    if (r < 4.5) { fail++; console.log(`FAIL ${name}: white on --t-${tr}-deep = ${r.toFixed(2)}:1`) }
  }
}
console.log(fail ? `${fail} contrast failures` : `contrast: all ${pairs.length * 2 + tracks.length * 2} token pairs meet WCAG AA (4.5:1)`)
process.exit(fail ? 1 : 0)
