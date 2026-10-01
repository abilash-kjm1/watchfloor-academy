## bridge

You've met several log sources already — Windows events, DNS logs, firewall logs. This lesson gives you one method that works for **any** log from **any** product, so you're never stuck in front of an unfamiliar record.

**Chain:** Event → *log record* → five questions (when, who, where, what, result) → pivot to another source

## what

A **log record** is a structured description of **one event**.

No matter where it comes from — Windows, Linux, a firewall, a cloud service — almost every log answers the same **five questions**:

1. **When** did it happen? → the timestamp
2. **Who** did it? → the user or account
3. **Where** did it happen? → the computer and IP addresses
4. **What** happened? → the action
5. **What was the result?** → success, failure, allowed, blocked

> Learn to find these five answers and you can read a log from a product you have never seen before.

## why

Systems write logs for:

- **Troubleshooting** — why did this break?
- **Auditing** — who changed what?
- **Compliance** — proving rules were followed.

Security teams reuse these same records as **evidence**.

Because every vendor invented its own format, analysts need **one simple mental model** that works for all of them. That model is the five questions.

## name

"Log" comes from ships' **logbooks**.

Sailors measured their speed by throwing a wooden log overboard and timing it, then wrote the result in the *log book*.

A log is still exactly that: **a time-ordered record of what happened**.

## problem

Without a consistent way to read logs, every new log source is a puzzle.

With the five questions, you can **triage any record in seconds**.

## how

### Common log formats

**1. Plain text (Linux syslog)**
```
Sep 28 14:09:12 web01 sshd[2211]: Failed password for invalid user admin from 203.0.113.99 port 51522 ssh2
```

**2. JSON (cloud services)**

JSON (JavaScript Object Notation) is a common text format for structured data: each value has a **name**, written as `"name": value`, and everything sits between curly brackets.
```
{"time":"2026-09-28T14:09:12Z","user":"alex@contoso.com","ip":"198.51.100.23","app":"Exchange Online","result":"success"}
```

**3. Windows events**
- Structured records with named fields (see the Windows event logs lesson).

**4. CEF (network devices)**
- A fixed header, then `key=value` pairs.
```
CEF:0|Contoso|Firewall|1.0|100|Connection denied|5|src=10.10.20.14 dst=203.0.113.50 dpt=4444 act=deny
```

### Field-name cheat sheet

Different products use different names for the same thing:

| Question | Typical field names |
|---|---|
| When | `TimeGenerated`, `Timestamp`, `time`, `EventTime` |
| Who | `UserPrincipalName`, `AccountName`, `TargetUserName`, `user` |
| Where | `Computer`, `DeviceName`, `IPAddress`, `SourceIP`, `RemoteIP` |
| What | `Operation`, `ActionType`, `EventID`, `FileName`, `ProcessCommandLine` |
| Result | `ResultType`, `Status`, `DeviceAction` (allow/deny) |

### Time zones matter

- Microsoft security tables store time in **UTC**.
- A sign-in at **02:14 UTC** might be **21:14 the previous evening** in the user's local time.

> Always write the **time zone** in your notes.

## analogy

A log record is a **witness statement**.

A good statement says: when, who, where, what happened and how it ended.

Different witnesses use different words — one says "Timestamp", another says "TimeGenerated" — but they are describing the same scene.

## realWorld

Three different sources, side by side in one SOC:

- A **Linux web server** writes login messages to `/var/log/auth.log` (Ubuntu/Debian) or `/var/log/secure` (Red Hat).
- A **firewall** forwards CEF messages over syslog.
- **Entra ID** produces JSON sign-in records.

The SIEM collects all three so analysts can search them together.

## securityExample

Read this line using the five questions:

```
Sep 28 03:12:40 web01 sshd[8812]: Failed password for invalid user test from 203.0.113.99 port 40122 ssh2
```

| Question | Answer |
|---|---|
| When | Sep 28, 03:12:40 (server's local time — check its time zone) |
| Who | Username `test` — and "invalid user" means **the account doesn't exist** |
| Where | Target: `web01`. Source: `203.0.113.99` |
| What | An SSH password login attempt |
| Result | Failed |

> **One** line like this is noise. **Five hundred** from the same source in ten minutes is a pattern.

## normal

- Each source sends a **steady, explainable volume**.
- Timestamps are **consistent** (clocks are in sync).
- Failed logins happen at **low rates**, for **real usernames**.

## suspicious

- **Sudden spikes** in volume — or **sudden silence**.
- Many failures for **usernames that don't exist**.
- Activity at times when the business is **closed**.
- **Odd values** in fields, e.g. a server name in a user field, or extremely long command lines.

## abuse

Defensive view: logs can be

- **Incomplete** — logging was never turned on.
- **Delayed** — they arrive late.
- **Deleted** — cleared on a compromised machine.

> Copying logs **off the machine quickly** into a central system protects the evidence. Gaps and clearing events are evidence too.

## evidence

Logs **are** the evidence.

When you put log details in a ticket:

- Keep the **original field values**.
- Note the **table** and the **query** you used, so others can reproduce your result.

## where

Common tables in Microsoft Sentinel:

| Table | Contains |
|---|---|
| `SigninLogs`, `AuditLogs` | Entra ID sign-ins and changes |
| `SecurityEvent` | Windows Security log |
| `Event` | Windows System/Application logs |
| `Syslog` | Linux logs |
| `CommonSecurityLog` | Network devices sending CEF |
| `AzureActivity` | Changes to Azure resources |
| `OfficeActivity` | Microsoft 365 activity |
| `Device*`, `Email*`, `Identity*` | Defender XDR data |

## analyst

For every unfamiliar log, follow three steps:

1. **Find the five answers** — when, who, where, what, result.
2. **Pick a pivot field** — usually the user, the computer or the IP.
3. **Find the same entity in another source.**

> Connecting **two** sources tells you far more than staring at **one**.

## microsoft

- Sentinel stores data in **tables** inside a **Log Analytics workspace**.
- **ASIM** (Advanced Security Information Model) renames fields from different vendors to **common names** (e.g. `SrcIpAddr`), so one query works across many sources.
- **Custom log tables** let you bring in sources Microsoft doesn't support out of the box — this is an SC-200 objective.

## explainBack

Q: What five questions does almost every log answer?
A: When it happened, who did it, where (which computer and addresses), what happened, and what the result was.

Q: Why must you always write the time zone in your notes?
A: Microsoft security tables use UTC. If you mix UTC with local time, you can put events in the wrong order or think something happened at night when it was actually during work hours.

Q: Why is comparing two log sources better than reading one?
A: Each source sees only part of the story. A sign-in log shows the account; an endpoint log shows what that account then ran. Together they confirm or rule out what you suspect.
