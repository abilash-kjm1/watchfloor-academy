# Watchfloor Academy — Content QA, Fact-Check & Beginner Audit

**Date:** 2026-10-01 · **Scope:** every module, lesson, query, Event ID, MITRE reference, Microsoft claim, SC-200 mapping, resource, quiz, interview question and website feature that exists in the app.

Severity key: 🔴 critical (wrong or dangerous misunderstanding) · 🟠 high · 🟡 medium · 🔵 low

---

## A. Executive summary

The academy was audited in two independent passes, fixed, and re-tested.

- **Technical pass:** claims were checked against Microsoft Learn, the Azure Monitor and Defender XDR table references, the official SC-200 study guide, and MITRE ATT&CK v19.2. All 78 KQL queries were run through **Microsoft's own KQL parser** (`Kusto.Language`, npm `@kusto/language-service-next` 12.4.1) against table schemas taken from Microsoft's reference pages.
- **Beginner pass ("Alex"):** the 18 lessons were read in learning order, starting from no security knowledge.

**Found:** 5 critical, 13 high, 19 medium and 6 low issues (counted from the tables below; duplicates between tables counted once). **All were fixed**; the items in section M still need a human decision or a live tenant.

**Biggest problems found:**

1. Hash hunting used `SHA256`, which Microsoft documents as "usually not populated" in Defender device tables. Those queries would silently return nothing.
2. Group-change queries used a column that doesn't exist (`TargetGroupName`) and labeled the group as the member.
3. The MITRE ATT&CK lesson was outdated. "Defense Evasion" has been split into **Stealth** and **Defense Impairment** (15 tactics, not 14), and T1070.001 has moved to T1685.001.
4. There was no orientation lesson. A beginner hit processes, EDR and KQL with no context, and threat, vulnerability and risk were never taught.

**Final state:**
- 78/78 queries pass Microsoft's parser.
- No acronym is used before it is defined.
- Every lesson has a "Where this fits" bridge and an "Explain it back" self-test.
- All 34 routes render on mobile with no console errors.
- 0 broken links.

---

## B. Technical accuracy report

