## bridge

You now understand the building blocks — **processes, accounts, networks and Windows logs**. This lesson introduces the **team** that watches all of them: the Security Operations Center.

**Chain:** Evidence on computers → collected centrally → watched by the SOC → turned into alerts → investigated → response

## what

A **Security Operations Center (SOC)** is the team responsible for watching an organization's systems for attacks and responding when something goes wrong.

A SOC is made of three things:

- **People** — analysts, engineers, hunters and responders.
- **Processes** — agreed steps for handling alerts, called *playbooks*.
- **Tools** — security platforms such as:
  - **SIEM** (Security Information and Event Management) — collects records from many systems so analysts can search them in one place.
  - **XDR** (Extended Detection and Response) — security software that watches computers, email and accounts together and raises alerts.
  - **SOAR** (Security Orchestration, Automation and Response) — automates repetitive response steps.

You'll learn each of these properly later; for now, just know they are the SOC's main tools.

> Today "SOC" usually means a *function*, not a room. Many SOC teams work remotely, across time zones, using shared cloud tools.

## why

Every organization will eventually be targeted by attackers.

Organizations use **preventive controls** to stop attacks:

- Firewalls
- Multi-factor authentication (MFA)
- Software updates (patching)

These reduce risk, but **no prevention is perfect**. Some attacks will get through.

When that happens, someone must:

1. **Notice** that something is wrong.
2. **Decide** how serious it is.
3. **Act** to stop it.

That is the SOC's job.

> The SOC exists to shorten the time between *an attacker doing something* and *a defender noticing and acting*.

## name

The name comes from military and telecom **operations centers** — rooms where operators watched systems in real time and reacted.

Compare two similar teams:

| Team | Watches for | Question it asks |
|---|---|---|
| **NOC** (Network Operations Center) | Outages, slowness | "Is it working?" |
| **SOC** (Security Operations Center) | Attacks, misuse | "Is someone doing something they shouldn't?" |

## problem

Without a SOC, organizations commonly experience:

- Alerts that fire, but **nobody owns** them.
- Logs that exist, but **nobody reads** them.
- Attacks discovered weeks later — **by customers, or by a ransom note**.

A SOC adds three things:

### Ownership
Someone is accountable for every alert.

### Consistency
Playbooks make the night shift respond the same way as the day shift.

### Speed
SOCs measure themselves with two key numbers:

- **[[soc-metrics|Mean time to detect (MTTD)]]** — how long until we notice.
- **Mean time to respond (MTTR)** — how long until we act.

## how

### The SOC loop

SOC work follows a repeating cycle:

1. **Collect** — gather security data from computers, user accounts, email, cloud services and the network.
2. **Detect** — rules look for suspicious patterns and create [[alert|alerts]].
3. **Triage** — an analyst quickly decides whether each alert is real and urgent.
4. **Investigate** — a deeper look: what happened, who was affected, how far it spread.
5. **Respond** — stop the attack and fix the damage, working with IT and the business.
6. **Improve** — tune noisy rules, write new ones, and hunt for anything the rules missed.

Then the loop starts again.

### SOC roles

Each role owns a different part of the loop.

**Tier 1 analyst**
- Watches the alert queue.
- Performs first-level triage using playbooks.
- Escalates anything that needs deeper work.

**Tier 2 analyst**
- Investigates escalated alerts in depth.
- Works out the scope of an incident.
- Recommends or performs containment.

**Tier 3 / senior analyst**
- Handles the most complex incidents.
- Hunts for hidden threats.
- Mentors other analysts.

**Detection engineer**
- Writes, tests and tunes detection rules.

**Threat hunter**
- Searches proactively for attacks that no rule has caught.

**Incident responder**
- Leads the response once an incident is confirmed.

**Threat intelligence analyst**
- Tracks attacker groups and turns that knowledge into detections.

**Security engineer**
- Builds and maintains the security tools and data pipelines.

**SOC manager**
- Manages staffing, priorities and metrics, and reports to leadership.

## analogy

A SOC works like a hospital emergency department:

| Hospital | SOC |
|---|---|
| Patients arriving | Alerts arriving |
| Triage nurse | Tier 1 analyst |
| Doctors | Tier 2 / Tier 3 analysts |
| Specialists | Threat hunters, incident responders |
| Hospital engineers | Security engineers |
| Patient chart | The incident ticket |

Just like a hospital, the SOC writes everything down so the **next shift can continue the work**.

## realWorld

A retail company runs a SOC like this:

- **12 people** working in three shifts.
- An **outsourced partner** (an MSSP — Managed Security Service Provider) covers overnight.

Their targets:

- Every alert triaged within **15 minutes**.
- High-severity incidents escalated within **30 minutes**.
- Every confirmed incident reviewed with the question: *"Could we have detected this earlier?"*

## securityExample

**02:10 at night.** A rule fires:

> Many different user accounts each failed to sign in once — all from the same external IP address.

No employee is awake to notice. Here is what the SOC does:

1. **Tier 1** recognizes the pattern (this is called *password spraying*).
2. Tier 1 checks whether **any of those accounts later signed in successfully**.
3. One did. Tier 1 **escalates** to Tier 2.
4. **Tier 2** resets that user's password and blocks the IP address.

Without the SOC, this would have been found days later — or never.

## normal

A healthy SOC queue is mostly **explainable**:

- Administrators doing admin work.
- Software updates.
- Approved security scanners.
- Employees who travel.

> Normal is **not** "no alerts". Normal is alerts that are understood quickly and closed with a clear written reason.

## suspicious

Warning signs that a SOC is struggling:

- Alerts **sitting in the queue** for hours.
- Alerts closed as "false positive" **with no notes**.
- One noisy rule firing **hundreds of times a day** (analysts start ignoring it — this is called *alert fatigue*).
- Incidents discovered **by outsiders** before the SOC.

## abuse

This is the defensive view: how attackers take advantage of SOC weaknesses.

- **Timing** — acting at night or on holidays, when fewer analysts are working.
- **Hiding in noise** — doing things that look like the alerts analysts have learned to ignore.
- **Blind spots** — working in systems the SOC doesn't collect data from.

> This is why data coverage and rule tuning matter as much as the number of analysts.

## evidence

The SOC's own work creates records too:

- When each alert was created and picked up.
- Triage notes.
- Escalation records.
- Incident timelines.
- The final classification (real attack or not).

These records are used to **measure the SOC** and to **learn from incidents**.

## where

In Microsoft environments, the SOC works mainly in the **Microsoft Defender portal**.

The portal brings together:

- **Defender XDR** incidents (endpoint, email, identity, cloud apps).
- **Microsoft Sentinel** incidents (SIEM).

Comments, assignments, status and classification are all recorded **on the incident itself**.

## analyst

As a SOC analyst, your daily work looks like this:

1. **Work the queue** — sorted by severity and age.
2. **Follow playbooks** — for common alert types.
3. **Document every decision** — in the incident.
4. **Escalate clearly** — with a summary of what you checked.
5. **Give feedback** — tell detection engineers when a rule is noisy.

## microsoft

Microsoft's security tools map directly to the SOC loop:

- **[[sentinel|Microsoft Sentinel]]** — the SIEM (collect, detect) and SOAR (automate response).
- **[[defender-xdr|Microsoft Defender XDR]]** — detection across computers, email, identities and cloud apps.
- Both are used from the **unified Defender portal**.

The official SC-200 exam describes this exact job:

> A security operations analyst "reduces organizational risk by performing triage, responding to incidents, hunting for threats, and engineering detections."

## explainBack

Q: Explain what a SOC is to a friend who doesn't work in IT.
A: It's the team in a company whose job is to notice when someone is attacking the company's computers or accounts, figure out what happened, and stop it — a bit like security guards watching camera screens, but for computers.

Q: Why isn't prevention (passwords, antivirus) enough on its own?
A: Prevention eventually fails — people get tricked, passwords get stolen, new attacks appear. Without someone watching, those attacks go unnoticed for weeks. The SOC shortens that time.

Q: What is the difference between Tier 1 and Tier 2?
A: Tier 1 does the quick first check of each alert and escalates anything that needs more work. Tier 2 investigates escalated cases in depth, works out how far the problem spread, and decides on containment.
