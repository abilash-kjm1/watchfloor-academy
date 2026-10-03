## bridge

In **Start here** you learned that analysts investigate *records of what happened on computers*. Before you can read those records, you need to know what is inside a computer and how its parts work together.

This lesson explains the four core parts — **CPU, memory, storage and the operating system** — and, for each one, **why a SOC analyst cares**.

**Chain:** Hardware (CPU, memory, storage) → operating system (kernel + user mode) → programs run → actions leave evidence

## what

A computer has four core parts. Learn them one at a time.

### 1. CPU — Central Processing Unit
**Simple:** the "brain" that carries out instructions, one tiny step at a time, billions of times per second.

**Technical:** the CPU fetches instructions from memory, executes them, and writes results back. Modern CPUs have several **cores**, so they can work on several things at once.

**Why security cares:**
- Unusually **high CPU use** that nobody can explain can mean unwanted software is running — for example, a hidden cryptocurrency miner (MITRE calls this *Resource Hijacking*).
- CPUs enforce **privilege levels** (kernel vs user mode — see section 4), the foundation of operating-system security.

### 2. Memory (RAM — Random Access Memory)
**Simple:** the computer's **short-term workspace**. Programs and the data they're using are loaded here while they run.

**Technical:** RAM is fast but **volatile** — its contents disappear when the power goes off.

**Why security cares:**
- Running programs keep **sensitive data in memory** — including, at times, sign-in secrets. That's why reading another program's memory (for example the memory of `lsass.exe`, which handles sign-ins) is treated as a serious alert.
- Some malicious code runs **only in memory** without saving a file to disk ("fileless" activity), which is harder to find with file scanning alone.
- Because RAM is wiped at power-off, **switching off a compromised computer can destroy evidence**. Response teams decide carefully before shutting down.

### 3. Storage (disk)
**Simple:** the computer's **long-term memory** — files stay there when the power is off.

**Technical:** storage is either a **hard disk drive (HDD)** with spinning platters or a **solid-state drive (SSD)** using flash chips. Storage is slower than RAM but **non-volatile** (it keeps data without power).

**Why security cares:**
- Malware that wants to **survive a reboot** must write something to storage (a file, a setting, a scheduled task).
- **Ransomware** attacks storage directly by encrypting files so they can't be opened.
- Deleted files are often **not instantly erased** — investigators can sometimes recover them, and attackers sometimes try to wipe them.
- **Disk encryption** (BitLocker on Windows) protects data if a laptop is stolen.

### 4. Operating system (OS)
**Simple:** the **manager** of the computer. It shares the CPU, memory and storage between all programs, and provides the screens, files and network you use. Examples: **Windows**, **Linux**, **macOS**.

**Technical:** the OS is split into two privilege levels:

**Kernel (kernel mode)**
- The core of the OS. It controls hardware, memory and every process, with **full privileges**.
- **Drivers** (software that controls hardware such as network cards) also run here.

**User space (user mode)**
- Where normal applications run — your browser, Office, Notepad — with **limited privileges**.
- When an application needs something sensitive (open a file, send network data), it asks the kernel through a **system call**, and the kernel decides whether to allow it.

> The CPU itself enforces this split, so a normal application can't simply take over the hardware.

### Putting it together

| Part | Simple description | Keeps data without power? | Security relevance |
|---|---|---|---|
| CPU | Does the work | — | Unexplained high use; enforces privilege levels |
| RAM | Short-term workspace | No (volatile) | In-memory threats; secrets in memory; evidence lost at power-off |
| Storage | Long-term memory | Yes | Persistence; ransomware; recoverable deleted files; encryption |
| OS | The manager | — | Kernel vs user mode; updates fix vulnerabilities |

## why

A computer needs all four parts because they do different jobs:

- The **CPU** is fast at computing but holds almost nothing.
- **RAM** holds what's in use right now, very quickly — but forgets everything at power-off.
- **Storage** remembers everything long-term — but is slower.
- The **OS** coordinates them, so that many programs can share one machine **safely**.

The OS's privilege split exists for safety: if any program could control the hardware directly, one buggy or malicious program could crash or take over the whole computer.

## name

- **Central Processing Unit** — the *central* unit that *processes* instructions.
- **Random Access Memory** — any location ("random") can be read directly, as fast as any other.
- **Volatile** — from the Latin for "flying"; volatile memory's contents "fly away" without power.
- **Kernel** — the *core* of a nut or seed; the core of the OS.
- **Operating system** — the system that *operates* the computer for everything else.

## problem

Knowing these parts lets an analyst answer practical questions:

1. **"Can I just switch it off?"** — Not without thinking: RAM evidence will be lost.
2. **"Why does this alert matter?"** — Because a program read another program's memory, or loaded a driver into the kernel.
3. **"How did the attacker survive a reboot?"** — They wrote something to storage.
4. **"Why must we install updates?"** — Updates fix OS vulnerabilities that attackers use to jump from user mode to kernel-level control.

## analogy

A restaurant kitchen:

- **CPU** — the chef, cooking very fast.
- **RAM** — the countertop: ingredients in use right now. Clean it at closing time and everything on it is gone.
- **Storage** — the pantry and fridge: everything kept long-term.
- **Operating system** — the kitchen manager deciding who uses which station.
- **Kernel mode** — the manager's office with the keys to everything; **user mode** — the cooks, who must ask the manager for anything outside their station.

## how

### Step 1: What happens when you open a program

1. You double-click an icon.
2. The OS reads the program file from **storage**.
3. It loads the program's instructions into **RAM** and creates a **process** (next lessons).
4. The **CPU** starts executing those instructions.
5. When the program needs a file or the network, it makes a **system call** — it asks the **kernel**.
6. The kernel checks permissions and does the work.

