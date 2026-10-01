## bridge

In **Programs, processes and services** you learned that every action on a computer is done by a process, and that EDR records them. In **Defender XDR** you saw incidents built from many alerts. This lesson goes inside Microsoft's EDR, **Defender for Endpoint**, to investigate one computer: its alerts, its process tree, and its **timeline** of everything that happened.

**Chain:** Device activity (processes, files, network, registry) → Defender for Endpoint sensor → device page, alert story, timeline → Advanced Hunting tables → verdict

## what

### Microsoft Defender for Endpoint (MDE)
Microsoft's **endpoint security platform**. On each onboarded computer it provides:

- **Prevention** — Microsoft Defender Antivirus, attack surface reduction rules, network protection.
- **EDR (Endpoint Detection and Response)** — a **sensor** that continuously records what happens and detects suspicious behavior.
- **Investigation and response** — device pages, timelines, response actions (next lesson).
- **Vulnerability management** — finding missing updates and weak settings.

### Key terms for this lesson

**Onboarding**
- Connecting a device to MDE so its sensor sends telemetry. Devices that aren't onboarded are **blind spots**.

**Device inventory**
- The list of all devices MDE knows about, with their health, risk level and exposure.

**Device page**
- Everything about one device: alerts, incidents, logged-on users, software, vulnerabilities and the timeline.

**Alert process tree (alert story)**
- The chain of processes and actions that led to an alert, drawn as a tree.

**Device timeline**
- A searchable, time-ordered list of **every event** the sensor recorded on the device — processes, file changes, network connections, registry changes, logons.

**Attack surface reduction (ASR) rules**
- Built-in rules that block risky *behaviors* commonly used in attacks — for example, **blocking Office apps from creating child processes**. They can run in **audit** mode (record only) or **block** mode.

## why

An alert says *something* happened. To decide whether it's real and how far it went, you need the **full story around it**:

- What started the suspicious process?
- What did it do next?
- Did it connect anywhere, change settings, or create files?
- Who was logged on?

The device page and timeline exist so you can answer those questions **without touching the computer** — which also protects evidence.

## name

- **Endpoint** — a device at the edge of the network where people work.
- **Timeline** — events in time order, like a film you can scrub through.
- **Attack surface** — all the ways an attacker could get in; ASR rules *reduce* it.

## problem

Without an EDR timeline, investigating a laptop means:

- physically collecting it, or connecting remotely and digging through logs by hand,
- hoping the right logging was enabled,
- risking that the user or attacker changes evidence in the meantime.

MDE records the evidence **continuously and centrally**, so it's already there when you need it.

## analogy

A building with security cameras in every room:

- The **device page** is the file on one room — who uses it, what's in it, past incidents.
- The **alert story** is the security guard's clip of the moment the alarm went off.
- The **timeline** is the full camera recording you can rewind to see what led up to it and what happened after.

## how

### Step 1: Start from the alert
Open the alert. The **alert story** shows:
- the **process tree** — parent → child → grandchild,
- the **command lines**,
- related files, network connections and registry changes,
- the **MITRE ATT&CK techniques** Defender associated with the behavior.

### Step 2: Read the process tree
Use the four checks from the processes lesson for each node:
1. **Parent** — is this parent normal for this child?
2. **Path** — is the file where it should be?
3. **Publisher / signature** — signed by a trusted company?
4. **Command line** — does it make sense?

### Step 3: Open the device timeline
- Jump to the **alert time**, then scroll **backwards** (what led up to it) and **forwards** (what happened next).
- **Filter** by event type (process, network, file, registry, logon) or search for a file name, IP or user.
- **Flag events** that matter, so they're easy to find again and to cite in your notes.

### Step 4: Check context on the device page
- **Logged-on users** — who was using the device?
- **Exposure and risk level** — missing updates or weak settings that made the attack easier?
- **Other alerts** on the same device recently?

### Step 5: Pivot outward
Take what you found — a file hash, an IP, a domain, an account — and search **all devices** in Advanced Hunting to **scope** the incident.

### Where ASR rules fit
ASR rules stop common attack behaviors before they cause damage. When one fires, it creates an event (and, in block mode, often an alert). Start new rules in **audit mode** to see what they would block without disrupting the business.

## realWorld

An alert: *"Suspicious PowerShell command line"* on `fin-ws-022`.

1. **Process tree**: `explorer.exe → OUTLOOK.EXE → EXCEL.EXE → powershell.exe` with a long encoded command line.
2. **Timeline, 2 minutes earlier**: Outlook saved an attachment `invoice_0928.xlsm` to the Downloads folder.
3. **Timeline, after**: PowerShell made an outbound connection to a domain first seen today; a new file was created in the user's AppData folder.
4. **Device page**: one logged-on user from Finance; no other alerts.
5. **Pivot**: Advanced Hunting finds the same attachment name delivered to 6 other users.

