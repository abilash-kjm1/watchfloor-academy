## bridge

You have written KQL, configured Sentinel analytics rules, and mapped behavior to MITRE ATT&CK. **Detection engineering** is the discipline that ties these together: deciding **what** to detect, building the rule, **proving it works**, keeping the noise down, and maintaining it as the environment changes.

A SOC is only as good as its detections. Analysts who understand how detections are built triage faster, write better feedback, and often grow into detection engineers.

**Chain:** Threat or gap (MITRE, intel, incident) → data source check → KQL logic → test against history → tune (thresholds, exclusions) → deploy as a rule (entities, MITRE, severity) → monitor quality → improve or retire

## what

### 1. Detection engineering
**Detection engineering** is the practice of designing, building, testing, deploying and maintaining **detection logic** — the rules that turn raw events into alerts.

### 2. A detection is more than a query
A production detection includes:
- **Logic** — the KQL query.
- **Schedule** — how often it runs and how far back it looks.
- **Threshold** — how many results trigger an alert.
- **Entity mapping** — which columns are the user, host, IP, file (so incidents correlate).
- **Metadata** — name, description, severity, MITRE ATT&CK technique, owner.
- **Response guidance** — what the analyst should check first (a short playbook in the description).
- **Tests and history** — evidence it fires on the bad thing and stays quiet on normal activity.

### 3. Two measures of quality
| Measure | Question | Failure looks like |
|---|---|---|
| **Precision** | When it fires, is it right? | Lots of false positives — analysts start ignoring it |
| **Coverage (recall)** | When the bad thing happens, does it fire? | Silent misses — the worst kind of failure, because nobody notices |

Every tuning decision trades one against the other.

### 4. Kinds of detection logic
- **Atomic / indicator match** — a known-bad hash, domain or IP. Precise, short-lived.
- **Behavioral** — a pattern of actions (Office starting PowerShell; one IP failing against many accounts). Lasts longer.
- **Threshold / statistical** — more than N events, or far above the account's usual baseline.
- **Correlation** — several weak signals together (risky sign-in **and** new inbox rule **and** mass download).

## why

Detection engineering exists because **vendor detections are not enough**:

- Every organization has unique apps, data and risks that generic rules don't know about.
- Attackers change tools; detections must keep up.
- Untested or untuned rules either **flood** the SOC with false positives or **silently miss** attacks.
- Environments change — new software, new log formats — and detections quietly break.

Treating detections as **engineered products**, with tests and owners, keeps them trustworthy.

## name

- **Detection** — noticing that something happened.
- **Engineering** — designing, building and testing something so it works reliably — the same discipline as building software or bridges.
- **Detection as code** — managing rules like software: stored in version control, reviewed, tested and deployed automatically.

## problem

Detection engineering answers:

1. **What should we detect next?** — gaps against MITRE ATT&CK and the threats that target us.
2. **Do we have the data?** — no logs, no detection.
3. **Will it work?** — testing against history and in a lab.
4. **Will analysts trust it?** — false-positive rate and clear guidance.
5. **Is it still working?** — monitoring rule health and alert volumes over time.

## analogy

Designing smoke detectors for a building:

- **What to detect** — which rooms have fire risk (the kitchen, the server room).
- **Data source** — is there power and a ceiling mount in that room?
- **Logic and threshold** — smoke density that triggers the alarm.
- **Testing** — press the test button; burn toast to see if it's too sensitive.
- **Tuning** — move the kitchen detector away from the toaster rather than removing its battery.
- **Maintenance** — monthly tests; replace batteries; remove detectors from rooms that no longer exist.

## how

### Step 1: Start from a requirement
Good sources of detection ideas:
- **Coverage gaps** on the MITRE ATT&CK matrix (which techniques do we have no rule for?).
- **Threat intelligence** about TTPs used against your sector.
- **Past incidents** — "what would have caught this earlier?"
- **Hunting results** — a successful hunt is a detection waiting to be written.

Write it as a sentence: *"Alert when a single IP fails sign-in for 15 or more different accounts within 30 minutes."*

### Step 2: Check the data
- Which table holds this evidence? Is it collected for **all** relevant systems?
- Which **columns** do you need, and are they reliably populated?

### Step 3: Write and backtest the query
1. Write the KQL.
2. Run it over the **last 14–30 days**. How many results? Are they true positives, false positives, or benign?
3. Adjust filters and thresholds until the result set is small and meaningful.

### Step 4: Test that it fires
Generate safe, **authorized** test activity in a lab (for example, a series of deliberately failed sign-ins to a test account, or the harmless **EICAR** antivirus test file) and confirm the rule triggers with correct entities.

### Step 5: Tune with care
| Good tuning | Dangerous tuning |
|---|---|
| Exclude **one specific** service account documented in a watchlist | Exclude every account containing "svc" |
| Raise a threshold based on measured normal volume | Raise it until the rule never fires |
| Add context (only accounts without MFA) to raise severity | Delete the rule because it's noisy |

### Step 6: Deploy as a rule
**Microsoft Sentinel scheduled rule:**
- Query frequency (from every **5 minutes** to every **14 days**) and lookback period (up to **14 days**).
- Alert threshold, **entity mapping**, MITRE tactics and techniques, severity.
- Event grouping, alert grouping into incidents, and automation.

**Near-real-time (NRT) rule:** runs about **every minute** for the most urgent, simple detections.

