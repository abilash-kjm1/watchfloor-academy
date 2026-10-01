## bridge

Your detections now produce incidents. But every incident needs the same first steps — enrich the IP, look up the user, assign an owner, notify the team. Doing that by hand for hundreds of incidents a day burns out analysts. **Security orchestration, automation and response (SOAR)** automates the repetitive parts so people can focus on judgment.

This lesson explains what to automate, what **not** to automate, and how Microsoft Sentinel does it with **automation rules** and **playbooks**.

**Chain:** Incident or alert created → automation rule (triage: assign, tag, set severity) → playbook (enrich, notify, ticket) → human decision for risky actions → response action → documented in the incident

## what

### 1. SOAR
**[[soar|SOAR]]** combines three ideas:
- **Orchestration** — connecting different tools (SIEM, ticketing, chat, firewall, identity) so they work together.
- **Automation** — running steps without a person (look up an IP, add a comment).
- **Response** — taking action on threats (disable an account, isolate a device) — automatically or after approval.

### 2. Automation rules (Microsoft Sentinel)
**[[automation-rule|Automation rules]]** are lightweight, centrally managed rules that run when an **incident is created or updated**, or an **alert is created**. They can:
- change **status, severity or owner**;
- add **tags** and **tasks** (a checklist for the analyst);
- **run a playbook**;
- run in a defined **order**, and **expire** on a date (useful for temporary suppressions).

### 3. Playbooks
**[[playbook|Playbooks]]** are workflows built on **Azure Logic Apps**. They start from a Sentinel trigger (incident, alert or entity) and chain **connectors** and actions:
- get the incident's entities;
- look up an IP's reputation or a user's details;
- post to Microsoft Teams or send an email;
- create a ticket in an IT service management tool;
- take a response action (disable a user, isolate a device) — ideally after approval.

### 4. Built-in automation in Defender XDR
**Automated investigation and response (AIR)** in Defender XDR investigates alerts automatically and recommends or takes remediation (quarantine a file, remove an email) depending on the configured **automation level**. **Automatic attack disruption** contains compromised users and devices during high-confidence attacks.

## why

Automation exists because SOCs face **more alerts than people**:

- Repetitive steps (copy the IP, check reputation, look up the user's manager) waste analyst time.
- **Speed matters** — containing an account in 2 minutes instead of 40 can stop an attack.
- **Consistency** — every incident gets the same enrichment and documentation.
- **Measurability** — automation shortens **mean time to respond (MTTR)**.

But automation can also cause damage at machine speed — so SOAR design always includes **guardrails** and **human approval** for risky actions.

## name

- **Orchestration** — like an orchestra conductor coordinating many instruments.
- **Playbook** — from sports: a book of planned plays the team runs in known situations.
- **Logic Apps** — Azure's service for building *apps* out of *logic* steps without writing much code.

## problem

SOAR helps answer:

1. **How do we triage hundreds of incidents consistently?** — automation rules assign, tag and set severity.
2. **How do analysts get context faster?** — playbooks enrich entities before anyone opens the incident.
3. **How do we respond in minutes, not hours?** — pre-approved or one-click actions.
4. **How do we keep other teams informed?** — tickets and chat messages created automatically.
5. **How do we avoid automating ourselves into an outage?** — approvals, scoping and testing.

## analogy

A hospital emergency department:

- **Automation rules** — the triage nurse: everyone gets a wristband, a priority color and a queue, the same way every time.
- **Playbook enrichment** — the nurse automatically pulls your medical history and allergies before the doctor sees you.
- **Notifications** — paging the right specialist.
- **Human approval** — no automated surgery: the doctor decides on risky treatment.
- **Attack disruption** — the automatic sprinkler: in a clear, fast-spreading emergency, it acts first.

## how

### Step 1: Map the repetitive steps
Watch analysts work for a week. Note steps repeated in **every** incident of a type (e.g. phishing: look up sender, find other recipients, check clicks).

### Step 2: Choose the right tool
| Need | Use |
|---|---|
| Assign owner, set severity, add tags or tasks | **Automation rule** (no extra cost, simple) |
| Suppress a known benign pattern for 2 weeks | Automation rule with **expiration**, closing matching incidents |
| Enrich, notify, create tickets, call other systems | **Playbook** (Logic App), triggered by an automation rule |
| Remediate endpoint or email threats | **Defender XDR AIR** (with automation levels) |

### Step 3: Design a playbook
Example — enrich IP addresses on new incidents:
1. **Trigger:** Microsoft Sentinel incident.
2. **Get entities:** IP addresses.
3. **For each IP:** look up reputation and geolocation (a threat intelligence or IP-information connector).
4. **Add comment** to the incident with the results.
5. **If high-risk:** post to the SOC Teams channel.

### Step 4: Permissions and identity
- Playbooks act with a **managed identity** (or a connection account) — grant it **only** the permissions it needs.
- Sentinel needs the **Microsoft Sentinel Automation Contributor** role on the playbook's resource group so automation rules can run playbooks.
- Creating playbooks needs Logic App permissions; running them manually needs the **Microsoft Sentinel Playbook Operator** role.

### Step 5: Add guardrails for response actions
- **Human-in-the-loop:** the playbook sends a Teams card — *"Disable user maria@contoso.com? Approve / Reject"* — and acts only on approval.
- **Scope:** never auto-disable break-glass or executive accounts; never auto-isolate domain controllers.
- **Confidence:** automate response only for high-confidence detections.
- **Logging:** every action writes a comment to the incident.

### Step 6: Test and monitor
Test in a lab workspace with test incidents; monitor **run history** for failures (expired connections, changed permissions).

## realWorld

A mid-size SOC automates:

- **All incidents:** an automation rule assigns them to the on-call queue, tags them by data source, and adds a triage task list.
- **Phishing incidents:** a playbook finds every recipient of the same message and adds them to the incident.
- **Sign-in incidents:** a playbook adds the user's department, manager and recent sign-in countries.
- **High-severity incidents:** a Teams alert to the on-call channel.
- **Account disable:** offered as a one-click approval card — never fully automatic.

Average time from incident to first analyst action drops from 35 to 8 minutes.

## securityExample

A playbook was built to **automatically disable** any account flagged by a "suspicious sign-in" rule. One Monday, a VPN provider change makes every remote user's sign-ins look unusual. The playbook disables 300 accounts before anyone notices — an outage caused by automation.

Lessons applied afterwards:
1. Disabling is moved behind **human approval**.
2. A **rate limit**: the playbook stops and pages a human if more than 5 accounts are affected in an hour.
3. **Exclusions** for break-glass and service accounts.
4. **Testing** after any change to the detection feeding the playbook.

## normal

- Automation rules running on most new incidents (assign, tag, tasks).
- Playbooks enriching entities and posting comments within seconds.
- Response actions **approved by analysts** for anything disruptive.
- Playbook run history with occasional, quickly fixed failures.

## suspicious

Signs of **unhealthy or risky** automation:

- Playbooks with **far more permissions** than they need (e.g. Global Administrator).
- Automation rules that **close incidents** broadly and never expire.
- **Failed playbook runs** nobody notices — enrichment silently stops.
- Response actions with **no approval** on high-impact assets.
- Changes to automation made **without review** — automation is code and should be reviewed like it.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | An automation rule closes a known benign scanner alert, expiring in 14 days |
| **Suspicious** | An automation rule closes **all** low-severity incidents, with no expiry and no owner |
| **Confirmed malicious** | An attacker with Sentinel access created that rule to hide their own low-severity alerts |

## abuse

Defensive view — automation is a powerful target:

| Risk | Example | Defense |
|---|---|---|
| Over-privileged playbook identity | A stolen playbook connection can change accounts | Least privilege; managed identities; review roles |
| Malicious automation rule | Silently closing or suppressing incidents | Audit rule changes (`SentinelAudit`); review regularly |
| Automation outage | Mass disabling of legitimate accounts | Approvals; rate limits; exclusions |
| Broken playbooks | Enrichment stops; analysts make decisions without context | Monitor run history; alert on failures |

## evidence

- **Incident comments and activity log** — every automated action should leave a trace.
- **Automation rule and playbook run history** — success, failure, duration.
- **Audit records** — who created or changed automation.
- **Response action records** — Defender Action center, Entra audit logs (account disabled, sessions revoked).

## where

| Evidence | Where |
|---|---|
| Incidents and their timing | `SecurityIncident` (`CreatedTime`, `ClosedTime`, `Status`, `Classification`) |
| Changes to analytics and automation rules | `SentinelAudit` |
| Automation and playbook health | `SentinelHealth` (when health monitoring is enabled); Logic App run history |
| Response actions on accounts | `AuditLogs` (Entra ID) |
| Defender automated actions | Defender XDR **Action center** |

## analyst

As an analyst you will:

1. **Read automation results first** — enrichment comments, tags and tasks are your head start.
2. **Approve or reject** response actions — check the evidence before clicking.
3. **Report broken automation** — missing enrichment is a bug.
4. **Suggest new automation** — "I copy the user's manager into every sign-in incident by hand; can a playbook do it?"
5. **Never trust automation blindly** — automated closure of an incident is still a decision someone owns.

## microsoft

- **Microsoft Sentinel automation rules** — triage actions, playbook triggers, ordering and expiration.
- **Microsoft Sentinel playbooks** — Azure Logic Apps with Sentinel triggers and hundreds of connectors (Microsoft Entra ID, Defender XDR, Teams, Outlook, ServiceNow and more); playbook templates in the Content hub.
- **Defender XDR automated investigation and response (AIR)** — automation levels per device group; the **Action center** for pending and completed actions.
- **Automatic attack disruption** — contains users and devices during high-confidence attacks.

## explainBack

Q: When would you use an automation rule instead of a playbook?
A: For simple incident housekeeping inside Sentinel — assigning, tagging, changing severity, adding tasks, or temporarily closing a known benign pattern. When you need to talk to other systems (look up an IP, post to Teams, create a ticket, disable a user), you use a playbook — often started by an automation rule.

Q: Why should disabling a user usually need human approval?
A: A wrong automatic disable can lock out real people or many people at once — an outage caused by your own security tooling. A quick human check keeps the speed benefit while preventing mistakes at machine scale.

Q: Why is a playbook's identity a security concern?
A: The playbook acts with that identity's permissions. If it has broad rights and someone abuses the playbook or its connection, they inherit that power — so give it only the permissions it needs.
