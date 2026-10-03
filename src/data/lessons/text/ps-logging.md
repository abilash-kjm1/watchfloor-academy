## bridge

You've seen PowerShell appear again and again in attack stories — started by Word, running encoded commands, downloading files. Process events (4688) tell you **that** PowerShell ran and with what command line. But an encoded or obfuscated command line hides **what the script actually did**.

This lesson covers the logging that reveals PowerShell's real content — **script block logging (4104)** — and **AMSI**, the interface that lets antivirus inspect scripts as they run.

**Chain:** PowerShell runs a script (maybe encoded) → PowerShell decodes it before execution → script block logging records the decoded content (4104) → AMSI lets antivirus scan it → events reach the SIEM → the analyst reads what the script really did

## what

### 1. PowerShell
**PowerShell** is Windows' built-in command shell and scripting language. Administrators use it every day — and so do attackers, because it's powerful, trusted and present on every machine.

### 2. Three kinds of PowerShell logging
| Logging | What it records | Event |
|---|---|---|
| **Script block logging** | The content of each script block PowerShell processes — **after** decoding | **4104** |
| **Module logging** | Pipeline execution details for specified modules | 4103 |
| **Transcription** | A text transcript of sessions (input and output) written to files | Files, not events |

**Where:** Windows PowerShell 5.1 writes to `Microsoft-Windows-PowerShell/Operational`; PowerShell 7 writes to `PowerShellCore/Operational`.

**How it's enabled:** Group Policy — *Turn on PowerShell Script Block Logging* (or the equivalent registry setting).

### 3. AMSI — Antimalware Scan Interface
**AMSI (Antimalware Scan Interface)** is a Windows interface that lets scripting engines (PowerShell, VBScript, JScript, Office macros) hand content to the installed antivirus **just before it runs** — after decoding. Microsoft Defender Antivirus uses it to catch malicious scripts that look harmless on disk.

## why

**Why does script block logging exist?** Because attackers obfuscate commands: [[base64|Base64 encoding]], string splitting, compression. The command line shows gibberish. But PowerShell itself must decode the script to run it — so logging at that point captures the **real** content.

**Why does AMSI exist?** For the same reason: scanning files on disk misses scripts that are built in memory or downloaded and run directly. AMSI scans what is actually about to execute.

## name

- **Script block** — a chunk of PowerShell code (a script, a function, a command) processed as one unit.
- **Transcription** — like a court transcript: a written record of what was typed and returned.
- **AMSI** — **A**nti**m**alware **S**can **I**nterface: an *interface* through which apps ask antimalware to *scan* content.

## problem

These features let an analyst answer:

1. **What did that encoded PowerShell command actually do?** — 4104 shows the decoded script.
2. **Did a script download or run something else?** — the script content shows URLs and commands.
3. **Was a malicious script blocked?** — AMSI detections in antivirus events.
4. **Is someone trying to avoid logging?** — for example by calling older PowerShell versions that lack these features.

## analogy

A sealed letter in a foreign code:

- The **command line** is the envelope — you see it was sent, but the message is coded.
- PowerShell has to **decode** the letter to read it. **Script block logging** is a copy machine next to the reader that copies each page after decoding.
- **AMSI** is a security guard who reads each decoded page before it's acted on — and can stop it.

## how

### Step 1: From encoded command to readable script
1. A process starts: `powershell.exe -EncodedCommand JABjAGwAaQBlAG4AdAAg…` — unreadable.
2. PowerShell decodes the Base64 into a script.
3. With script block logging on, **4104** records the decoded script text.
4. AMSI passes the same content to Defender Antivirus before execution.

### Step 2: What to read in a 4104 event
- The **script text** (long scripts are split across several 4104 events — they share a script block ID).
- **URLs, IP addresses, file paths** inside the script.
- **Calls that download or run code**, such as web requests followed by invoking the content.
- Whether it's **expected admin automation** or something new.

### Step 3: Collecting the logs centrally
- The PowerShell Operational log is **not** part of the Windows Security event sets — collect it with a **data collection rule (DCR)** that includes that channel (it lands in the `Event` table in Sentinel).
- Defender for Endpoint records PowerShell activity too, including some commands (`DeviceEvents`, ActionType `PowerShellCommand`) and AMSI-based detections.

