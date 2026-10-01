## bridge

You've seen attacker behaviors described in many ways so far — password guessing, unusual process trees, privileged group changes. **MITRE ATT&CK** gives every one of those behaviors a precise, shared name, so analysts, tools and reports all speak the same language.

**Chain:** Attacker behavior → evidence → detection → *MITRE technique* → investigation

## what

**[[mitre-attack|MITRE ATT&CK]]** is a free, public **knowledge base of attacker behavior**, built from real-world attacks.

It organizes behavior into four levels, from broad to specific:

### 1. Tactic — the goal ("why")
- Example: **Credential Access** — the attacker wants to steal passwords.

### 2. Technique — the method ("how")
- Example: **Brute Force** — guessing passwords.

### 3. Sub-technique — a more specific variant
- Example: **Password Spraying** — trying one common password across many accounts.

### 4. Procedure — how a specific attacker actually did it
- Example: *"Group X used a script to try the password 'Spring2026!' against 500 accounts."*

## why

Before ATT&CK, every vendor and team described attacks in **their own words**.

Reports said things like *"the attacker moved around the network"* — vague and impossible to compare.

MITRE released ATT&CK publicly in **2015** to give defenders a **common vocabulary** based on observed behavior, so that:

- Detections can be compared.
- Reports are precise.
- Intelligence can be shared and measured.

## name

- **MITRE** — a US not-for-profit organization that runs federally funded research centers.
- **ATT&CK** — **A**dversarial **T**actics, **T**echniques & **C**ommon **K**nowledge.
  - "Common knowledge" because it is built from **publicly reported** attacks.

## problem

ATT&CK helps a SOC in four ways:

### Communication
`T1110.003` means password spraying to every analyst, everywhere.

### Coverage
Map your detections onto the matrix and **see the gaps**.

### Prioritization
Focus on techniques used by attackers who target **your industry**.

### Investigation structure
Place each piece of evidence on a timeline of attacker goals.

## how

### The Enterprise matrix

In the current version (**ATT&CK v19**, 2026) the Enterprise matrix has **15 tactics** (columns), roughly in the order an attack unfolds:

| ID | Tactic | Attacker's goal |
|---|---|---|
| TA0043 | Reconnaissance | Gather information about the target |
| TA0042 | Resource Development | Set up tools and infrastructure |
| TA0001 | Initial Access | Get in |
| TA0002 | Execution | Run code |
| TA0003 | Persistence | Stay in |
| TA0004 | Privilege Escalation | Get higher permissions |
| TA0005 | Stealth | Hide and blend in with normal activity |
| TA0112 | Defense Impairment | Break or weaken security tools and logging |
| TA0006 | Credential Access | Steal passwords and tokens |
| TA0007 | Discovery | Learn about the environment |
| TA0008 | Lateral Movement | Move to other systems |
| TA0009 | Collection | Gather target data |
| TA0011 | Command and Control | Communicate with compromised systems |
| TA0010 | Exfiltration | Steal data out |
| TA0040 | Impact | Disrupt, destroy or encrypt |

### How the IDs work

> **Recent change:** older versions had a single tactic called **Defense Evasion** (TA0005). ATT&CK split it into **Stealth** (TA0005 — hiding and blending in) and **Defense Impairment** (TA0112 — breaking security tools). Older training material, and some product screens, may still say "Defense Evasion".

- **Tactics** start with `TA` — e.g. `TA0008`.
- **Techniques** start with `T` — e.g. `T1059` (Command and Scripting Interpreter).
- **Sub-techniques** add a suffix — e.g. `T1059.001` (PowerShell).

> One technique can serve **several tactics**. For example, `T1078` Valid Accounts appears under four: Stealth, Persistence, Privilege Escalation and Initial Access.

## analogy

ATT&CK is like a **sports playbook encyclopedia**:

- **Tactics** = the objectives (score, defend, advance).
- **Techniques** = named plays.
- **Procedures** = how one particular team ran that play in one particular game.

Coaches (defenders) study the plays so they can prepare defenses — they didn't have to invent them.

## realWorld

- **Microsoft Sentinel** analytics rules and **Defender XDR** alerts are tagged with ATT&CK tactics and techniques.
- A SOC exports its rule mappings into the **ATT&CK Navigator** to show leadership something like:

> *"We can detect 60% of the techniques used by groups that target the finance sector."*

## securityExample

Mapping evidence from an investigation:

| Evidence found | Technique |
|---|---|
| User received a malicious link by email | `T1566.002` Phishing: Spearphishing Link |
| Sign-in with the user's real password from a new location | `T1078` Valid Accounts |
| A scripting tool started by an Office app | `T1059` Command and Scripting Interpreter |
| Many accounts failing one sign-in each from one source | `T1110.003` Password Spraying |
| Remote Desktop between internal computers | `T1021.001` Remote Desktop Protocol |
| Regular outbound HTTPS check-ins | `T1071.001` Web Protocols |

## normal

Many techniques describe actions that **administrators also perform**:

- Using remote services
- Running scripts
- Creating accounts

> An ATT&CK mapping does **not** mean "malicious". It means "this behavior is used in attacks — understand when it's expected in your environment".

## suspicious

What matters is a **chain** of techniques across tactics, for the **same user or device**, in a short time. For example:

1. Initial Access
2. → Execution
3. → Credential Access
4. → Lateral Movement

…all within a few hours. That is far more significant than any single technique.

## abuse

ATT&CK is public, but its purpose is **defensive**: understanding behavior so it can be detected and stopped.

It describes **what** attackers do, at the level needed for detection — not step-by-step instructions.

## evidence

Each technique page on attack.mitre.org includes:

- **Procedure examples** — how real groups have used it.
- **Mitigations** — how to prevent it.
- A **Detection Strategy** — what behavior to look for, and which kinds of logs can reveal it. (Older versions called this section "Data Sources".)

> This is a direct bridge: **technique → detection strategy → log table → query**.

## where

ATT&CK tags appear on:

- Alerts and incidents in **Defender XDR**.
- **Sentinel** analytics rules and hunting queries.
- Sentinel's **MITRE ATT&CK coverage** page.

## analyst

Use ATT&CK in four ways:

1. **Label** each event on your incident timeline with a technique.
2. **Predict** what to check next.
  - "They stole credentials → look for lateral movement."
3. **Report** clearly using shared terms.
4. **Find detection gaps** after an incident: what happened that we didn't alert on?

## microsoft

- Microsoft Sentinel has a **MITRE ATT&CK** page showing which techniques your active and available rules and hunting queries cover.
- SC-200 includes this exact objective:

> *"Analyze attack vector coverage by using the MITRE ATT&CK matrix."*

## explainBack

Q: Explain the difference between a tactic and a technique using a bank robbery.
A: The tactic is the goal — for example, "get into the vault". The technique is how they do it — "drill through the wall" or "steal the manager's key". Many techniques can serve the same goal.

Q: Does a MITRE mapping on an alert mean the activity is malicious?
A: No. Many techniques describe things admins do too, like running scripts or using remote desktop. The mapping tells you what kind of behavior it is; the evidence and context decide whether it's an attack.

Q: Why is ATT&CK useful after an incident is closed?
A: You can compare what the attacker did with what your rules detected. The techniques you missed show exactly where to build new detections.
