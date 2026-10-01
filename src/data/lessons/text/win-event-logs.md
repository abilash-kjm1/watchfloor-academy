## bridge

You've learned about **processes**, **accounts** and **network connections**. Windows writes a record whenever important things happen to them — a logon, a failed password, a new process, a change to a group.

This lesson teaches you to read those records by following a chain, instead of memorizing numbers:

**User action → Windows behavior → Event → Event ID → Event data → Security interpretation**

## what

Windows keeps a record of important activity in **event logs**.

### Event log channels
Logs are split into channels. The three you'll use most:

- **Security** — sign-ins, failed passwords, account changes, process starts.
- **System** — Windows itself: services, drivers, startup.
- **Application** — messages from installed programs.

### Event ID
Each record has an **Event ID** — a number that says *what type* of thing happened.
- Example: `4624` always means "an account successfully logged on".

### Fields
Each record also has **fields** with the details.
- Example: which account, from which computer, using which logon method.

> The Event ID tells you the **category**. The fields tell you the **story**.

## why

Administrators and auditors need to know:

- Who logged on?
- What changed?
- What failed?

Event IDs exist so software can reliably say *"this kind of thing happened"* without anyone having to read free text.

## name

- **Event ID** — an identifier for a *category* of event.
- The Security log events (the `4xxx` numbers) come from the Windows **auditing** system.
- Event `7045` comes from the **Service Control Manager** and is written to the **System** log, not the Security log.

## problem

Without event logs, Windows would leave **no record** of:

- logons
- failed passwords
- use of admin rights
- programs starting

These are the backbone of most Windows investigations.

## how

### Think in chains, not numbers

Don't memorize IDs. Learn the chain:

**User action → what Windows does → the event it writes**

### The eight events to know

**4624 — successful logon**
- Action: someone signs in successfully.
- Windows: accepts the password and creates a logon session.
- Log: Security.

**4625 — failed logon**
- Action: someone enters a wrong password.
- Windows: rejects the attempt.
- Log: Security.

**4672 — special privileges assigned**
- Action: an account logs on and receives powerful ("sensitive") privileges — for example the right to debug other programs or manage the security log.
- Windows: records which privileges the new session received.
- Log: Security.
- **Important:** Windows writes 4672 for **every logon of the built-in SYSTEM account**, so it appears constantly. Microsoft recommends focusing on 4672 for accounts that are **not** SYSTEM, LOCAL SERVICE or NETWORK SERVICE, and not an expected administrator.

**4688 — new process created**
- Action: a program starts.
- Windows: creates a process.
- Log: Security — **only if "Audit Process Creation" is enabled**. The full command line is recorded only if a second policy, *"Include command line in process creation events"*, is also turned on.

**4720 — user account created**
- Action: someone creates a new account.
- Log: Security.

**4728 — member added to a global security group**
- Action: someone is added to a domain group (e.g. Domain Admins).
- Log: Security.

**4732 — member added to a local security group**
- Action: someone is added to a computer's local group (e.g. local Administrators).
- Log: Security.

**7045 — new service installed**
- Action: a new background service is registered.
- Log: **System** (written by the Service Control Manager).
- A similar event, **4697** "A service was installed in the system", is written to the **Security** log when "Audit Security System Extension" is enabled.

**1102 — the audit log was cleared**
- Action: someone clears the Security log.
- Log: Security.
- Rare in normal operations, so always worth a look.

### Logon Type — *how* someone logged on

Events 4624 and 4625 include a **Logon Type** field. It is one of the most useful fields in Windows.

| Type | Name | Typical example |
|---|---|---|
| 2 | Interactive | Typing a password at the keyboard |
| 3 | Network | Opening a shared folder |
| 4 | Batch | A scheduled task running |
| 5 | Service | A service starting |
| 7 | Unlock | Unlocking the screen |
| 10 | RemoteInteractive | Remote Desktop (RDP) |
| 11 | CachedInteractive | Laptop offline, using saved credentials |

## analogy

Event IDs are like codes on a hotel key-card system:

- `4624` — door opened with a valid card.
- `4625` — invalid card tried.
- `4672` — the master key was used.
- `4720` — a new guest was registered.

The **code** tells you the category. The **details** tell you which room, which card and when.

## realWorld

One ordinary morning produces these events:

1. A user arrives and signs in to their laptop.
  - The laptop logs **4624, type 2** (or **type 7** when unlocking).
2. They open a mapped drive.
  - The **file server** logs **4624, type 3**, showing the laptop's IP address.
3. An admin uses Remote Desktop to reach a server.
  - The **server** logs **4624, type 10**.

## securityExample

A server that is reachable from the internet logs:

- **Hundreds of 4625** (failed logon) events
- **Logon type 3 or 10**
- From **one external IP**
- Trying names like `administrator` and `admin`

