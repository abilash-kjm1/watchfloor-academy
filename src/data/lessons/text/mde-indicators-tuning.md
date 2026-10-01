## bridge

In the Defender for Endpoint lessons you investigated devices and took response actions on **one** device at a time. Two settings let you act on **every** device at once: **indicators** (allow, audit, warn or block a specific file, IP address, URL, domain or certificate) and **alert tuning rules** (automatically hide or resolve alerts you have confirmed are expected).

Both are powerful — and both are **security exceptions** if used carelessly. This lesson shows when to use each, and how to keep them safe.

**Chain:** Investigation finds a bad file, domain or IP → indicator blocks it everywhere → or: investigation proves an alert is expected business activity → narrow alert tuning rule → both reviewed, scoped to device groups, and given owners and expiry

## what

### 1. Custom indicators
An **indicator** (sometimes called a custom indicator, or custom IoC) tells Defender for Endpoint how to treat a specific entity across your devices.

| Indicator type | Available actions |
|---|---|
| **File** (hash) | Allow, Audit, Warn, Block execution, Block and remediate |
| **IP address** | Allow, Audit, Warn, Block execution |
| **URL / domain** | Allow, Audit, Warn, Block execution |
| **Certificate** | Allow, Block and remediate |

What the actions mean:
- **Allow** — don't detect or block it (used to fix a false positive).
- **Audit** — let it run, but raise an alert.
- **Warn** — show the user a warning they can bypass.
- **Block execution** — don't let it run or connect.
- **Block and remediate** — block it and clean it up (for example, quarantine the file).

Each indicator can have an **expiry date** and can be **scoped to device groups**. There is a limit of **15,000 indicators per tenant**.

### 2. Alert tuning (formerly alert suppression)
**Alert tuning rules** automatically handle alerts that match conditions you define — for example "this alert, for this file, from this folder, on these devices". Actions:
- **Hide alert** — suppress the alert so no incident is created (Defender for Endpoint alerts only; the data stays in `AlertInfo` and `AlertEvidence`).
- **Resolve alert** — create it already resolved.
- **Set as behavior** — keep it as hunting data (`BehaviorInfo`) instead of an alert.

Defender also ships **built-in alert tuning rules** for common benign activity. You manage all of them in the Defender portal under **Settings → Microsoft Defender XDR → Alert tuning**.

### 3. Three things that are easy to confuse
| Setting | Changes | Example |
|---|---|---|
| **Indicator** | Whether something is *blocked or allowed* | Block a phishing domain on all laptops |
| **Alert tuning** | Whether an *alert* is shown | Resolve the alert for an approved admin script |
| **Antivirus exclusion** | Whether the antivirus *scans* something at all | Exclude a database folder for performance — use rarely |

## why

These settings exist because investigations produce **decisions that should apply everywhere**:

- You confirmed a domain is a phishing site → block it for every device **now**, without waiting for Microsoft's global intelligence.
- Defender wrongly blocks your company's in-house tool → **allow** it so people can work.
- An approved IT script triggers the same alert 200 times a day → **tune** it so analysts can see real threats.

Without these controls, analysts would repeat the same response on every device, or drown in known benign alerts.

## name

- **Indicator** — short for *indicator of compromise (IOC)*; here, any entity you want treated a specific way.
- **Remediate** — to fix or clean up.
- **Tuning** — like tuning a radio: reducing noise so the real signal is clear. Microsoft renamed *alert suppression* to *alert tuning*.

## problem

These settings let an analyst answer:

1. **How do we stop this threat on every device immediately?** — Block indicator.
2. **How do we unblock a legitimate business app?** — Allow indicator (scoped narrowly).
3. **How do we stop an expected alert flooding the queue?** — Narrow alert tuning rule.
4. **What exceptions exist, who made them and why?** — Reviewing indicators and tuning rules regularly.

## analogy

A building's security desk:

- **Block indicator** — a photo on the wall: "Do not let this person in, at any entrance."
- **Allow indicator** — a permanent visitor pass for a known contractor whose ID card keeps setting off the scanner.
- **Warn** — "Are you sure you want to go in there?" — the person can still choose to enter.
- **Alert tuning** — telling the guards: "The cleaners always open the server room at 06:00 on Mondays; don't radio it in." Useful — but if a thief dresses as a cleaner at 06:00 on Monday, nobody will notice.

## how

### Step 1: Decide which tool fits
1. Is the entity **malicious** and you want it stopped? → **Block** indicator (file, domain, URL, IP or certificate).
2. Is a **legitimate** item being blocked or detected? → **Allow** indicator — only for that item, only for the device groups that need it.
3. Is the item legitimate, not blocked, but **creating noise alerts**? → **Alert tuning** rule with narrow conditions.
4. Is it a performance problem with scanning? → Antivirus exclusion — last resort, documented.

### Step 2: Create an indicator well
- **Specific value** — one hash, one domain. Domain indicators also match subdomains (`contoso.com` matches `sub.contoso.com`).
- **Action and alert** — choose whether a match should also generate an alert.
- **Scope** — all devices, or specific device groups.
- **Expiry** — attacker infrastructure changes; old indicators become noise.
- **Title and description** — link to the incident that justified it.

### Step 3: Know the prerequisites
- **IP and URL indicators** rely on **network protection** (in block mode) for browsers other than Microsoft Edge, and on Microsoft Defender SmartScreen in Edge.
- **File indicators** need Microsoft Defender Antivirus as the active antivirus — indicators aren't supported when it runs in passive mode — and cloud-delivered protection.
- File hashes are a stop-gap for **applications**: each version has a different hash, so application control (App Control for Business / AppLocker) is the better way to block an entire app.