| # | Sev | Issue | Fix | Source |
|---|---|---|---|---|
| T1 | 🔴 | Hash queries and lesson text used `SHA256` in `DeviceProcessEvents`, `DeviceFileEvents` and `DeviceNetworkEvents`. Microsoft: "This field is usually not populated — use the SHA1 column." | All endpoint hash hunts now use `SHA1` / `InitiatingProcessSHA1`. The reason is explained in the IOC, Advanced Hunting and glossary entries. | [DeviceProcessEvents](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-deviceprocessevents-table), [DeviceFileEvents](https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-devicefileevents-table) |
| T2 | 🔴 | `SecurityEvent` queries used `TargetGroupName` (not a column) and labeled `TargetUserName` as the member. For 4728/4732/4756, `TargetUserName` is the **group** and `MemberName` is who was added. | Both queries corrected. The users lesson now has a field-meaning table and an explain-back item. | [SecurityEvent schema](https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/securityevent) |
| T3 | 🔴 | The MITRE lesson said 14 tactics with TA0005 "Defense Evasion". ATT&CK v19.2 has 15 tactics: **TA0005 Stealth** and **TA0112 Defense Impairment**. | Tactic table rewritten, with a "recent change" note. T1036 and T1078 tactic labels updated. | [Enterprise tactics](https://attack.mitre.org/tactics/enterprise/), [TA0112](https://attack.mitre.org/tactics/TA0112/) |
| T4 | 🟠 | `T1070.001 Clear Windows Event Logs` no longer exists; the URL redirects to T1685. | Remapped to **T1685.001 Disable or Modify Tools: Disable or Modify Windows Event Log** (Defense Impairment). | [T1685.001](https://attack.mitre.org/techniques/T1685/001/) |
| T5 | 🟠 | ATT&CK pages were said to list "Data Sources"; they now have a **Detection Strategy** section. | Lesson updated: technique → detection strategy → table → query. | [T1110.003](https://attack.mitre.org/techniques/T1110/003/) |
| T6 | 🟠 | Event 4672 was described as "an admin-level account logs on". Microsoft: it fires for sensitive privileges and **on every SYSTEM logon**. | Lesson and glossary corrected, with Microsoft's monitoring advice (exclude SYSTEM, LOCAL SERVICE and NETWORK SERVICE). | [Event 4672](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4672) |
| T7 | 🟠 | WEF was described without saying where the data lands. Forwarded events go to **`WindowsEvent`**, not `SecurityEvent`, so many built-in rules miss them. | Added to the Windows and Sentinel lessons, an explain-back item and exam question x-5. | [Data connectors reference](https://learn.microsoft.com/en-us/azure/sentinel/data-connectors-reference#windows-forwarded-events) |
| T8 | 🟠 | The DNS query used `DnsEvents`, the legacy agent table. The current Windows DNS Events via AMA connector writes **`ASimDnsActivityLogs`**. | Query rewritten (`EventResultDetails == "NXDOMAIN"`, `DnsQuery`, `SrcIpAddr`); the legacy table is mentioned. | [DNS over AMA fields](https://learn.microsoft.com/en-us/azure/sentinel/dns-ama-fields) |
| T9 | 🟠 | The Sentinel portal transition was vague ("check the timeline"). | Now states: redirected to the Defender portal since **July 1, 2026**; Azure portal support ends **March 31, 2027**; the workspace remains the data store. | [Tech Community update](https://techcommunity.microsoft.com/blog/microsoftsentinelblog/update-new-timeline-for-transitioning-sentinel-experience-to-defender-portal/4490464) |
| T10 | 🟡 | Custom detection guidance said the query "must return" set columns. | Updated to Microsoft's current recommendation: `Timestamp`/`TimeGenerated`, plus `DeviceId` and `ReportId` for Defender for Endpoint tables. Also: don't filter on `Timestamp`; frequency options include Continuous (NRT) and Custom. | [Custom detection rules](https://learn.microsoft.com/en-us/defender-xdr/custom-detection-rules) |
| T11 | 🟡 | 4688 didn't name the policy needed to record command lines. | Added "Include command line in process creation events". | Event 4688 doc |
| T12 | 🟡 | 7045 had no mention of its Security-log twin. | Added **4697**, plus **1102** (audit log cleared) as a full event block. | Event 4697 doc |
| T13 | 🟡 | 4625 `Status`/`SubStatus` were described only vaguely. | Added `0xC000006A` (bad password), `0xC0000064` (no such user) and `0xC0000234` (locked out). | SecurityEvent schema |
| T14 | 🟡 | The "Microsoft security" rule type gave no context for the unified portal. | Notes that Defender XDR creates incidents once Sentinel is in the Defender portal. | Sentinel docs |

## C. Beginner understanding report (Alex, first pass)

| # | Sev | Where Alex got stuck | Why | Fix |
|---|---|---|---|---|
| B1 | 🔴 | The very first lesson | No context: what defenders do, why processes matter. Threat, vulnerability and risk were never taught (that module was outline-only). | **New lesson "Start here"** (Module 0): the job, threat/vulnerability/risk, plain definitions of endpoint, server, network, account, log, alert and evidence, and how lessons are structured. Quiz, lab, explain-back and a new interview question. |
| B2 | 🔴 | Processes lesson: "PowerShell", "cmd.exe", "registry", "signed", "SYSTEM", "EDR", "Sysmon" | Used but never explained | New subsections define each one: what it is, why it exists, why security cares. Added a table of important Windows processes. |
| B3 | 🟠 | KQL, Defender tables and MITRE in the first lessons | Taught ~10 lessons later | **Depth levels 1–8** on every lesson, plus automatic **"Preview" notes** on Microsoft/KQL/MITRE sections when the learner hasn't reached those lessons yet. |
| B4 | 🟠 | Users lesson: "Active Directory", "domain controller", "Entra ID", "MFA" | Undefined | Added "Where company accounts live", with each term defined. |
| B5 | 🟠 | Networking: "protocol", "packet", "firewall", "router", "/24 bits" | Undefined; the module's own objective promised the OSI/TCP-IP model, but it wasn't taught | Added the basic words, the 4-layer TCP/IP model with the evidence each layer creates, the network devices, and a bits explanation. |
| B6 | 🟠 | Quiz q-net-1 relied on "documentation ranges" | Never taught | Lesson now explains RFC 5737 documentation addresses, which are used throughout the course. |
| B7 | 🟡 | Ports table: SMB, RDP, LDAP, DHCP… | Acronyms without full names | Every row now has the full name. |
| B8 | 🟡 | IOC lesson: "threat feed", "STIX/TAXII", "network and host artifacts" | Undefined | Defined inline. |
| B9 | 🟡 | KQL lesson: "SQL"; log lesson: "JSON"; SIEM lesson: "agents", "APIs"; Sentinel: "Logic Apps", "XPath" | Undefined | Defined inline. |
| B10 | 🟡 | XDR lesson: "SaaS", "on-premises"; SIEM vs EDR vs XDR vs SOAR blurred | Undefined; no comparison | Added a 4-way comparison table and the Microsoft Defender family tree. |
| B11 | 🟡 | Advanced Hunting: "Kerberos", "NTLM", "LDAP", "SAMR" | Undefined | Defined in plain words. |
| B12 | 🟡 | IR: "investigation package", "chain of custody", "reimaging" | Undefined | Defined. |
| B13 | 🟡 | Quiz q-xdr-4 asked about device groups | Not taught | Device groups and automation levels added to the XDR lesson. |
| B14 | 🟠 | No lesson said how it connects to the previous one | The "connect the dots" test failed | Every lesson now opens with **"Where this fits"** and an explicit chain. |
| B15 | 🟠 | No way to check whether Alex could explain a concept | Feynman test missing | Every lesson now has **"Explain it back"**: 3 prompts, a written attempt, then a plain-language model answer. |
| B16 | 🟡 | Normal vs malicious collapsed into "suspicious" | Taught unusual = bad | Added **normal → suspicious → confirmed malicious** tables to the processes, IOC, triage, Windows events and IR lessons. |
| B17 | 🟡 | The event-to-incident chain stopped at "incident" | Brief requires investigation → response | Added Investigation and Response as steps 7–8. |

## D. Missing prerequisites (fixed)

- No orientation before processes → **Module 0 "Orientation"** added first in the learning path; foundations now list it as a prerequisite.
- Lessons used terms from later modules → addressed by Preview notes, inline definitions and an automated check that no acronym is used before it's defined (`npm run audit`).

## E. KQL audit

**Method.** All 78 queries were extracted automatically from lessons, the glossary and the KQL reference. Each was parsed and semantically analyzed by Microsoft's Kusto.Language. Schemas: 15 tables taken from Microsoft Learn reference pages, plus 6 well-known tables not re-fetched (see M). Then each query's logic and interpretation was reviewed by hand.

**Result:** 76/78 → **78/78** pass. Logic fixes beyond what the parser can catch:

| Query | Sev | Problem | Fix |
|---|---|---|---|
| Group changes (×2) | 🔴 | Nonexistent column; group/member swapped | `MemberName` / `TargetUserName` (= group) |
| Hash hunts (×4) | 🔴 | `SHA256` usually empty | `SHA1` |
| Failed-then-success logons | 🟠 | Counted local logons (`IpAddress` "-"); didn't check the success came after the failures | Filter empty/"-"; `LastSuccess > LastFailure` |
| Spray rule | 🟡 | `Attempts / Accounts` — integer division in KQL | `todouble(Attempts) / Accounts`, with an explanation |
| SIEM correlation | 🟡 | `distinct Account = …` (accepted by the parser but non-standard) | `extend` then `distinct` |
| Syslog SSH parse | 🟡 | `parse` silently missed "for root from…" lines | `extract()` regex; tested on both line shapes |
| Source health | 🟡 | No time filter (full-retention scan) | `ago(7d)` filter; notes that powered-off machines also appear |
| Connector health `union` | 🟡 | Fails if a table is missing | `union isfuzzy=true` |
| Alerts by entity | 🔵 | Account entities often store name and UPN suffix separately | Search on the account name |
| Rare processes | 🔵 | Deprecated `any()` | `take_any()` |
| Timeline by device | 🔵 | `DeviceName == "fin-ws-014"` misses FQDNs | `startswith`, with a note |
| Five-questions query | 🔵 | Alias `Where` is a keyword lookalike | `FromIP` |
| DNS failures | 🟠 | Legacy table | `ASimDnsActivityLogs` (see T8) |

Placeholders (e.g. `"<sha1-from-your-investigation>"`) are labeled as placeholders in a comment.

## F. Microsoft audit

T6–T10 and T14 above. Also verified as accurate: the Sentinel roles; analytics rule types; automation rules vs playbooks; Advanced Hunting's ~30-day window; that `AlertInfo`/`AlertEvidence` join on `AlertId`; the email tables joining on `NetworkMessageId`; `UrlClickEvents` columns; that `Usage.Quantity` is in MB; the `SentinelAudit` columns; the `SecurityAlert` columns. A **stable concept vs current UI** note was added to the Sentinel lesson.

## G. MITRE audit

All 35 IDs were checked against ATT&CK v19.2. Names and IDs for T1059.001, T1566.002, T1021.001, T1071.001, T1071.004, T1568.002, T1543.003, T1098, T1136, T1046, T1547.001, T1110.001/.003 and T1078 are correct. Fixed: T3, T4, T5, plus the T1036 and T1078 tactic labels. Lessons now carry a note: "checked against v19 — confirm on attack.mitre.org".

## H. Event ID audit

| ID | Log | Status |
|---|---|---|
| 4624 | Security | ✔ Logon types verified; the Logon ID linking field was added |
| 4625 | Security | ✔ Status/SubStatus codes added |
| 4672 | Security | 🟠 corrected (T6) |
| 4688 | Security | ✔ Both required policies now named |
| 4720 | Security | ✔ |
| 4728 / 4732 / 4756 | Security | 🔴 field interpretation corrected (T2) |
| 4740 | Security | ✔ |
| 7045 | **System** → `Event` table | ✔ 4697 twin added |
| 1102 | Security | ✔ Now a full block, mapped to T1685.001 |

The Windows lesson teaches each event as: user action → Windows behavior → log → key data → normal/suspicious. Interview question iv-4624 was rewritten from trivia into the scenario form from the brief.

## I. Resource audit

106 URLs checked (70 resources/docs plus generated MITRE links).

- **Broken (404):** `kusto/query/logical-or-operator` → replaced with `logical-operators`.
- **Redirected and updated:** the SC-200 exam page (now `/certifications/security-operations-analyst/`), Sentinel built-in detections (now `/threat-detection`), CISA, the Sentinel Tech Community blog.
- **KQL docs** now default to the Microsoft Fabric view, which is confusing for SOC learners → all KQL links pinned to `?view=microsoft-sentinel`.
- Resources about product UI that changes often keep their "may change" flag.

## J. UX / website QA

Tested in the browser at desktop width and at 375 px phone width, in dark and light mode.

| Area | Result |
|---|---|
| Navigation, sidebar, mobile drawer | ✔ |
| Search (Event IDs, MITRE, glossary, labs, queries) | ✔ |
| Lessons: levels, preview notes, bridge, explain-back | ✔ (preview appears on early lessons and is absent on later ones) |
| Quiz feedback (why-wrong + concept) | ✔ |
| Exam simulator: full 15-question run to results | ✔ |
| Interview mode | ✔ |
| Notes create/edit/delete, notes page | ✔ |
| Bookmarks, progress, persistence after reload | ✔ |
| Theme toggle | ✔ |
| 34 routes at 375 px: overflow / render | ✔ 0 problems |
| Console errors | ✔ none |

Not applicable: KQL playground, log playground, simulators and capstone. These were deliberately not built (see M).

## K. Terminology consistency

- **Event → log → telemetry → detection → alert → incident → investigation → response** is now defined once, in order, and used consistently.
- IOC / IOA / TTP, SIEM / EDR / XDR / SOAR, and threat / vulnerability / risk each have a dedicated comparison table.
- **Microsoft hierarchy** is shown explicitly: the Defender XDR family tree, and the Sentinel pipeline (sources → workspace → tables → KQL → rules → alerts → incidents → automation).
- "Defense Evasion" appears only in the "recent change" note.
- Hash terminology is unified: the glossary term is "File hash (SHA-1 / SHA-256)".

## L. Lessons rewritten or substantially changed

**New:** `start-here`.

**Substantial rewrite of sections:**
- `comp-processes`: new terms, process table, normal/suspicious/malicious table
- `comp-users-permissions`: identity primer, field table
- `net-tcpip-ports`: basics, TCP/IP model, devices, bits, documentation IPs
- `win-event-logs`: 4672/4688/7045/1102, codes, WEF, malicious table
- `mitre-framework`: v19

**Targeted fixes (bridge, explain-back, definitions):** all 18 lessons.

**Engine changes:**
- Depth levels 1–8, preview notes, "Where this fits", "Explain it back".
- KQL notes now state that queries were parser-verified.

## M. Remaining issues (need human review)

1. 🟡 **Live execution.** Queries pass Microsoft's parser against official schemas but weren't run against live data; there's no tenant here. Running them once in a trial workspace would confirm result shapes.
2. 🟡 **Six schemas taken from knowledge, not re-fetched:** `Syslog`, `Event`, `AuditLogs`, `SecurityIncident`, `CommonSecurityLog`, `AADNonInteractiveUserSignInLogs`. These are long-stable tables and the queries pass, but treat them as lower confidence.
3. 🟠 **Scope decisions from earlier:** there is no in-app KQL/log playground, no investigation simulators and no capstone. The quality-gate items "KQL playground works", "investigations solvable" and "capstone coherent" are therefore **not applicable, not passed**.
4. 🟡 **15 modules are outlines.** They don't fail the beginner path because nothing in the path depends on them, but outline topics such as Linux and Phishing aren't yet taught in depth.
5. 🔵 **Module checkpoints** pull every question from their lessons, but most modules have fewer than the 10 knowledge / 5 scenario / 5 interview questions the brief asks for.
6. 🔵 **Fast-moving SC-200 topics** (Sentinel graph, MCP server, Security Copilot, KQL jobs, summary rules) are mapped and linked to official docs but have no full lessons.

## Quality gate

| Gate | Status |
|---|---|
| Core facts, Microsoft info, KQL syntax, Event IDs, MITRE, SC-200 mapping, resources verified | ✅ (with M1–M2 caveats) |
| Beginner can follow the curriculum; prerequisites correct; no undefined terms | ✅ automated check + second Alex pass |
| Concepts connect; why/how/evidence/SOC use present; normal vs suspicious vs malicious | ✅ |
| Labs understandable; quiz answers correct and taught; interview questions reasoning-based | ✅ |
| Navigation, search, progress, notes, bookmarks, mobile, dark mode, no console errors | ✅ |
| KQL playground, investigations, capstone | ⛔ not built (scope decision) |

## Re-running the audit

```bash
npm run audit:install   # once: installs Microsoft's KQL parser into audit/
npm run audit           # inventory + KQL parser check + acronym-before-definition check
```
