## bridge

In **Investigating a device in Defender for Endpoint** you learned to decide whether a computer is compromised. In **Incident response** you learned the order: scope → contain → eradicate → recover. This lesson covers the **response actions** Defender for Endpoint gives you — what each one does, what it affects, and when to use it.

**Chain:** Confirmed or likely compromise → choose a proportionate action → isolate / restrict / scan / collect evidence / live response → action logged → remediate → release

## what

Response actions are buttons on the **device page** (and some on files and users) that change the device's state from the Defender portal.

| Action | What it does in one line |
|---|---|
| **Isolate device** | Cuts the device off from the network, but keeps its connection to the Defender service |
| **Restrict app execution** | Allows only Microsoft-signed programs to run |
| **Run antivirus scan** | Starts a Microsoft Defender Antivirus scan remotely |
| **Collect investigation package** | Gathers a zip of forensic data from the device |
| **Initiate live response session** | Opens a remote command console on the device |
| **Initiate automated investigation** | Starts Defender's automated investigation on the device |
| **Contain device** | Tells *other* onboarded devices to block traffic with an (often unmanaged) compromised device |
| **Stop and quarantine file** | Stops a malicious process and quarantines the file across devices |

## why

When an attack is happening, analysts need to **stop it spreading** quickly — often at 3 a.m., with the device in another country. Remote actions let the SOC act in seconds instead of waiting for someone to physically unplug a laptop, while **keeping the evidence** for investigation.

## name

- **Isolate** — separate the device from everything else on the network.
- **Contain** — keep a threat inside a boundary so it can't spread.
- **Live response** — responding *live*, in real time, on the device.
- **Investigation package** — a *package* of data for *investigating*.

## problem

Without remote response:

- Attackers keep moving while the SOC waits for IT to reach the machine.
- Unplugging the network cable also cuts off the security tools, so you lose visibility.
- Evidence gets lost if the device is reimaged before anyone collects it.

## analogy

A hospital isolating a patient with a contagious illness:

- **Isolation ward** — the patient can't contact other patients, but the doctors (the Defender service) can still monitor and treat them.
- **Restricting visitors** — only approved people (Microsoft-signed programs) allowed in.
- **Taking samples before treatment** — collecting the investigation package before wiping the device.

## how

### Isolate device
- Disconnects the device from the network **while retaining connectivity to the Defender for Endpoint service**, which keeps monitoring it.
- Two modes:
  - **Full isolation** — all traffic blocked except Defender's.
  - **Selective isolation** — like full isolation, but allows exceptions you define (for example a management tool), using **isolation exclusion rules**.
- Isolation is **automatically lifted after seven days** if not released earlier.
- If the device is offline, Defender retries for up to three days.
- Release it from the device page with **Release from isolation**.

### Restrict app execution
- Applies a code integrity policy that allows only files **signed by a Microsoft-issued certificate** to run.
- Stops the attacker's own tools from running while the device stays online.
- Reversible with **Remove app restrictions**.

### Collect investigation package
A zip of forensic data. On Windows it includes folders such as:
- **Autoruns** (programs set to start automatically),
- **Installed programs**,
- **Network connections** (active connections, ARP and DNS cache, IP configuration),
- **Prefetch files** (traces of recently run programs),
- **Processes**, **Scheduled tasks**, **Services**,
- **Security event log**,
- **SMB sessions**, **System information**, **Temp directories**, **Users and groups**.

> Collect this **before** reimaging — it preserves evidence the reimage would destroy.

### Live response
A remote command console, controlled by roles:
- **Basic commands** (look around): `processes`, `connections`, `services`, `scheduledtasks`, `persistence`, `registry`, `dir`, `fileinfo`, `findfile`, `getfile` (download a file).
- **Advanced commands** (change things): `run` (a script from the library), `putfile`, `remediate`, `analyze`, `undo`.
- Requirements and limits:
  - Live response must be **turned on in Advanced features** (plus a separate setting for servers).
  - **Unsigned PowerShell scripts** need the *Live response unsigned script execution* setting — Microsoft warns this increases risk.
  - Scripts must be uploaded to the **library** first.
  - Sessions time out after **30 minutes** of inactivity; a device can be in only one session at a time.
  - Every command is recorded in the **command log**.

### Contain device and contain user
- **Contain device** — for an **unmanaged** compromised device (one without Defender): every onboarded device blocks traffic with it.
- **Contain user** — blocks a compromised account's activity on onboarded devices; currently applied **automatically by automatic attack disruption**.