This is **automated password guessing**.

> The most important follow-up question: **is there any 4624 (success) from the same IP afterwards?** Failures show an attempt. A following success suggests the attacker got in.

## normal

- **4624 type 3** on file servers, all day long.
- **4624 types 2, 7 and 11** on workstations at the start of the day.
- **Occasional 4625** — people mistype passwords.
- **4720 / 4728** made by IT, during business hours, with a ticket.
- **7045** when software is installed or updated.

## suspicious

### Normal → suspicious → malicious, for logons

| | Example |
|---|---|
| **Normal** | 4624 type 2 on a user's own laptop at 08:55 |
| **Suspicious** | 4624 type 10 (RDP) to a finance server from a workstation that never connected before, at 23:40 |
| **Confirmed malicious** | That RDP logon followed 400 failed attempts from the same source, used an account whose owner was asleep, and was followed by a 4728 adding the account to Domain Admins |


- **Bursts of 4625** against many accounts or one account — especially from external IPs.
- **4624 type 10 (RDP)** between workstations, or from unexpected sources.
- **4672** for accounts that shouldn't have admin rights.
- **4728 / 4732** additions to privileged groups at odd hours.
- **7045** for a service whose program sits in a user or temp folder.
- **Gaps** in logging, or the Security log being **cleared** (Event **1102**).

## abuse

Defensive view:

- Once attackers have a real password, their logons are **successful logons** (4624).
  - So "success" does not mean "safe" — **context** decides: source, logon type, time, account.
- Attackers may try to **clear or disable** logs.
  - Clearing the Security log is itself recorded (**1102**) and is a high-priority signal. MITRE ATT&CK (v19) lists this under **Defense Impairment**, technique T1685.001.

## evidence

The fields that matter most:

| Field | Tells you |
|---|---|
| `TargetUserName` | **Who** logged on |
| `LogonType` | **How** they logged on |
| `IpAddress` / `WorkstationName` | **From where** |
| `SubjectUserName` | **Who made** a change (e.g. who added someone to a group) |
| `Status` / `SubStatus` | **Why** a logon failed — e.g. SubStatus `0xC000006A` = wrong password; `0xC0000064` = the account doesn't exist; `0xC0000234` = account locked out |
| `TargetLogonId` / `SubjectLogonId` | A session number that **links** a logon (4624) to what happened in that session (4672, 4688) |
| `NewProcessName` / `CommandLine` | **What** program started (4688) |

## where

**On the computer itself**
- Event Viewer → Windows Logs → Security / System.

**In Microsoft Sentinel**
- `SecurityEvent` table — Security log events (collected by the Azure Monitor Agent with a data collection rule).
- `Event` table — System and Application log events (this is where **7045** lands).

**In Defender XDR** (Extended Detection and Response — Microsoft's security suite for computers, email and accounts; covered later)
- `DeviceLogonEvents` and `DeviceProcessEvents` — richer, sensor-based versions of the same activity.

## analyst

Start from the **question**, then find the event:

| Your question | Look for |
|---|---|
| Did someone log on to this server from outside? | **4624**, logon type **10**, check `IpAddress` |
| Was a password guessed? | A burst of **4625**, then **4624** from the same source |
| Were admin rights granted? | **4672**, **4728**, **4732** |
| What did they run afterwards? | **4688** (or `DeviceProcessEvents`) |

## microsoft

SC-200 tests how Windows events get into Sentinel:

- **Windows Security Events via AMA** — the Azure Monitor Agent collects events using **data collection rules (DCRs)**.
- **DCR event sets** — choose *All*, *Common*, *Minimal*, or *Custom* (XPath queries) to balance coverage and cost.
- **Windows Event Forwarding (WEF)** — computers forward events to a collector server, and the Azure Monitor Agent on the collector sends them to Sentinel through the **Windows Forwarded Events** connector.
  - Important: forwarded events land in the **`WindowsEvent`** table, **not** `SecurityEvent` — so many built-in rules written for `SecurityEvent` won't see them unless you adapt them.

## explainBack

Q: Explain what Event ID 4624 is without just saying "successful logon" — what would you look at and why?
A: It's the record Windows writes when someone signs in successfully. On its own it's normal, so the useful parts are the details: which account, how they signed in (the logon type — keyboard, network share, or remote desktop), from which computer or IP, and when. Those details tell you whether the sign-in fits the person's normal behavior.

Q: Why is a failed-logon burst followed by a success more important than the failures alone?
A: Failures only show someone tried. A success from the same source afterwards suggests a guess worked, so the account may now be in the attacker's hands and needs immediate investigation.

Q: Your workspace has very few 4688 events. What might be wrong?
A: Process-creation auditing might not be enabled, or the data collection rule might not collect that event. 4688 only appears when "Audit Process Creation" is on — and the command line only when the extra command-line policy is on.
