## bridge

You've learned that attackers run programs (4688) and sometimes try to erase the evidence (1102). But a running program disappears when the computer restarts. An attacker who wants to **come back** needs the computer to start their program again â€” automatically. That is **persistence**.

This lesson covers the three most common Windows persistence places â€” **services**, **scheduled tasks** and **Run keys** â€” and the evidence each leaves.

**Chain:** Attacker runs code once â†’ wants it to survive reboots â†’ creates a service, scheduled task or Run key â†’ Windows records the change (7045 / 4697, 4698, registry events) â†’ analyst finds the autostart entry â†’ removes it and finds how it got there

## what

### Persistence
**Persistence** means any technique that keeps an attacker's access or code running **across restarts, sign-outs or password changes**. MITRE ATT&CK has a whole tactic for it.

### 1. Services
A **service** is a background program that Windows starts automatically (often at boot, often as SYSTEM). Creating a service is a powerful persistence method because it runs with high privileges.
- **Event 7045** (System log): "A service was installed in the system."
- **Event 4697** (Security log): "A service was installed in the system" â€” only when *Audit Security System Extension* is enabled.

### 2. Scheduled tasks
A **scheduled task** runs a program at a set time or trigger (at logon, at startup, every hour).
- **Event 4698** (Security log): "A scheduled task was created" â€” requires *Audit Other Object Access Events*. Related: **4702** (updated), **4699** (deleted).
- Created with the Task Scheduler interface, `schtasks.exe`, PowerShell, or other tools.

### 3. Registry Run keys
The **registry** is Windows' settings database. Some keys tell Windows to start programs when a user signs in:
- `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` (for one user)
- `HKLM\Software\Microsoft\Windows\CurrentVersion\Run` (for all users â€” needs admin)
- The **Startup folder** does the same with files instead of registry values.

## why

**Why do these features exist?** Legitimate software needs to start automatically: antivirus, backup agents, chat apps, update checkers. Windows provides several official ways to do it.

**Why do attackers use them?** Because they're official. An attacker's autostart entry looks like any other software's â€” unless you look at **what it starts**, **where that file lives**, and **who created it**.

## name

- **Persistence** â€” the attacker *persists* (stays) in the environment.
- **Service** â€” a program that *serves* the system in the background.
- **Run key** â€” a registry key whose values Windows *runs* at sign-in.
- **Autostart / autorun** â€” anything that starts *automatically*.

## problem

Knowing persistence lets an analyst answer:

1. **Will the attacker come back after we clean the running process?**
2. **What starts automatically on this machine, and is all of it expected?**
3. **When was the autostart entry created, and by which process?** â€” leading back to the initial infection.
4. **Is the same entry on other machines?**

## analogy

A burglar leaves a spare key under the doormat. Even if you chase them out, they come back tonight.

- **Service** â€” a key given to the building's maintenance staff: it opens every door, all the time.
- **Scheduled task** â€” a timer that unlocks the back door every night at 02:00.
- **Run key** â€” a note in your diary saying "open the window when you get home".

Cleaning the house isn't enough â€” you have to find the spare key.

## how

### Step 1: How each mechanism is created and recorded
| Mechanism | Typical creation | Evidence |
|---|---|---|
| Service | `sc.exe create`, PowerShell `New-Service`, installers | 7045 (System), 4697 (Security, if audited), process events for sc.exe |
| Scheduled task | `schtasks /create`, Task Scheduler, PowerShell | 4698 (Security, if audited), process events for schtasks.exe |
| Run key | `reg add`, PowerShell, any program writing the registry | Registry events (Defender for Endpoint), Sysmon if deployed |
| Startup folder | Any file copy | File creation events |

### Step 2: What to look at in an autostart entry
1. **What does it run?** The full command line or file path.
2. **Where does the file live?** Program Files (common for real software) vs AppData, Temp, Public (common for malware).
3. **Is it signed?** By whom?
4. **Who created it, and from which parent process?**
5. **When?** Does the timing match an install, an update, or a suspicious event?

### Step 3: Clean up correctly
Kill the process, **remove the autostart entry**, delete the file, and then find **how the attacker created it** (the initial access) â€” otherwise they'll just do it again.

## realWorld

A normal laptop has dozens of autostart entries: antivirus, VPN client, chat app, printer software, update checkers for browsers and Office. Most were created by installers running from `msiexec.exe` or a signed vendor setup program, and they point to files in Program Files.

## securityExample

