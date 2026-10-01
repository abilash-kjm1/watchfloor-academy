# Watchfloor Academy

An interactive, offline-first SOC analyst academy: from computer and network fundamentals to Microsoft Sentinel, Defender XDR, KQL and SC-200 readiness. Every concept is taught with the same structure — *why it exists, what normal looks like, what evidence it leaves, where that evidence appears, and how an analyst investigates it.*

Independent learning resource. Not affiliated with or endorsed by Microsoft or MITRE.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (HashRouter — works from any static host)
```

## What's built

| Area | Status |
|---|---|
| Full lessons (depth levels 1–8, "Where this fits", "Explain it back", quiz, lab, KQL, MITRE, SC-200 mapping, Connect-the-Dots) | 27 lessons: a beginner Orientation lesson, Computer Fundamentals (hardware & OS; files, servers, VMs & cloud; processes; permissions), SOC Fundamentals, Entra ID, Phishing & Email Security, Defender for Office 365, Defender for Endpoint, Computer Fundamentals, Networking, Windows, Logging, SIEM, KQL, MITRE ATT&CK, Sentinel, Defender XDR, Advanced Hunting, Incident Response |
| Outline modules (objectives + links to lessons that already cover parts) | Linux, Active Directory, Cybersecurity Fundamentals, Malware, Identity Security, Threat Intel, Defender for Identity, Detection Engineering, SOAR, Threat Hunting, Projects |
| SC-200 objective map | All 54 objectives from the official outline **"Skills measured as of October 21, 2026"**, each mapped to prerequisites, lessons, product, lab, practice questions, interview angle, and labeled REAL SOC / SC-200 EXAM / BOTH |
| Exam practice | 144 explained questions (24 exam-specific); untimed, timed, domain, objective and review-mistakes modes; per-objective weak-area tracking |
| KQL reference | 15 operators/families, each in 9 parts (plain English → practice question) |
| Interview mode | 32 questions (beginner → advanced); offline key-point coverage check, model answer, tip, follow-up |
| Quality | Independent audit in [AUDIT_REPORT.md](AUDIT_REPORT.md): all 105 KQL queries verified with Microsoft's KQL parser against official schemas; MITRE checked against ATT&CK v19; acronym-before-definition check. Re-run with `npm run audit` (KQL parser, acronym-before-definition and cross-reference checks). |
| Also | Dashboard, performance-based skill tree, personalized review, module checkpoints, daily challenge + streaks, study planner (1/2/3 h/day), ticket-writing trainer, 101-term glossary with hover definitions, global search (Ctrl K), notes, bookmarks, export/import, dark/light mode, mobile layout |

**Not included (by decision):** an in-app query engine with simulated security telemetry, alert-triage/case-file simulators, and the capstone. KQL practice points learners to the free Azure Data Explorer help cluster and their own Sentinel/Defender lab tenant instead. An unwired, untested KQL interpreter is kept in `extras/kql-engine.ts` for possible future use; it is not part of the build.

## Structure

```
src/
  data/           curriculum content — no UI code
    types.ts        content models (Module, Lesson, Question, GlossaryTerm, …)
    curriculum.ts   modules, tracks, learning path, skills
    lessons/*.ts    lesson content
    glossary.ts     terms (also the node registry for Connect-the-Dots chains)
    sc200.ts        official objectives + exam questions
    interview.ts    interview bank + offline answer review
    kqlOperators.ts operator reference
    resources.ts    link-checked resources (HTTP 200 verified 2026-09-30)
  progress/       localStorage store, skill scoring, weak-concept engine
  components/     Layout, Markdown (with [[glossary]] links), KqlCode, Flow, ConnectDots, Quiz, …
  pages/          routes
```

## Adding a lesson

1. Write the teaching text in `src/data/lessons/text/<lesson-id>.md`: start with `## bridge` (how it builds on earlier lessons), then one `## <section>` per teaching section, then `## explainBack` with `Q:` / `A:` pairs. Sections:
   `what, why, name, problem, how, analogy, realWorld, securityExample, normal, suspicious, abuse, evidence, where, analyst, microsoft`.
2. Add the lesson's metadata (quiz, lab, KQL, MITRE, resources, `sections: {}`) to a file in `src/data/lessons/`.
3. Add its id to the module's `lessons` array in `curriculum.ts` (set `status: 'ready'`).
4. Map `sc200.objectives` to ids in `sc200.ts`; list a `connect` chain of glossary ids.

### Writing style (keep lessons readable)

- **One concept per `###` sub-heading**: definition in one sentence, then an example, then why it matters.
- Short sentences, one idea per paragraph. Never define several terms in one paragraph.
- Use numbered lists for steps, bullets for properties, tables for comparisons.
- `> ` lines render as a highlighted **Key idea** box; use one or two per section, not more.
- Indent `  - ` under a list item for sub-points. Code fences are plain text unless tagged ` ```kql `.
- Link terms with `[[glossary-id|label]]`.

Search, sidebar, dashboard, skill scoring, checkpoints, daily challenge and the study planner pick it up automatically. Run `npm run audit` afterwards: it fails loudly on KQL that doesn't parse against the real schemas and on acronyms used before they're defined.

## Data & privacy

All progress, notes and bookmarks live in the browser's localStorage (`soc-academy:*` keys). Nothing is sent anywhere. Use Settings → Export to back up or move devices.

## Keeping content current

Microsoft product names, UIs and the SC-200 outline change. Resources that describe product UI are flagged in the app. Re-check the [official study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-200) before relying on the objective map.