### Automation levels and device groups
- Automated investigation can fix things itself depending on the **automation level** set for each **device group** — from *full (remediate automatically)* to *require approval for any remediation*.
- Pending approvals wait in the **Action center**. Every manual and automatic action is listed there too.

### Permissions
Actions need the right role (for example **Active remediation actions**) **and** access to that device's **device group**.

## realWorld

A confirmed malicious script on a finance laptop:

1. **Isolate device** (full) — stops spread; Defender still sees the device.
2. **Collect investigation package** — preserve evidence.
3. **Live response**: `persistence` and `scheduledtasks` find a task the attacker created; `getfile` downloads the dropped file for analysis.
4. **Stop and quarantine file** across all devices where the hash was found.
5. After eradication (and identity reset for the user): **Release from isolation**, monitor closely.

## securityExample

A domain controller shows signs of compromise. **Full isolation would stop every sign-in in the company**, so the team:

- relies on **automatic attack disruption**, which can contain critical assets at a granular level (blocking specific ports and directions) instead of cutting everything,
- or uses **selective isolation**, keeping essential services reachable,
- and coordinates with IT leadership before any action.

> Containment must be **proportionate** — weigh the business impact against the risk.

## normal

- Actions taken by authorized analysts, with comments, visible in the Action center.
- Isolation released once the device is clean.
- Automated investigations closing many alerts automatically on standard workstations.

## suspicious

Operational warning signs:
- Response actions **without comments** or by unexpected people.
- Devices **left isolated** for days with no follow-up (they'll auto-release after seven days).
- **Unsigned script execution** enabled permanently "for convenience".
- Pending automated actions **waiting unapproved** in the Action center.

## abuse

Defensive view: powerful response tools are themselves sensitive.

- Live response gives deep control of a device — restrict it to trained responders with least-privilege roles.
- Enabling **unsigned script execution** widens what could be run remotely.
- Excessive **isolation exclusions** weaken isolation; review them regularly.

## evidence

- **Action center** — history of every action, who took it and the result.
- **Device timeline** — events showing isolation, scans and restrictions applied.
- **Live response command log** — every command in a session.
- **Investigation package** contents.

## where

| Evidence | Where |
|---|---|
| Action history and pending approvals | Defender portal → Action center |
| Live response commands | Session dashboard → Command log |
| Device state (isolated, restricted) | Device page and timeline |
| Automated investigations | Incident → Investigations; Action center |

## analyst

Choosing an action:

| Situation | Typical action |
|---|---|
| Active attack spreading from a workstation | **Isolate (full)** |
| Must stay online, but stop unknown tools | **Restrict app execution** or **selective isolation** |
| Need evidence before cleanup | **Collect investigation package** |
| Need to look around or remove one item | **Live response** |
| Same malicious file on many devices | **Stop and quarantine file** |
| Compromised device you don't manage | **Contain device** |

Then: **document** the action and the reason, **coordinate** with IT and the user, and **release** when eradication is confirmed.

## microsoft

- **Defender for Endpoint** device and file response actions in the Defender portal.
- **Automated investigation and response (AIR)** and **automatic attack disruption** in Defender XDR.
- **Advanced features** settings control live response, unsigned scripts, isolation exclusions and more.
- **SC-200** objectives: "Perform actions on the device, including live response and collecting investigation packages", "Configure and manage device groups, permissions, and automation levels", "Configure Microsoft Defender for Endpoint advanced features".

> **Stable concept vs current UI:** isolate / restrict / collect / live response are stable concepts; exact menus, limits and preview features change — check Microsoft's docs before relying on numbers.

## explainBack

Q: Explain device isolation, and why it doesn't stop you from investigating.
A: Isolation cuts the device off from the rest of the network so an attacker can't use it to reach other machines or the internet, but it keeps the device's link to the Defender service. So the security team can still see what's happening and run investigation and response actions on it.

Q: When would you choose restrict app execution instead of isolation?
A: When the device needs to stay connected — for example a machine running something important — but you want to stop the attacker's own tools. Restricting app execution allows only Microsoft-signed programs to run while the network stays up.

Q: Why collect an investigation package before reimaging?
A: Reimaging wipes the disk. The package keeps copies of autoruns, processes, connections, scheduled tasks, event logs and more, so you can still work out what happened and how far it spread.
