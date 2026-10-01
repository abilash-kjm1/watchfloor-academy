## bridge

In the Windows event log lesson you learned that Windows writes a record for sign-ins (4624), privilege assignment (4672) and new processes (4688). That raises an obvious question: **if attackers know their actions are being recorded, why don't they just delete the records?**

Some try. This lesson is about what happens when they do — and why a SOC can usually still tell the story.

**Chain:** Attacker activity creates Windows events → attacker clears the Security log → Windows records *that* (1102) → the events were already forwarded to the SIEM → the analyst correlates 4624 → 4672 → 4688 → 1102 → timeline → verdict

## what

### Event ID 1102 — "The audit log was cleared"
**Event 1102** is written to the Windows **Security** log every time that log is cleared. It is the first entry in the new, empty log.

It records:
- **Who** cleared it — the account's security identifier (SID), account name and domain;
- **The Logon ID** of that account's session — a number that links back to the session's sign-in event (4624);
- **When** and on **which computer**.

In simple terms: Windows is saying *"Someone just cleared the Security log."* Now we need to find out who did it, and why.

### A related event: 104
When **other** event logs (such as System or Application) are cleared, Windows writes **event 104** to the **System** log instead.

### The precise statement
Event 1102 indicates that the Windows Security audit log was cleared. That can happen during legitimate administration **or** during a malicious attempt to remove evidence. The event therefore requires **contextual investigation** — it is not, by itself, proof of an attack.

## why

**Why does Windows record this at all?** Because a log you can silently erase is not trustworthy. Recording the clearing itself means the act of hiding leaves a trace.

**Why would an attacker clear logs?** Logs contain evidence of their activity — sign-ins, privilege use, programs they ran. If defenders can't see that activity, investigation becomes harder. Removing evidence is a well-known attacker goal (MITRE ATT&CK calls it *Indicator Removal: Clear Windows Event Logs*).

**Why would an administrator clear logs?** Rarely, for troubleshooting or test machines. Microsoft's own guidance says you typically should not see this event — there is no need to manually clear the Security log in most cases.

## name

- **Audit log** — the Security log records *audit* events: who did what, when.
- **Cleared** — every record is deleted and the log starts again from empty.
- **1102** — just the identifier Microsoft gave this event type; the meaning is in the description.

## problem

Event 1102 lets an analyst answer:

1. **Did someone remove local evidence on this machine?**
2. **Who did it, and in which session?** (account and Logon ID)
3. **What did that same session do before?** — the most important question.
4. **Is our evidence still available elsewhere** (in the SIEM)?

## analogy

A shop's paper visitor book:

- Every visitor signs in (that's 4624). Staff with keys sign the key register (4672). Anyone using the back office writes what they did (4688).
- A burglar tears out every page of the visitor book on the way out.
- But the book has a rule: the **first line of every new book** says *"previous pages removed by: ___ at: ___"* — that's 1102.
- And every evening, a copy of each page is faxed to head office (the SIEM). The torn pages are gone from the shop, but **head office already has the copies**.

## how

### Step 1: The events that come before
| Event | Meaning |
|---|---|
| **4624** | An account successfully logged on (records a **Logon ID**) |
| **4672** | Special (admin-level) privileges were assigned to that new logon |
| **4688** | A new process was created (needs process-creation auditing; command line needs an extra setting) |
| **1102** | The Security log was cleared (records the **Logon ID** of whoever did it) |

### Step 2: Correlate by Logon ID and time
The Logon ID in 1102 matches the Logon ID from the 4624 that started that session. So the analyst can ask: *what else did this exact session do?*

### Step 3: Check whether the evidence survived
If the machine forwards its Security events to a SIEM (for example with the Azure Monitor Agent to Microsoft Sentinel), the events written **before** the clearing have usually already been sent. Clearing the local log doesn't delete them from the SIEM.

### Step 4: Watch for missing evidence too
Attackers may also stop the logging service, change audit policy (event 4719), or disable the agent. Then events simply stop arriving. **When evidence that should exist is missing, the gap itself is a lead** — though it could also be a crashed agent or an offline laptop.

## realWorld

A lab team clears the Security log on a test server every Sunday at 02:00 as part of a documented reset script, run by a dedicated service account. Sentinel shows a 1102 event every Sunday at 02:00 from that server and that account — expected, documented, and tuned with a narrow exception.

## securityExample

On a finance workstation, Sentinel shows within three minutes: a 4624 network logon by an account that never uses this machine, a 4672 for the same session, a 4688 for PowerShell with an encoded command, an outbound connection to an unknown IP, and then 1102 — same Logon ID.

The local Security log on the workstation is now empty. But the SIEM already holds the four earlier events. The analyst builds the timeline, sees one session doing everything, and treats it as a likely compromise.

## normal

- Clearing on **test or lab** systems, by a **known admin or service account**, during a **documented** change window.
- Very rare clearing on production systems, with a change ticket.
- 104 events on test systems after scripted resets.

## suspicious

- 1102 on a **production** workstation or server with **no change record**.
- Cleared by an account that **doesn't normally administer** that machine.
- Clearing at **unusual times**.
- Clearing on **several machines** in a short period.
- The machine **stops sending events** shortly before or after.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A documented weekly lab reset clears the log on TEST-01 at 02:00 Sunday, by svc-labreset |
| **Suspicious** | 1102 on a finance workstation at 14:10 by an IT account, no ticket |
| **Malicious (high confidence)** | Same session: unusual 4624 → 4672 → encoded PowerShell → outbound connection → 1102 |

## abuse

Defensive view: clearing logs is an **indicator-removal** (anti-forensics) technique. It mostly hurts defenders who rely only on **local** logs. Countermeasures:

| Defense | Why it helps |
|---|---|
| Forward events to a SIEM quickly | Copies leave the machine before they can be cleared |
| Alert on 1102 and 104 | The hiding attempt itself becomes a signal |
| Alert on audit policy changes (4719) and agent health | Catches attempts to stop logging instead of clearing |
| Restrict who has admin rights | Clearing the Security log requires administrative privilege |
| EDR telemetry | A second, independent record of processes and connections |

## evidence

- **1102** in the new Security log (account, Logon ID, time, computer).
- **104** in the System log for other cleared logs.
- **Earlier events already forwarded** to the SIEM (4624, 4672, 4688).
- **EDR records** of the process that performed the clearing and what ran before.
- **Telemetry gaps** — a host that suddenly stops reporting.

## where

| Evidence | Where |
|---|---|
| 1102 and other Security events | `SecurityEvent` in Microsoft Sentinel (1102 is in both the Minimal and Common event sets of the Windows Security Events via AMA connector) |
| 104 (other logs cleared) | `Event` table, when the System log is collected |
| Processes and connections | `DeviceProcessEvents`, `DeviceNetworkEvents` (Defender for Endpoint) |
| Agent and ingestion health | `Heartbeat` and the SecurityEvent volume per computer |

## analyst

For every 1102:

1. **Who** cleared it (account) and **which session** (Logon ID)?
2. **Is it expected?** Machine type, account role, change window, documented process.
3. **What happened before?** Same Logon ID / same machine: logons, privileges, processes, connections.
4. **What happened after?** Did activity continue? Did the machine stop reporting?
5. **Is the evidence safe elsewhere?** Check the SIEM and EDR for the period before the clearing.

## microsoft

- **Windows** writes 1102 (Security log cleared) and 104 (other logs cleared).
- **Microsoft Sentinel** collects 1102 in `SecurityEvent` via the Windows Security Events via AMA connector; built-in analytics rule templates alert on Security event log clearing.
- **Microsoft Defender for Endpoint** records process and network activity independently and can raise alerts for suspicious log clearing.
- **KQL** correlates 1102 with the events before it on the same computer and session.

## explainBack

Q: In one sentence, what does Event ID 1102 tell you — and what doesn't it tell you?
A: It tells you someone cleared the Windows Security log, which account did it and in which session; it doesn't tell you whether that was legitimate maintenance or an attacker hiding evidence — you need context for that.

Q: The attacker cleared the local Security log. Why can the SOC often still investigate?
A: The events were already forwarded to the SIEM before the log was cleared, so the copies survive. And the clearing itself created 1102, pointing straight at the session to investigate.

Q: Why is "the machine stopped sending logs" worth investigating, and why isn't it proof of an attack?
A: Attackers sometimes stop logging to hide, so a sudden gap can be a lead. But agents crash, laptops go offline and networks fail — so you check health and context before concluding anything.