### Step 4: Create a tuning rule well
1. Start from the alert (**Tune alert**) so conditions are pre-filled from its evidence.
2. Narrow the conditions: file path **and** signer **and** command line, not just "any PowerShell".
3. Scope to the relevant devices.
4. Prefer **Resolve** (the alert still exists, closed) over **Hide** when you want an audit trail.
5. Name it and comment on *why* — with the ticket or approval.

### Step 5: Review regularly
Monthly: list indicators and tuning rules, remove expired or unexplained ones, and check that each still has an owner.

## realWorld

After a phishing campaign, the SOC:
- adds **Block** indicators for the 3 phishing domains (expiry 90 days, all devices, alert on match);
- adds a **Block and remediate** indicator for the attachment's hash;
- creates an **Allow** indicator for the finance team's in-house reporting tool, which Defender had started to flag after an update — scoped only to the Finance device group;
- creates a **Resolve** tuning rule for an alert caused by the IT team's signed software-deployment script, limited to its exact path and signer.

## securityExample

During a monthly review, an analyst finds an alert tuning rule named "noise" that hides **all** "Suspicious PowerShell command line" alerts on **all** devices. Nobody remembers creating it.

Checking hunting data shows three hidden alerts last week on a sales laptop: encoded PowerShell launched from Excel. The investigation confirms an infection that the rule hid for six days.

Actions: delete the broad rule; open an incident for the laptop; replace the rule with a narrow one for the single approved script (path + signer); require a ticket reference in every new tuning rule.

## normal

- Block indicators tied to **specific incidents**, with expiry dates.
- A **small number** of allow indicators, each scoped and justified.
- Tuning rules with **narrow conditions**, clear names and comments.
- Built-in tuning rules reviewed so the team knows what they suppress.

## suspicious

These are signs of **unsafe** configuration (and possibly abuse):

- **Allow** indicators for unsigned files, broad domains or IP addresses nobody can explain.
- Tuning rules that **hide whole alert types** across all devices.
- Indicators or rules created **outside working hours** by an unexpected account.
- **Thousands of stale indicators** near the 15,000 limit.
- Antivirus **exclusions** for user-writable folders such as Downloads or Temp.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A Resolve rule for one signed IT script on IT admin devices, with a ticket number |
| **Suspicious** | A Hide rule for every PowerShell alert on every device, no comment |
| **Confirmed malicious** | An attacker with admin rights created an Allow indicator for their own tool's hash before running it |

## abuse

Defensive view — exceptions are a favorite target:

| Weakness | How it's misused | Defense |
|---|---|---|
| Over-broad allow indicators | Malware hidden behind an allowed hash, domain or certificate | Narrow scope; review; restrict who can create indicators |
| Over-broad tuning rules | Real attacks never reach the queue | Narrow conditions; Resolve rather than Hide; regular review |
| Antivirus exclusions | Malware dropped into an excluded folder isn't scanned | Avoid user-writable exclusions; audit exclusions |
| Compromised admin account | Attacker disables protection via settings | Role-based access, privileged identity controls, audit of setting changes |

## evidence

- **Indicator matches** — blocked or audited files and connections, alerts when configured.
- **Network protection blocks** — recorded as device events.
- **Tuning rule effects** — hidden alerts remain in hunting tables.
- **Configuration changes** — who created or changed indicators and rules.

## where

| Evidence | Where |
|---|---|
| Hidden or resolved alerts | `AlertInfo`, `AlertEvidence` |
| Network protection and SmartScreen blocks | `DeviceEvents` (e.g. `ActionType` containing `NetworkProtection` or `SmartScreen`) |
| Antivirus detections and blocks | `DeviceEvents` (`AntivirusDetection`) |
| Indicators and tuning rules | Defender portal → Settings → Endpoints → Indicators; Settings → Microsoft Defender XDR → Alert tuning |

## analyst

Before creating any exception, answer five questions in the ticket:

1. **What exactly** is being allowed, blocked or tuned (hash, domain, path + signer)?
2. **Why** — which incident or approval justifies it?
3. **Where** — which device groups?
4. **Until when** — expiry or review date?
5. **Who owns it** — who will review it next month?

## microsoft

- **Microsoft Defender for Endpoint indicators** — file, IP, URL/domain and certificate indicators with Allow, Audit, Warn, Block execution and Block and remediate actions; enforced by Defender Antivirus, network protection/SmartScreen, the cloud detection engine and automated investigation.
- **Alert tuning in Microsoft Defender XDR** — built-in and custom rules (Hide, Resolve, Set as behavior).
- **Device groups** — scope indicators and automation to groups of devices.
- **Microsoft Defender for Cloud Apps** — can sync sanctioned/unsanctioned app decisions to endpoint indicators.

## explainBack

Q: What's the difference between an indicator and an alert tuning rule?
A: An indicator changes what happens to the thing itself — blocked, allowed, warned or audited on devices. An alert tuning rule only changes what happens to the alert — hidden, resolved or kept as a behavior — while the activity itself still happens.

Q: Why should a block indicator have an expiry date?
A: Attackers abandon domains, IPs and files quickly, and the same IP may later belong to someone legitimate. Expiry keeps the list relevant, avoids blocking innocent services, and stays within the tenant's indicator limit.

Q: Why is a broad "hide all PowerShell alerts" rule dangerous?
A: PowerShell is one of the most common tools attackers use. Hiding every PowerShell alert means a real attack produces no incident — the SOC is blind exactly where it most needs to see.
