## bridge

Detections wait for something to match a rule. But skilled attackers try hard **not** to match rules — they use valid accounts, built-in tools and slow, quiet steps. **Threat hunting** is the proactive search for those attackers **before** an alert tells you they're there.

You already have the tools: KQL, Advanced Hunting tables, MITRE ATT&CK and threat intelligence. This lesson gives you the **method** — how to turn a question into a hunt, and a hunt into lasting value.

**Chain:** Hypothesis (from intel, ATT&CK or a hunch based on data) → choose data → query and stack → investigate outliers → findings (bookmarks) → incident if malicious → new detection either way → document

## what

### 1. Threat hunting
**Threat hunting** is a **human-led, hypothesis-driven** search through your data for threats that existing detections missed.

| | Detection | Hunting |
|---|---|---|
| Trigger | A rule matches automatically | A person asks a question |
| Assumes | We know what bad looks like | Something may be here that we don't recognize yet |
| Output | Alerts | Findings, new detections, better visibility |
| Frequency | Continuous | Planned campaigns or regular cycles |

### 2. Hypotheses
A **hypothesis** is a testable statement: *"If an attacker were doing X in our environment, we would see Y in data source Z."*

Common sources:
- **Intelligence-driven** — "The group in this week's report uses scheduled tasks named like updaters. Do we have any?"
- **Technique-driven (ATT&CK)** — "We have no detection for T1053.005 (Scheduled Task). Is anyone abusing it?"
- **Crown-jewel driven** — "Who accessed the payroll database from unusual machines?"
- **Anomaly-driven** — "Which processes run on only one or two devices in the whole company?"

### 3. Core hunting techniques
- **Searching** — looking for a specific thing (an indicator, a command line pattern).
- **Stacking (least-frequency analysis)** — counting how often each value occurs and looking at the **rare** ones. In a large company, malware is usually rare; legitimate software is common.
- **Grouping and clustering** — finding things that happen together (the same process, parent and destination across devices).
- **Baselining** — comparing behavior to its own normal (this account usually signs in from 1 country; today 4).

## why

Hunting exists because:

- **Detections have gaps** — no rule set covers every technique, and attackers test against common rules.
- **Attackers dwell** — they may spend days or weeks inside before acting; finding them early limits damage.
- **New intelligence arrives** — a campaign published today may have been in your network last month.
- **Hunting improves everything else** — every hunt either finds something, proves an absence for now, or reveals missing data. All three are valuable.

## name

- **Hunting** — actively searching for prey rather than waiting for it to trip an alarm.
- **Hypothesis** — from Greek, "a supposition": an idea put forward to be tested.
- **Stacking** — like stacking coins by type to see which pile is unusually small.
- **Dwell time** — how long an attacker *dwells* (stays) undetected.

## problem

Hunting answers questions like:

1. **Is this newly reported technique or campaign present here?**
2. **What is running in our environment that nobody can explain?**
3. **Which accounts behave unlike themselves?**
4. **Do we even have the data to see technique X?** — hunting reveals visibility gaps.
5. **What new detection should we build?** — the best detections come from hunts.

## analogy

A park ranger:

- **Detections** — motion cameras that alert when something big crosses a trail.
- **Hunting** — walking the forest looking for signs the cameras miss: broken branches, tracks, a hidden campsite.
- **Hypothesis** — "poachers in the north usually camp near water; let's check the streams."
- **Stacking** — counting tracks by animal: deer tracks everywhere are normal; one set of boot prints where nobody should walk is interesting.
- **Turning hunts into detections** — putting a new camera where the boot prints were found.

## how

### Step 1: Write the hypothesis
*"Attackers who gain a foothold often persist with scheduled tasks whose actions run scripts from user-writable folders. If present, `DeviceProcessEvents` will show `schtasks.exe` creating tasks that reference AppData, Temp or Public folders."*

Include: technique (ATT&CK ID), data source, expected evidence, time range.

### Step 2: Check the data
Is the table populated for all devices? How far back does retention go? (In Sentinel, older data may sit in the **data lake** tier, searchable with KQL jobs.)

### Step 3: Query broadly, then narrow
1. Start wide (all task creations in 30 days).
2. **Stack** by command line, parent process and device count.
3. Remove the common, explained results (software updaters seen on thousands of devices).
4. Investigate what's left.

### Step 4: Investigate outliers
For each rare result: what created it, which user, what else happened on that device around that time, is the file signed, does anything connect out?

### Step 5: Record findings
- In Sentinel, save interesting rows as **bookmarks** (with notes and mapped entities); bookmarks can be promoted to **incidents**.
- In Defender XDR, link query results to an incident or create a **custom detection** from the query.

### Step 6: Close the loop
| Outcome | What to do |
|---|---|
| Malicious activity found | Open an incident; respond |
| Nothing malicious, query is precise | Turn it into a **scheduled detection** |
| Nothing malicious, query is noisy | Keep it as a **hunting query** for periodic reruns |
| Data missing | Raise a **visibility gap** to the engineering team |

Document every hunt: hypothesis, data, queries, results, decisions.

## realWorld

A SOC runs a hunting cycle every two weeks:

