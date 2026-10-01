## bridge

You can now triage alerts, investigate with logs and KQL, and work incidents in Sentinel and Defender. This lesson puts it all together: the structured process for handling a real incident from the first alert to the lessons learned.

**Chain:** Alert → triage → investigation → scope → containment → eradication → recovery → lessons learned

## what

**Incident response (IR)** is the organized process of handling a security incident.

It has four goals:

1. **Limit the damage.**
2. **Remove the threat.**
3. **Get the business running normally again.**
4. **Learn**, so it doesn't happen again.

## why

Under pressure, people **improvise** — and improvising causes mistakes:

- **Destroying evidence** before it's collected.
- **Alerting the attacker** too early.
- **Restoring systems** that are still compromised.

A defined lifecycle gives the team a **shared order of steps**.

Two well-known frameworks:

- **NIST SP 800-61** — the US standard guide for incident response.
- **SANS PICERL** — Preparation, Identification, Containment, Eradication, Recovery, Lessons learned.

## name

- **Incident** — from emergency management: an event that disrupts normal operations.
- **Response** — the coordinated action taken.

NIST's guide (SP 800-61) has shaped the field since **2004**. **Revision 3 (2025)** aligns incident response with the NIST Cybersecurity Framework 2.0.

## problem

Incident response answers six questions, in order:

1. **What happened?**
2. **How far did it spread?**
3. **How do we stop it?**
4. **How do we make sure it's gone?**
5. **How do we get back to business?**
6. **How do we prevent a repeat?**

## how

### The phases

**1. Triage**
- Goal: is it real, and how urgent?
- Actions: decide the verdict, set severity and priority, assign an owner.

**2. Investigation**
- Goal: what happened?
- Actions: build a timeline, gather evidence, form a root-cause hypothesis.

**3. Scope**
- Goal: how far did it spread?
- Actions: hunt for the same indicators and behaviors across all users and devices.

**4. Containment**
- Goal: stop it spreading.
- Actions: isolate devices, disable accounts, revoke sessions, block indicators.

**5. Eradication**
- Goal: remove the threat completely.
- Actions: remove malware and persistence, reset credentials, fix the way they got in.

**6. Recovery**
- Goal: return to normal safely.
- Actions: rebuild or restore systems, watch them closely, return them to service.

**7. Lessons learned**
- Goal: improve.
- Actions: find the root cause, detection gaps and process fixes; write new rules.

### Four key principles

**Scope before you eradicate**
- If you remove one foothold while three others remain, the attacker simply adapts.

**Contain proportionately**
- Weigh the business impact (e.g. isolating a production server) against the risk.

**Preserve evidence**
- Collect an **investigation package** — a bundle of logs, running processes and settings gathered from the device by Defender — **before** reimaging (wiping and reinstalling) a machine.
- Keep a **chain of custody** — a record of who collected each piece of evidence, when, and how it was stored — so it can be trusted later, including in legal cases.

**Communicate**
- Stakeholders, legal teams, and sometimes regulators. IR is not only technical.

## analogy

Incident response is like **firefighting**:

1. **Triage** — confirm there's a fire.
2. **Investigation** — find where it started.
3. **Scope** — see which rooms it reached.
4. **Containment** — close doors to stop it spreading.
5. **Eradication** — put it out completely, including the embers.
6. **Recovery** — repair and reopen the building.
7. **Lessons learned** — inspect why it started.

## realWorld

A compromised mailbox, phase by phase:

1. **Triage** — the alert is confirmed as real.
2. **Investigate** — review sign-ins and inbox rules.
3. **Scope** — find other mailboxes that received internal emails from this one.
4. **Contain** — revoke sessions, reset the password, require MFA re-registration.
5. **Eradicate** — remove malicious inbox rules and app permissions.
6. **Recover** — the user regains access, with extra monitoring.
7. **Lessons learned** — require phishing-resistant MFA for the finance team.

## securityExample

Defender XDR shows **suspicious behavior on a device** and **a risky sign-in** for the same user.

The responder works in this order:

1. **Isolate the device** — it stays connected to Defender, so investigation can continue.
2. **Collect an investigation package** from the device.
3. **Revoke the user's sessions** and **reset the password**.
4. **Hunt** for the same indicators across **all** devices.
5. **Only then** start cleaning up.

## normal

A mature IR process has:

- **Playbooks** for common incident types.
- **Clear decision rights** — e.g. who is allowed to isolate a production server?
- **Contact lists.**
- **Evidence-handling procedures.**
- **Post-incident reviews** that produce real actions.

## suspicious

### Normal → suspicious → malicious, during response

| | Example |
|---|---|
| **Normal** | Containment actions approved, coordinated, and logged with times |
| **Suspicious** | Activity continues on an account after its password was reset |
| **Confirmed problem** | The attacker still had an active session or another foothold because sessions weren't revoked and scoping was skipped |


Warning signs that IR is going wrong:

- **Reimaging** before scoping.
- **Resetting passwords** while the attacker still has active sessions or other footholds.
- **No record** of actions taken.
- **Closing** incidents without a root cause.

## abuse

Defensive view: attackers may **watch for response actions** — for example, by reading a compromised mailbox for messages about the investigation.

For sensitive incidents:

- Use **out-of-band communication** (e.g. phone, a separate channel).
- **Coordinate** containment actions so they happen **together**.

## evidence

IR creates its own evidence trail:

- The **incident timeline**.
- **Action history** (Defender's Action center).
- **Investigation packages.**
- **Chain-of-custody** records.
- The **final report**.

## where

- **Defender portal** — incidents and the Action center.
- **Sentinel** — incidents with comments and tasks.
- **Ticketing systems** — connected through playbooks.

## analyst

As a Tier 1 or Tier 2 analyst, you will:

1. **Perform triage.**
2. **Build the first timeline.**
3. **Recommend containment.**
4. **Carry out approved actions.**
5. **Document everything**, with **UTC** timestamps.

## microsoft

**Defender for Endpoint — device actions**
- Isolate device
- Restrict app execution
- Run antivirus scan
- Collect investigation package
- Live Response
- Stop and quarantine file

**Entra ID — identity actions**
- Revoke sessions
- Disable user
- Require password reset

**Defender for Office 365 — email actions**
- Soft-delete or move emails across many mailboxes

**Sentinel**
- Incident tasks
- Automation rules and playbooks for repeatable steps

## explainBack

Q: Explain "scope before you eradicate" with an everyday example.
A: If you find one wasp nest and destroy it while three others are hidden in the roof, the wasps simply move. Find all the nests first, then remove them together. In an incident, cleaning one computer while the attacker controls others just tips them off.

Q: Why should a password reset and session revocation happen together?
A: A reset stops the old password working, but an attacker who is already signed in may keep a valid session. Revoking sessions forces everyone, including the attacker, to sign in again.

Q: Why collect an investigation package before reimaging a laptop?
A: Reimaging wipes the evidence. The package preserves logs, processes and settings so you can work out what happened and how far it spread.