### Step 4: Mind the sensitive data
Logged scripts can contain **passwords or secrets**. Microsoft recommends **Protected Event Logging** (encrypting the log content) when using script block logging beyond diagnostics, and limiting who can read the logs.

## realWorld

An IT team enables script block logging on all servers by Group Policy and collects the Operational log into Sentinel. Most 4104 events come from known management scripts — patching, inventory, backups — run by service accounts from IT servers.

## securityExample

A process alert shows `powershell.exe -enc …` launched by Excel. The command line is unreadable. The analyst checks 4104 on the same host for the same minute:

- The decoded script downloads text from a newly registered domain.
- It then executes that downloaded content directly in memory.
- A second 4104 block shows it writing a Run key for persistence.

Now the analyst knows exactly which domain to block, which Run key to remove, and what to search for on other machines.

## normal

- 4104 events from known management scripts, service accounts and IT servers.
- Readable admin commands (Get-Service, Get-ChildItem) run interactively by admins.
- AMSI detections rare and matching known test files.

## suspicious

- Script blocks that **download and immediately execute** content.
- Heavy **obfuscation**: long Base64 strings, string concatenation, character replacement.
- PowerShell started by **Office, browsers or script hosts**.
- Attempts to start **PowerShell version 2**, which lacks modern logging and AMSI.
- Script content that **disables** security settings or logging.
- A sudden **drop** in 4104 volume from a busy server.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A signed inventory script run by svc-inventory nightly from the IT server |
| **Suspicious** | An encoded command started by Excel on a sales laptop |
| **Malicious** | The decoded 4104 shows it downloads and runs code from a 2-day-old domain and creates a Run key |

## abuse

Defensive view of PowerShell misuse:

| Technique (MITRE ATT&CK) | What defenders rely on |
|---|---|
| Command and Scripting Interpreter: PowerShell (T1059.001) | Script block logging, AMSI, EDR process trees |
| Obfuscated Files or Information (T1027) | Logging after decoding (4104), AMSI |
| Downgrade Attack (T1562.010) — forcing PowerShell v2 | Remove the Windows PowerShell 2.0 feature; alert on version-2 use |
| Impair Defenses: disabling logging | Monitor volume drops; Group Policy enforcement |

## evidence

- **4104** — decoded script block content.
- **4103** — module/pipeline details when module logging is enabled.
- **Transcripts** — text files when transcription is enabled.
- **4688 / DeviceProcessEvents** — PowerShell process starts and command lines.
- **Defender for Endpoint** — PowerShell command events and AMSI-based detections.

## where

| Evidence | Where |
|---|---|
| 4104 / 4103 | `Event` table (PowerShell Operational channel collected by a DCR) |
| PowerShell process starts | `DeviceProcessEvents`, `SecurityEvent` 4688 |
| PowerShell commands seen by EDR | `DeviceEvents` (ActionType `PowerShellCommand`) |
| AMSI / antivirus detections | Defender alerts; `DeviceEvents` |

## analyst

When PowerShell appears in an alert:

1. Read the **command line** — is it encoded or obfuscated?
2. Find the **4104** events for the same host and time — what does the decoded script do?
3. Extract **indicators**: domains, IPs, file paths, registry keys.
4. Check **what happened next**: downloads, new processes, persistence, connections.
5. **Search** other hosts for the same script content or indicators.

## microsoft

- **Windows PowerShell / PowerShell 7** — script block logging (4104), module logging (4103), transcription, Protected Event Logging.
- **AMSI** with **Microsoft Defender Antivirus** — scans scripts at run time.
- **Microsoft Defender for Endpoint** — PowerShell telemetry, AMSI-based detections, attack surface reduction rules (for example blocking obfuscated scripts).
- **Microsoft Sentinel** — collect the PowerShell Operational log with a data collection rule into the `Event` table.

## explainBack

Q: Why can 4104 show you more than the command line?
A: The command line may be encoded or obfuscated. PowerShell has to decode the script before running it, and script block logging records it at that point — so 4104 shows the real, readable script.

Q: What does AMSI do, in one sentence?
A: It lets scripting engines like PowerShell hand the decoded script to the antivirus just before it runs, so malicious scripts can be blocked even if they never touch the disk.

Q: Why should script block logs be protected?
A: Scripts can contain passwords and secrets. If an attacker can read the logs, they gain those secrets — so restrict access and consider Protected Event Logging.