**Defender XDR custom detection:** built from an Advanced Hunting query; runs continuously (NRT) or every 1, 3, 12 or 24 hours; the results must include `Timestamp`, `ReportId` and an entity column such as `DeviceId` or `AccountObjectId` (depending on the table); it can take automatic response actions.

### Step 7: Monitor and maintain
- Alert volume per rule; false-positive rate from incident **classifications**.
- Rule **health** — failures, timeouts, data gaps.
- Regular review: still relevant? still the right threshold? still has an owner?

## realWorld

A SOC's monthly detection review shows:

- 3 rules produce 60% of all alerts, with 90% closed as false positive → tuning backlog.
- 2 rules haven't fired in a year → tested; one was broken by a log format change and fixed.
- 4 new rules came from last quarter's hunts and incidents.
- MITRE coverage for Credential Access improved from 5 to 9 techniques.

## securityExample

After a password-spray incident, the post-incident review asks: *why did we only notice when the user reported strange emails?*

The detection engineer:
1. **Requirement:** alert when one IP fails against many accounts in a short time.
2. **Data:** `SigninLogs`, collected for all users.
3. **Backtest:** over 30 days, a threshold of 15 accounts in 30 minutes returns 6 hits — 5 real sprays and 1 office NAT (network address translation) IP after a password policy change.
4. **Tune:** add the office egress IPs to a watchlist and exclude them only for this rule.
5. **Deploy:** scheduled every 10 minutes, lookback 30 minutes, entities = IP and accounts, MITRE T1110.003, severity Medium — raised to High automatically if any targeted account then **succeeds**.
6. **Monitor:** reviewed monthly.

## normal

- Rules have **owners**, descriptions, MITRE mappings and response notes.
- Each rule produces a **manageable** number of alerts with a reasonable true-positive rate.
- Exclusions are **narrow, documented** and reviewed.
- New detections are tested before deployment; changes are tracked.

## suspicious

These are signs of **unhealthy** detection coverage:

- A rule that fires hundreds of times a day and is always closed without investigation.
- Rules with **broad exclusions** nobody can explain ("exclude all servers").
- Important log sources with **no detections** at all.
- Rules that have **never fired** and were never tested.
- A sudden **drop to zero** alerts from a normally busy rule — the data may have stopped.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | The spray rule fires twice a week; each alert is investigated |
| **Suspicious** | Someone added an exclusion for an entire IP range without a ticket |
| **Confirmed malicious** | That range was later used for a spray that the rule silently ignored |

## abuse

Defensive view — how attackers benefit from weak detection engineering:

| Weakness | How attackers benefit | Defense |
|---|---|---|
| Hash- or IP-only detections | Change the file or server and avoid detection | Behavioral detections |
| Over-broad exclusions | Hide inside the excluded scope (e.g. a "trusted" admin tool) | Narrow, reviewed exclusions |
| Fixed thresholds | Stay just under the limit ("low and slow") | Longer windows; baselines; correlation |
| No data health monitoring | Disable logging and go unseen | Alert on sources that stop sending |
| Alert fatigue | Real alerts get closed with the noise | Tune precision; triage guidance |

## evidence

Detection engineering produces its own evidence:
- **Rule definitions and change history** (who changed what, when).
- **Alerts and incidents** per rule, with **classification** (true positive, false positive, benign positive).
- **Rule health** — execution successes and failures.
- **Coverage maps** — techniques with and without detections.

## where

| Evidence | Where |
|---|---|
| Alerts per rule | `SecurityAlert` (Sentinel), `AlertInfo` (Defender XDR) |
| Incident outcomes | `SecurityIncident` (`Classification`, `Status`) |
| Rule changes | `SentinelAudit` |
| MITRE coverage | Sentinel **MITRE ATT&CK** page; ATT&CK Navigator |
| Custom detections | Defender XDR → Detection rules |

## analyst

Analysts improve detections every day by:

1. **Classifying incidents accurately** — true positive, false positive or benign positive, with a reason. This is the data detection engineers tune from.
2. **Writing tuning requests** with specifics: "This rule fires daily for the backup service account `svc-veeam` on `BK-01` — confirmed with the backup team; suggest excluding that account on that host only."
3. **Reporting misses** — "this incident was found by a user report; here is the query that would have caught it."
4. **Turning good hunts into rule proposals.**

## microsoft

- **Microsoft Sentinel analytics rules** — scheduled, near-real-time (NRT), threat intelligence and anomaly rules (in the Defender portal, alerts are also correlated into incidents by Defender XDR); rule templates from the **Content hub**; **watchlists** for exclusions; the **MITRE ATT&CK** coverage page; **repositories** for detection as code.
- **Microsoft Defender XDR custom detection rules** — Advanced Hunting queries run on a schedule with automatic response actions.
- **SOC optimization** recommendations in Sentinel suggest coverage improvements based on your data.

## explainBack

Q: Why isn't "it found the bad thing once" enough to call a detection good?
A: It also has to stay quiet on normal activity, keep working as the environment changes, and give analysts enough context to act. A rule that fires correctly once but also fires 500 times a day on normal activity will be ignored.

Q: What is the danger of a broad exclusion?
A: Attackers can hide inside it. If you exclude every server or every admin tool to cut noise, any attack that happens on a server or uses that tool becomes invisible.

Q: How do analysts help detection engineering without writing rules?
A: By classifying every incident accurately with a reason, sending specific tuning requests, and reporting attacks that were found some other way — that feedback is what tells engineers where rules are noisy or missing.
