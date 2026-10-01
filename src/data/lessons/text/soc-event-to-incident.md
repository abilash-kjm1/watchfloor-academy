## bridge

In **What is a SOC** you met alerts and incidents. Before going further, this lesson pins down the exact vocabulary, from the smallest record to the final response — the words every later lesson relies on.

**Chain:** Event → Log → Telemetry → Detection → Alert → Incident → Investigation → Response

## what

Eight words describe how a security signal is born, grows and is handled. Learn them in order — each one leads to the next.

### 1. Event
An **[[event|event]]** is something that happened on a system.

- Examples: a user signed in, a program started, a file was saved.

### 2. Log
A **[[log|log]]** is the written record of an event.

- Example: a line saying *"14:09 UTC — user alex signed in from IP 192.0.2.10 — success"*.

### 3. Telemetry
**[[telemetry|Telemetry]]** is the steady stream of logs that a sensor sends to a central place for analysis.

- Example: Microsoft Defender on a laptop continuously sending what happens to the cloud.

### 4. Detection
A **[[detection|detection]]** is a rule (or logic) that looks for a suspicious pattern in the data.

- Example: *"Alert if one IP address fails to sign in to 20 different accounts within 10 minutes."*

### 5. Alert
An **[[alert|alert]]** is created when a detection finds a match.

- It has a **title**, a **severity**, the **entities** involved (user, device, IP), and **evidence**.

### 6. Incident
An **[[incident|incident]]** is a group of related alerts that together tell one security story.

- Example: three alerts about the same user and the same laptop are grouped into one incident.

### 7. Investigation
The work an analyst does to understand an incident: building a timeline, finding all affected users and devices, and identifying the cause.

### 8. Response
The actions taken to stop the attack and recover — for example, resetting a password or isolating a laptop from the network.

> **Facts vs judgements:** events and logs are *facts*. Alerts and incidents are *judgements* made by rules — and judgements can be wrong. You check judgements against the facts.

## why

Without shared words, a SOC miscommunicates.

- One person says "we had an incident" and means *one failed login*.
- Another hears "incident" and thinks *full breach*.

These six terms give everyone the same meaning, and they separate **what happened** from **what we think it means**.

## name

- **Telemetry** — from Greek *tele* (far) + *metron* (measure): measuring something from a distance. A sensor measures a laptop and sends the results far away to the cloud.
- **Incident** — from *incident management*: an unplanned event that needs a coordinated response.

## problem

A single attack can produce **thousands of events** across many systems.

If every suspicious event became its own ticket:

- Analysts would drown in tickets.
- Related pieces of the same attack would be handled by different people.
- Nobody would see the full story.

Grouping alerts into incidents solves this: **one investigation per attack story**, instead of one per signal.

## how

Follow one example from start to finish.

1. **Event** — a user signs in.
2. **Log** — the identity system writes a sign-in record.
3. **Telemetry** — that record is sent to the SIEM.
4. **Detection** — a rule checks: *"Is one IP failing to sign in to many accounts?"*
5. **Alert** — the rule matches, and an alert is created with the user and IP attached.
6. **Incident** — the alert is grouped with another alert about the same user.

### Volume shrinks at every step

| Stage | Typical daily volume |
|---|---|
| Events | Millions |
| Logs searched by rules | Millions |
| Alerts | Tens to hundreds |
| Incidents | A handful |

> Each step removes noise and adds meaning. That is the whole purpose of the pipeline.

## analogy

Picture a city street with CCTV:

- **Events** — everything that happens on the street.
- **Logs** — the CCTV recordings.
- **Telemetry** — the live feed sent to the control room.
- **Detection** — a rule: *"Flag anyone who tries every car door."*
- **Alert** — the operator's screen flashing.
- **Incident** — the case file opened when the same person is seen on three streets.

## realWorld

In Microsoft Defender XDR, one incident might be called:

> *"Multi-stage incident involving initial access and lateral movement"*

Inside it you might find **14 alerts** from three different products:

- Defender for Endpoint (computers)
- Defender for Office 365 (email)
- Defender for Identity (user accounts)

They are grouped because they share the **same user and the same device**.

## securityExample

1. A program starts on a laptop → **one event**. On its own, meaningless.
2. That program is a scripting tool, started by a spreadsheet → a detection creates an **alert**.
3. Minutes later, the same laptop connects to a rare website → **another alert**.
4. The same user signs in from an unusual country → **a third alert**.
5. All three share the same user and device → grouped into **one incident**.

## normal

What normal looks like:

- **Huge numbers** of events and logs.
- A **manageable** number of alerts.
- **Few** incidents.

Most events are routine and never become alerts.

## suspicious

Pay attention when alerts share **entities**:

- The same **user**
- The same **device**
- The same **IP address**
- The same **file**

…within a **short time window**. That is what turns separate signals into a story worth investigating.

## abuse

Defensive view:

- Attackers try to stay at the **"event" level** — doing things that look routine, so no rule turns them into alerts.
- Attackers may try to **stop logs being produced or sent**.

> A sudden **absence** of telemetry from a device can be a signal in itself.

## evidence

Each stage leaves its own records:

| Stage | Where the record is kept |
|---|---|
| Raw logs | Tables such as `SigninLogs`, `SecurityEvent`, `DeviceProcessEvents` |
| Alerts | Sentinel `SecurityAlert`; Defender `AlertInfo` and `AlertEvidence` |
| Incidents | `SecurityIncident` |

## where

- **Raw logs** — in tables you query with KQL (in Sentinel or Advanced Hunting).
- **Alerts and incidents** — in the **Incidents** queue of the Microsoft Defender portal.

## analyst

Always move **both ways** along the pipeline:

### Top-down
Start from an incident and go **down** to the alerts and raw logs that justify it.

### Bottom-up
Start from a raw event and ask: **should this have created an alert?**

> Never trust an alert title on its own. Verify it in the underlying logs.

## microsoft

- **Sentinel** — analytics rules (written in KQL) create alerts. Rule settings decide how alerts are grouped into incidents.
- **Defender XDR** — automatically groups alerts from different products into incidents.
- Both appear in the **same incident queue** in the Defender portal.

## explainBack

Q: Explain the difference between a log and an alert without using either word.
A: One is simply a written record that something happened — a sign-in, a program starting. The other is a warning created automatically when a rule spots a suspicious pattern in those records. The first is a fact; the second is a judgement that might be wrong.

Q: Why group alerts into incidents?
A: One attack can trigger many alerts on different systems. Grouping the ones that involve the same user or device means one analyst investigates the whole story, instead of several people each seeing one small piece.

Q: What does "telemetry" mean in plain words?
A: Records measured on a computer and continuously sent somewhere else for analysis — like a fitness watch sending your heart rate to your phone.