- Week 1: one **intel-driven** hunt based on the latest threat analytics report.
- Week 2: one **ATT&CK gap** hunt for a technique with no detection.
- Results this quarter: 1 real compromise found (an old unused admin account signing in from abroad), 4 new detections, 2 logging gaps fixed, and a library of 12 reusable hunting queries.

## securityExample

**Hypothesis:** "Executables that run on only one or two devices company-wide, from user-writable folders, may be malware that evaded antivirus."

1. Stack 7 days of process starts by file hash, folder and device count.
2. 40,000 distinct files → filter to those on ≤ 2 devices and running from AppData/Temp → 63 results.
3. Most are developer tools and one-off installers. Three are **unsigned**, have random names, and run from `AppData\Roaming` on a single laptop.
4. One of them makes regular connections every 60 seconds to a domain registered last month — a **beaconing** pattern.

The hunt becomes an incident. Afterwards, a detection is created for "unsigned executable in AppData beaconing at a regular interval".

## normal

- Hunts that find **nothing malicious** — this is the most common result, and still useful.
- Rare processes explained by developers, IT tools and one-off installers.
- Accounts whose unusual behavior matches travel, role changes or projects.
- A growing library of documented hunting queries.

## suspicious

Results that deserve deeper investigation:

- **Rare + unsigned + user-writable folder** executables.
- Processes **beaconing** at very regular intervals to rare destinations.
- **Scheduled tasks or services** that run scripts from Temp, AppData or Public folders.
- Built-in tools (`certutil`, `mshta`, `rundll32`) used in **unusual ways** or by unusual parents.
- Accounts using **admin tools for the first time**, or signing in to servers they never used.
- **Gaps** — devices or log sources that stopped reporting.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A rare executable is a developer's build tool, signed by the company |
| **Suspicious** | A rare unsigned executable in AppData on one laptop, created yesterday |
| **Confirmed malicious** | It contacts a newly registered domain every 60 seconds and was dropped by a macro-enabled document |

## abuse

Defensive notes — attackers try to stay below the hunter's radar:

| Attacker approach | Why it evades rules | Hunting technique that helps |
|---|---|---|
| Living off the land (built-in tools) | The tools are legitimate | Stack by parent/child and command line patterns |
| Low and slow activity | Stays under thresholds | Longer time windows; baselines per account |
| Valid accounts | Sign-ins succeed normally | Baseline locations, devices and access patterns |
| Masquerading names | Looks like system files | Compare path, signer and hash to the real file |
| Blending into noise | Hides among thousands of events | Rarity analysis across the whole fleet |

## evidence

Hunting uses the same evidence as investigations — process, file, network, sign-in, email, identity — but across **all** devices and **long** time ranges. It produces:

- **Hunting queries** (saved, with MITRE mappings).
- **Bookmarks** — saved results with analyst notes.
- **Hunt records** — hypothesis, scope, outcome.
- **New detections** and **visibility gap** reports.

## where

| Need | Where |
|---|---|
| Endpoint hunts | Advanced Hunting: `DeviceProcessEvents`, `DeviceNetworkEvents`, `DeviceFileEvents` |
| Identity and sign-in hunts | `SigninLogs`, `IdentityLogonEvents`, `IdentityQueryEvents` |
| Saved hunting queries and Hunts | Microsoft Sentinel → Hunting |
| Findings | Sentinel bookmarks (`HuntingBookmark` table) |
| Long-term data | Sentinel data lake — KQL jobs; summary rules for aggregated history |
| Advanced analysis | Sentinel notebooks (Jupyter) |

## analyst

A good hunt record has six lines:

1. **Hypothesis** — what you expected to find, and why.
2. **ATT&CK mapping** — technique ID(s).
3. **Data and time range** — tables and period searched.
4. **Method** — queries, stacking and filters.
5. **Results** — what you found, including "nothing malicious".
6. **Follow-up** — incident, new detection, saved query, or visibility gap.

Junior analysts can start hunting by **rerunning** the team's saved hunting queries and investigating what's new since last time.

## microsoft

- **Microsoft Sentinel hunting** — built-in and custom hunting queries with MITRE mapping, the **Hunts** experience to manage hunting campaigns, **bookmarks**, and promotion of findings to incidents.
- **Microsoft Sentinel data lake** — low-cost long-term storage; **KQL jobs** search it and promote results; **summary rules** pre-aggregate high-volume data.
- **Notebooks** — [[jupyter-notebook|Jupyter notebooks]] for advanced analysis and visualization.
- **Microsoft Defender XDR Advanced Hunting** — hunting across endpoint, email, identity and cloud-app tables; create custom detections from hunts.
- **Threat analytics** — reports that suggest hunting queries for active threats.

## explainBack

Q: What's the difference between hunting and waiting for alerts?
A: Alerts fire only when activity matches an existing rule. Hunting starts with a human question about what an attacker might be doing and searches the data for it — finding threats that slipped past the rules.

Q: Explain stacking with a classroom.
A: Count which lunch every pupil brought. Sandwiches appear 25 times, so they're normal. One pupil brought something nobody else has — that rare item is worth a closer look. In a company, software on thousands of devices is normal; a program on one device deserves checking.

Q: Your hunt found nothing malicious. Was it a waste of time?
A: No. You've shown the technique wasn't present in that period, and you either have a precise query to turn into a detection, a reusable hunting query, or a discovered visibility gap — each makes the SOC stronger.