The analyst escalates — this is now a multi-user incident (email + endpoint).

## securityExample

An ASR rule in **block** mode stops `WINWORD.EXE` from creating a child process. The event shows the blocked command line. Even though the action was blocked, the analyst still:

- finds the **document** that triggered it (where did it come from?),
- checks whether the same document reached **other users**,
- checks the user's **sign-ins** in case the email also contained a credential-phishing link.

> A blocked attack is still evidence of an **attempt**. It tells you who is being targeted and how.

## normal

- Thousands of process events per device per day from browsers, Office and Windows itself.
- ASR rules in audit mode recording a few business apps that behave like attack patterns (to be reviewed and excluded narrowly).
- Devices showing **Active** sensor health and onboarded status.

## suspicious

- Unusual **parent–child** pairs (Office → script interpreter).
- **Encoded or very long** command lines.
- Files written to **AppData / Temp / Downloads** and then executed.
- **New outbound connections** right after an unusual process starts.
- **Registry Run key** or **scheduled task** created by a non-installer process.
- **Sensor health** suddenly inactive or misconfigured on one device.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | IT management software runs a signed PowerShell script on all devices nightly |
| **Suspicious** | Excel starts PowerShell with an encoded command on one device |
| **Confirmed malicious** | That PowerShell downloaded an unsigned file that ran from AppData, created a scheduled task, and connected to a domain on a threat-intelligence list |

## abuse

Defensive view:

- Attackers prefer **built-in tools** (PowerShell, rundll32, mshta) to blend in — the timeline shows the *context* that gives them away.
- Some attempt to **disable or tamper with security tools** — MDE's **tamper protection** guards against this, and loss of sensor telemetry is itself a signal.
- Devices that are **not onboarded** give attackers a place to hide — onboarding coverage is a security metric.

## evidence

The MDE sensor records:

- **Process creation** with command lines and parents.
- **Network connections** with the process that made them.
- **File** creation, modification, rename and deletion.
- **Registry** changes.
- **Logons** to the device.
- **Security events** such as antivirus detections and ASR rule hits.
- **Device information** — OS, onboarding status, sensor health, exposure level.

## where

| Evidence | Where in the portal | Advanced Hunting table |
|---|---|---|
| Processes | Alert story, timeline | `DeviceProcessEvents` |
| Network | Timeline | `DeviceNetworkEvents` |
| Files | Timeline | `DeviceFileEvents` |
| Registry | Timeline | `DeviceRegistryEvents` |
| Logons | Timeline, device page | `DeviceLogonEvents` |
| AV detections, ASR hits, other security events | Timeline, alerts | `DeviceEvents` (e.g. `ActionType` starting with `Asr`) |
| Device details, health, exposure | Device inventory, device page | `DeviceInfo` |

## analyst

A device investigation routine:

1. **Alert story** — read the process tree with the four checks.
2. **Timeline** — 15–30 minutes before and after; flag key events.
3. **Device context** — users, exposure, other alerts.
4. **Pivot** — hashes, IPs, domains, accounts across all devices.
5. **Decide** — true positive? Then move to response (next lesson): contain first, then remediate.
6. **Document** — flagged events, queries, conclusions.

## microsoft

- **Defender for Endpoint** device pages, timelines and alert stories in the **Microsoft Defender portal**.
- **Advanced Hunting** `Device*` tables hold about 30 days of this telemetry.
- **Defender XDR** joins endpoint alerts with email and identity alerts in one incident.
- **SC-200** objectives: "Investigate device timelines", "Perform evidence and entity investigation", and configuring **ASR rules** and **advanced features**.

> **Stable concept vs current UI:** process tree, timeline and pivoting are stable skills; panel names and filters in the portal change.

## explainBack

Q: Explain the difference between the alert story and the device timeline.
A: The alert story is the short clip of what directly caused the alarm — the chain of processes involved. The timeline is the full recording of everything on that device, so you can see what led up to the alert and what happened after it.

Q: An ASR rule blocked something. Why investigate if it was already blocked?
A: The block shows someone tried. You still need to know where the attempt came from (an email, a download), who else received it, and whether another part of the attack — like a password-stealing link — succeeded.

Q: Why is a device that isn't onboarded to Defender for Endpoint a security problem?
A: Nothing is recorded there, so an attacker working on that device leaves no endpoint evidence and no alerts — it's a blind spot.
