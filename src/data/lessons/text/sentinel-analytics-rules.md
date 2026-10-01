## bridge

In **Sentinel architecture** you saw that rules turn data into alerts. This lesson goes inside a rule: how it's scheduled, what settings decide when it fires, and how automation handles the incidents it creates.

**Chain:** KQL query → *analytics rule* (schedule, threshold, entities, MITRE) → alert → incident → automation rule → playbook

## what

This lesson covers three parts of Sentinel that work together.

### 1. Analytics rule
An **[[analytics-rule|analytics rule]]** is detection logic that Sentinel runs against your data.
- It is written as a **KQL query**.
- When the query finds results, Sentinel creates **alerts** — and, depending on settings, **incidents**.

### 2. Automation rule
An **[[automation-rule|automation rule]]** applies simple triage actions to incidents automatically.
- Examples: assign an owner, add a tag, change severity, close, or run a playbook.

### 3. Playbook
A **[[playbook|playbook]]** is a **Logic Apps** workflow for multi-step actions, often involving other systems.
- Examples: post to Teams, create a ticket, disable a user, look up an IP's reputation.

## why

- **Analytics rules** exist because analysts can't run every query by hand, every hour, forever. Rules turn detection knowledge into **continuous** monitoring.
- **Automation** exists because many incident-handling steps are **repetitive** — enrich, assign, notify — and shouldn't use up analyst time.

## name

- **Analytics** — the rule *analyzes* data.
- **Scheduled** rules run on a schedule.
- **NRT** (near-real-time) rules run about **every minute**.
- **Playbook** — borrowed from sports and incident response: a predefined set of steps.

## problem

- Rules turn **one-off investigations** into **permanent coverage**.
- Automation makes response **faster** and **consistent across shifts**.

## how

### Rule types

| Type | What it does |
|---|---|
| **Scheduled** | Runs a KQL query on a schedule (minutes to days), over a lookback window, with a threshold. |
| **NRT** (near-real-time) | Runs about every minute on newly arrived data. Fewer options. For urgent, simple logic. |
| **Threat intelligence** | Matches your threat indicators against your logs. |
| **Anomaly / ML** | Built-in behavioral analytics that can be tuned. |
| **Microsoft security** | Creates incidents from alerts raised by other Microsoft products. (Once Sentinel is connected to the Defender portal, Defender XDR creates incidents itself, so these rules are no longer used there.) |

### Key settings of a scheduled rule

1. **Query** — the KQL logic.
2. **Run frequency** — how often it runs (e.g. every 15 minutes).
3. **Lookback** — how far back each run looks (e.g. the last 1 hour).
  - The lookback should be **at least as long** as the frequency, or events will be missed.
4. **Threshold** — e.g. "alert if results > 0".
5. **Entity mapping** — which columns are the Account, Host, IP, File…
  - Entities let Sentinel link alerts together and power the investigation graph.
6. **Custom details / alert details** — dynamic alert titles and severity.
7. **MITRE ATT&CK mapping** — which tactics and techniques the rule detects.
8. **Event grouping** — one alert per rule run, or one alert per result.
9. **Alert grouping** — how alerts are combined into incidents.
10. **Suppression** — pause the rule for a while after it fires.

### Automation

**Automation rules**
- **Trigger** on: incident created, incident updated, or alert created.
- Have **conditions** (e.g. "rule name is X") and **ordered actions**.

**Playbooks**
- Built with **Logic Apps**.
- Use **connectors** to act in other systems: Teams, ticketing tools, Entra ID, Defender…
- Can be **triggered by automation rules**.

## analogy

- A **rule** is a smoke detector programmed with exactly what "smoke" looks like.
- The **threshold** is its sensitivity.
- **Entity mapping** writes the room number on the alarm.
- An **automation rule** is the building procedure: *"Alarm in the server room → page facilities, mark as high priority."*
- A **playbook** is the fire crew's checklist.

## realWorld

A team builds a detection for password spraying:

1. **Scheduled rule**, runs **every 15 minutes**, looking back **1 hour**.
2. Maps the **IP** and **Account** entities.
3. Maps to MITRE **T1110.003**.
4. Groups alerts **by IP** into one incident.

Then:

- An **automation rule** assigns these incidents to the identity team.
- It also runs a **playbook** that looks up the IP's reputation and adds it as a comment.

## securityExample

An **NRT rule** alerts when someone is added to a highly privileged group.

- An **automation rule** raises the severity to **High**.
- A **playbook** notifies the on-call channel.

> Waiting for the next scheduled run could delay the response — that's why NRT is used here.

## normal

A healthy rule has:

- A **documented purpose**.
- A **known false-positive rate**.
- **Entity and MITRE mappings**.
- Has been **tested after every change**.

## suspicious

Rule "smells" to watch for:

- **No entity mapping** — incidents can't be correlated.
- **Lookback shorter than frequency** — gaps in coverage.
- **Very broad exclusions.**
- Automation rules that **auto-close incidents** using broad conditions.

## abuse

Defensive view: overly broad auto-close automation can **hide real incidents**.

> Whoever designs automation must think about how it could suppress true positives. Review automation rules like code.

## evidence

| Record | Table |
|---|---|
| Alerts created by rules | `SecurityAlert` |
| Incidents | `SecurityIncident` |
| Rule and automation health (when enabled) | `SentinelHealth` |

## where

Microsoft Defender portal → **Microsoft Sentinel** → **Configuration**:

- **Analytics** — detection rules.
- **Automation** — automation rules and playbooks.

Incidents appear in the **unified incident queue**.

## analyst

Analysts make rules better. You can:

- Write the **reason** for false positives in incident comments and classifications.
- **Propose narrow exclusions.**
- **Suggest new entity mappings.**
- **Report missing detections** after an incident.

## microsoft

Defender XDR has its own detection option too:

- **Custom detection rules** — built from Advanced Hunting queries, and they can run **response actions** on devices, users or files.

Which to use, in the unified portal:

| Use | When |
|---|---|
| **Sentinel analytics rules** | SIEM data, and correlation across many sources |
| **Defender XDR custom detections** | XDR data, with built-in response actions |

Facts about custom detections worth knowing:

- Frequencies: every 24 hours, 12 hours, 3 hours, every hour, **Continuous (NRT)**, or **Custom** (for Sentinel-only data).
- Microsoft recommends the query return `Timestamp` (or `TimeGenerated`) and, for Defender for Endpoint tables, `DeviceId` and `ReportId`.
- Don't filter on `Timestamp` yourself — the service already limits each run to the right time window.

> Both are SC-200 objectives.

## explainBack

Q: Explain the difference between an analytics rule and an automation rule.
A: An analytics rule looks through the data and decides whether something suspicious happened, creating alerts. An automation rule acts on the incidents afterwards — assigning them, tagging them, changing severity or starting a playbook.

Q: A rule runs every hour but only looks back 30 minutes. What goes wrong?
A: Half of every hour is never checked, so events in those gaps can never trigger the rule. The lookback should be at least as long as the run frequency.

Q: Why map entities in a rule?
A: Entities (the user, computer, IP) let Sentinel link related alerts into one incident and let analysts pivot straight to that user or device.