A user opens a malicious attachment. PowerShell runs and, within seconds:
- creates a Run key `OneDriveUpdate` pointing to `C:\Users\Public\odupd.exe`;
- creates a scheduled task that runs the same file every hour.

The analyst kills the process, but it reappears an hour later â€” from the task. Only after removing **both** the Run key and the task, and deleting the file, is the device clean.

## normal

- Services and tasks created by installers (`msiexec.exe`, signed setup programs) pointing to Program Files.
- Run keys for known apps (chat clients, cloud storage, security tools).
- Tasks created by IT management tools on many devices at once.

## suspicious

- Autostart entries pointing to **AppData, Temp, Public, Downloads**.
- **Unsigned** files or names imitating Microsoft (`OneDriveUpdate`, `WindowsDefenderUpd`).
- Created by **PowerShell, cmd, wscript, mshta** rather than an installer.
- A **service** installed from a user's folder, or with a command line that runs PowerShell.
- Entries that appear on **one device only**.

### Normal â†’ suspicious â†’ malicious

| | Example |
|---|---|
| **Normal** | The VPN installer creates a service pointing to C:\Program Files\VPN\vpnsvc.exe |
| **Suspicious** | PowerShell creates a scheduled task named "GoogleUpdateCheck" that runs a file in C:\Users\Public |
| **Malicious** | That file is unsigned, was dropped by a macro document, and beacons to a new domain every hour |

## abuse

Defensive view of persistence techniques:

| Technique (MITRE ATT&CK) | Defensive control | Detection |
|---|---|---|
| Create or Modify System Process: Windows Service (T1543.003) | Least privilege (creating services needs admin) | 7045 / 4697; sc.exe process events |
| Scheduled Task/Job: Scheduled Task (T1053.005) | Restrict admin rights; attack surface reduction (ASR) rules and application control | 4698; schtasks.exe with /create |
| Boot or Logon Autostart Execution: Registry Run Keys / Startup Folder (T1547.001) | Application control blocking user-writable paths | Registry value changes on Run keys; Startup folder files |

## evidence

- **Service installation events** â€” 7045 (System), 4697 (Security, if audited).
- **Scheduled task events** â€” 4698 / 4702 / 4699 (Security, if audited).
- **Process events** â€” sc.exe, schtasks.exe, reg.exe, PowerShell creating them.
- **Registry and file events** from Defender for Endpoint â€” Run keys and Startup folder changes.

## where

| Evidence | Where |
|---|---|
| 7045 service installs | `Event` table (System log collected via a data collection rule (DCR)) |
| 4697, 4698 | `SecurityEvent` (when the audit subcategories are enabled and collected; 4698 needs the All or Custom event set) |
| Run key changes | `DeviceRegistryEvents` (Defender for Endpoint) |
| Task and service creation commands | `DeviceProcessEvents` |
| Startup folder files | `DeviceFileEvents` |

## analyst

For any compromised machine, always ask: **"How would this attacker come back?"**

1. List new services, tasks, Run keys and Startup items since the suspected start time.
2. For each: what does it run, where does it live, is it signed, who created it?
3. Remove every malicious entry â€” not just the running process.
4. Search other devices for the same names, paths and hashes.

## microsoft

- **Microsoft Defender for Endpoint** records service, task, registry and file activity and alerts on suspicious persistence.
- **Advanced Hunting** â€” `DeviceRegistryEvents`, `DeviceProcessEvents`, `DeviceFileEvents`, `DeviceEvents`.
- **Microsoft Sentinel** â€” 7045 via the System log (`Event`); 4697 and 4698 in `SecurityEvent` when audited and collected. Note: 4697 is in the Common event set, but **4698 is in neither the Common nor the Minimal set** â€” collect it with "All events" or a Custom XPath rule.
- **Attack surface reduction rules** and **App Control for Business** reduce what can run from user-writable paths.

## explainBack

Q: Why isn't killing a malicious process enough?
A: If the attacker created persistence â€” a service, task or Run key â€” Windows will start their program again at the next trigger or reboot. You have to remove the autostart entry too.

Q: What three questions do you ask about any autostart entry?
A: What does it run (and where does that file live)? Is it signed and by whom? Who created it, from which process, and when?

Q: Why does it matter that 4698 needs an audit setting?
A: If "Audit Other Object Access Events" isn't enabled, Windows won't log task creation in the Security log â€” you'd need other sources like Defender for Endpoint's process events to see it.