### Step 2: How privilege levels protect the system

- Applications run in **user mode**: they can't touch hardware or other programs' memory directly.
- The **kernel** runs in **kernel mode** with full access.
- Moving from user-level control to kernel-level or admin-level control is called **privilege escalation** — a key goal in many attacks, often achieved by exploiting a vulnerability in the OS or a driver.

### Step 3: Why updates matter

The OS and drivers are large programs, so they contain bugs. Some bugs are **vulnerabilities** an attacker could use. Updates ([[patch|patches]]) fix them, which is why "missing updates" appears as a risk in security tools.

### Step 4: Where each part shows up in investigations

| Part | Investigation question | Typical evidence |
|---|---|---|
| CPU | What is using all the processing power? | Process lists; performance data |
| RAM | What was running, and did anything read sensitive memory? | EDR alerts; memory capture during response |
| Storage | What files were created, changed or encrypted? | File events; disk forensics |
| OS / kernel | Was a driver loaded? Is the OS up to date? | Driver-load events; OS version inventory |

## realWorld

A help-desk ticket: "My laptop fan is always loud and it's very slow."

1. IT opens Task Manager: one unfamiliar process uses **95% CPU** around the clock.
2. Its file sits in a user's [[appdata|AppData]] folder and isn't [[digital-signature|signed]].
3. The security team identifies it as a cryptocurrency miner — the attacker was using the company's **CPU** to make money.

A hardware symptom was the first clue to a security problem.

## securityExample

An alert: *"Suspicious access to [[lsass|LSASS]] memory"* on a workstation.

- `lsass.exe` is the Windows process that handles sign-ins, so its **memory** can contain credential material.
- A program reading that memory is behaving like a credential-stealing tool.
- The responder **isolates** the computer but does **not switch it off** — powering down would erase the RAM evidence and the EDR still needs to collect data.
- Then they check which **accounts** had signed in to that computer, because their credentials may be at risk.

## normal

- CPU use that rises and falls with what the user is doing.
- Memory filling up as more programs open, and freeing up when they close.
- Storage changes from normal work: documents saved, updates installed.
- Windows and drivers updated regularly; devices running supported OS versions.

## suspicious

- **Sustained high CPU** from an unknown or unsigned process.
- A program **reading the memory of another process** — especially `lsass.exe`.
- **Many files rewritten in a short time**, often with new extensions — the shape of ransomware.
- **New drivers** loaded that aren't from known hardware vendors.
- Devices running **outdated, unsupported OS versions**.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | CPU at 90% while a user exports a large video |
| **Suspicious** | CPU at 95% all night from an unsigned process in AppData |
| **Confirmed malicious** | That process connects to a known mining pool and was installed by a script nobody in IT recognizes |

## abuse

This is the defensive view — what to watch for, not how to do it.

| Part | How attackers misuse it | What defenders watch |
|---|---|---|
| CPU | Hidden cryptocurrency mining (*Resource Hijacking*) | Unexplained high CPU; unknown processes |
| RAM | Reading sign-in secrets from memory; running code only in memory | Memory-access alerts; script and process behavior |
| Storage | Ransomware encryption; hiding files; persistence | Mass file changes; new autostart entries |
| Kernel | Malicious or vulnerable drivers that hide activity (*rootkits*); exploiting OS bugs to gain full control | Driver loads; up-to-date patching |

## evidence

- **Process and performance data** — which programs used CPU and memory.
- **Memory-access events** recorded by EDR (e.g. a process opening `lsass.exe`).
- **File events** — creations, modifications, renames, deletions on storage.
- **Driver-load events** — drivers entering the kernel.
- **Device inventory** — OS version, patch level, disk encryption status.

## where

| Evidence | Where |
|---|---|
| Process activity, memory-access alerts | Microsoft Defender for Endpoint alerts and `DeviceProcessEvents` |
| File changes on storage | `DeviceFileEvents` |
| Other security events, including some driver and memory-related events | `DeviceEvents` |
| OS versions, onboarding and sensor health | `DeviceInfo` |
| Missing updates and weak settings | Defender Vulnerability Management |

## analyst

Questions to ask about any affected computer:

1. **What is running?** (CPU and memory — processes)
2. **What changed on disk?** (storage — files, autostart entries)
3. **Did anything touch the kernel?** (drivers, privilege escalation)
4. **Is the OS current?** (missing updates the attacker could use)
5. **Should it stay on?** — Usually **isolate, don't power off**, so memory evidence and remote investigation stay available.

## microsoft

- **Microsoft Defender for Endpoint** records process, file and device events and raises alerts on behaviors such as suspicious memory access.
- **Microsoft Defender Vulnerability Management** (part of Defender for Endpoint) shows OS versions, missing updates and exposure.
- **BitLocker** encrypts Windows storage.
- **Advanced Hunting** — `DeviceInfo` (OS and health), `DeviceProcessEvents` (processes), `DeviceFileEvents` (storage changes).

## explainBack

Q: Explain the difference between RAM and storage using a desk and a filing cabinet.
A: RAM is the desk: what you're working on right now, quick to reach, but cleared every night. Storage is the filing cabinet: slower to get things from, but everything stays there until you remove it.

Q: Why might a responder isolate a compromised computer instead of switching it off?
A: Switching off wipes the memory, which may hold evidence of what was running. Isolation stops the attacker using the computer's network while keeping it on, so the security tools can still collect evidence remotely.

Q: In your own words, why does the operating system split itself into kernel mode and user mode?
A: So that ordinary programs can't directly control the hardware or other programs. They have to ask the core of the system, which checks permissions first. That way one bad program can't take over the whole computer — unless it finds a bug that lets it break through.
