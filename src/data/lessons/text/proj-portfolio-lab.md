## bridge

You've learned the concepts, the tools and the exam objectives. Employers hiring junior SOC analysts want one more thing: **proof you can do the work**. A small, honest, well-documented **portfolio project** — built in your own lab — shows how you think far better than a list of certificates.

This lesson shows how to plan, build, document and present a project safely: no real company data, no leaked secrets, no exaggerated claims.

**Chain:** Pick a question a SOC cares about → build a small lab you own → collect data → write KQL and a detection → test it → document like an incident report → publish safely (no secrets, no real data) → describe it honestly in a resume and interview

## what

### 1. A portfolio project
A **portfolio project** is a small, complete piece of security work that you **built yourself** and can **show and explain**: the goal, the setup, the queries, the results and what you learned.

### 2. What makes a good one
| Quality | Means |
|---|---|
| **Focused** | Answers one clear question ("Can I detect password spraying against my lab tenant?") |
| **Reproducible** | Someone could follow your steps and get similar results |
| **Evidence-based** | Screenshots, queries and real (lab) output — not just claims |
| **Explained** | Why you made each choice, what failed, what you'd do next |
| **Safe** | No secrets, no personal data, no employer data, no attacks on systems you don't own |

### 3. Project ideas that match SOC work
1. **Sentinel home lab** — a free-trial workspace collecting your own lab's sign-in and Windows logs; three analytics rules; a workbook.
2. **KQL detection pack** — 5–10 detections mapped to MITRE ATT&CK, each with a hypothesis, query, test method and tuning notes.
3. **Phishing analysis write-up** — analyze spam *you* received: headers, SPF/DKIM/DMARC results, links (defanged), verdict.
4. **Linux SSH visibility** — a small cloud Linux VM with key-only SSH, sending syslog to Sentinel; analyze the background noise of failed logins it receives.
5. **Incident report** — a realistic ticket written from your lab investigation using the course's ticket template.

## why

Projects matter because:

- **Hiring managers can't see your thinking** from a certificate; a write-up shows it.
- **Interviews** often ask "tell me about something you built or investigated" — a project gives you a real story.
- **You learn more** by building: broken connectors, empty tables and noisy rules teach lessons no course can.
- **Honesty is visible** — a modest project explained clearly beats an impressive-sounding claim you can't defend.

## name

- **Portfolio** — from artists and architects, who carry a folder (*portfolio*) of their best work to show clients.
- **Lab** — a *laboratory*: a safe place for experiments.
- **Repository (repo)** — where code and documents are *reposited* (stored), for example on GitHub.

## problem

A good project answers the questions interviewers actually ask:

1. **Can you work with real tools?** — Sentinel, Defender, KQL.
2. **Can you think like an analyst?** — hypothesis, evidence, verdict.
3. **Can you write?** — clear documentation and incident notes.
4. **Do you understand limits?** — what your detection would miss.
5. **Can you be trusted?** — you handled data and credentials responsibly.

## analogy

An apprentice chef's tasting menu:

- Not a claim of "I can cook anything" — but **three dishes** cooked well.
- Each with a **recipe card** (your documentation) so someone else could recreate it.
- Using **your own ingredients** (your lab data), not food taken from a restaurant you worked at (an employer's data).
- And you never leave the **restaurant's safe combination** on the recipe card (your passwords and keys).

## how

### Step 1: Choose a question
Start from a skill in this course: *"Can I detect a single IP failing sign-in against many accounts?"* Keep the scope small enough to finish in 1–3 weekends.

### Step 2: Build a lab you own
- Use **your own** Azure subscription (free credits or pay-as-you-go with a **budget alert**) and trial licenses where available.
- Create **test users** and **test devices**; never use a work account or production tenant.
- Only generate activity **against your own lab** (for example, deliberately failing sign-ins to your own test accounts).

### Step 3: Collect and query
1. Connect data sources (Entra ID sign-ins, Windows Security Events via the Azure Monitor Agent, Syslog).
2. Check the tables fill up.
3. Write and test your KQL.

### Step 4: Build and test the detection
Hypothesis → query → backtest → generate test activity → confirm the alert → tune → note what it would **miss**.

### Step 5: Document
A clear README:

| Section | Content |
|---|---|
| Objective | The question and why a SOC cares |
| Architecture | A simple diagram of the lab |
| Data sources | Tables and connectors |
| Detection logic | The KQL, explained line by line |
| Testing | How you generated test activity and what fired |
| Results | Screenshots with sensitive values redacted |
| Limitations | What it misses; false-positive risks |
| MITRE ATT&CK | Technique IDs |
| What I learned | Honest reflections, including mistakes |

### Step 6: Publish safely
- **Never commit secrets** — passwords, API (application programming interface) keys, connection strings, tenant IDs you'd rather not share. Use a `.gitignore` and turn on **secret scanning and push protection** on GitHub.
- **Redact** IP addresses, usernames and tenant names in screenshots unless they are clearly fake lab values.
- **Delete lab resources** when finished to avoid costs.

### Step 7: Describe it honestly
- ✅ *"Built a Microsoft Sentinel lab ingesting Entra ID sign-in logs; wrote and tested a password-spray detection (KQL, MITRE T1110.003) and documented tuning decisions."*
- ❌ *"Led enterprise SOC detection engineering."* — if it was a home lab, say so.

## realWorld

A career-changer publishes three projects on GitHub: a Sentinel lab with four detections, a phishing header analysis of spam they received, and a written incident report from their lab.

In an interview they're asked "How would you detect password spraying?" They answer by walking through **their own** query, the threshold they chose and why, and the false positive they found from their home router's shared IP — a far stronger answer than a definition.

## securityExample

A learner pushes their lab project to a public GitHub repository. The commit includes a configuration file containing a **client secret** for their lab app registration.

Within hours, automated scanners find it. Because the learner had **push protection** off, the secret went public. Correct response — the same as in a real SOC:
1. **Revoke** the secret immediately in Entra ID and create a new one.
2. **Check sign-in logs** for the app's service principal for unexpected use.
3. **Remove** the secret from the repository history (deleting the file in a new commit is not enough — it remains in history).
4. **Prevent recurrence** — `.gitignore`, environment variables or a key vault, and secret scanning with push protection.

## normal

A healthy portfolio project:
- Uses **lab-only** accounts, devices and data.
- Has a **README** that explains goal, method, results and limits.
- Shows **queries and screenshots** with sensitive values redacted.
- Has **no secrets** in code or history.
- Is described **accurately** on a resume.

## suspicious

Red flags reviewers notice (and attackers exploit):

- **Secrets in the repository** — keys, passwords, connection strings.
- **Real company data** — logs, hostnames or emails from an employer.
- **Claims without evidence** — "detected APTs" with no queries or results.
- **Activity against systems you don't own** — scanning or testing anything outside your lab is illegal and disqualifying.
- **Copied projects** — someone else's repository with your name on it.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A repo with KQL detections, redacted screenshots and a clear README |
| **Suspicious** | A commit that briefly included a lab client secret, later "deleted" |
| **Confirmed malicious** | That secret, still in the history, is used by an unknown IP to sign in as the app |

## abuse

Defensive view — public repositories are a known attack surface:

| Risk | How it's misused | Defense |
|---|---|---|
| Leaked credentials in code | Automated scanners harvest keys from public repos within minutes | Secret scanning and push protection; key vaults; rotate on exposure |
| Leaked infrastructure details | Hostnames, IPs and tenant names help reconnaissance | Redact; use clearly fake lab values |
| Real personal data | Privacy violations; legal issues | Lab-generated data only |
| Overclaiming | Discovered in interviews; damages trust | Describe scope honestly |

## evidence

Your project produces evidence of skill:
- **Queries** with comments.
- **Screenshots** of tables, alerts and workbooks.
- **Commit history** showing how the work evolved.
- **Write-ups** in incident-report style.

And your lab produces security evidence you can practice on — your own sign-ins, failed logins, process events and alerts.

## where

| Evidence | Where |
|---|---|
| Lab sign-ins | `SigninLogs` in your Sentinel workspace |
| Lab Windows events | `SecurityEvent` (via Azure Monitor Agent) |
| Lab Linux events | `Syslog` |
| Your detections' alerts | `SecurityAlert`, `SecurityIncident` |
| Lab cost | `Usage` table; Azure Cost Management |
| Your write-up | A public or private GitHub repository |

## analyst

Treat your portfolio like a real SOC deliverable:

1. **Scope** — what's in and out of the lab.
2. **Evidence** — every claim backed by a query or screenshot.
3. **Clarity** — someone non-technical could follow the objective and result.
4. **Limits** — what the detection misses and why.
5. **Hygiene** — no secrets, no real data, resources cleaned up.

## microsoft

- **Microsoft Sentinel** — free trial for new workspaces (check the current limits) and data connectors for Entra ID, Windows and Linux.
- **Microsoft Entra ID** — sign-in logs from your own tenant's test users.
- **Microsoft Defender XDR** — trial licenses where available for endpoint and email practice.
- **Azure Data Explorer** free cluster and the **help cluster** — practice KQL on public sample data at no cost.
- **Microsoft Learn** — free SC-200 learning paths and the official practice assessment.

## explainBack

Q: Why is a small, honest project better than a big claim?
A: Interviewers will ask detailed questions. A small project you built and understood lets you explain every decision and limitation; an exaggerated claim falls apart under the first follow-up question and damages trust.

Q: You accidentally pushed a key to a public repository and deleted it in the next commit. Are you safe?
A: No. It's still in the repository history and may already have been harvested by automated scanners. Revoke or rotate the key immediately, check for misuse, and clean the history.

Q: Why must you only generate test activity in your own lab?
A: Testing or scanning systems you don't own is illegal and unethical, even for learning. Your own lab gives you the same evidence to practice on without harming anyone.
