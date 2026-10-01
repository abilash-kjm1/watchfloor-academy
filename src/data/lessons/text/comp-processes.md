## bridge

In **How a computer works** you learned that the operating system loads programs from storage into memory so the CPU can run them. In **Files, file systems, servers, VMs and cloud** you learned how programs are stored as files. The most important records an analyst reads describe those **programs running**.

This lesson explains what a running program is, how one program starts another, and why "which program did this, and who started it?" is the first question in almost every computer investigation.

## what

This lesson covers four related ideas. Learn them one at a time — each builds on the one before.

### 1. Program

A **program** is a file stored on disk that contains instructions.

- Example: `C:\Windows\System32\notepad.exe`
- While it sits on disk, it does nothing. It is like a recipe in a book.

### 2. Process

A **[[process|process]]** is a program that is *currently running*.

When you open Notepad, Windows reads `notepad.exe` from disk and starts it. That running copy is a process.

Every process has its own:

- **Memory** — a private area of RAM that holds its data.
- **Process ID (PID)** — a number that identifies it, such as `4120`.
- **User account** — the account it runs as, such as `alex.morgan` or `SYSTEM`.
- **Command line** — the exact text used to start it, including any options.

> One program can run as many processes at the same time. Open Notepad three times and you get three processes, each with its own PID — but only one `notepad.exe` file.

### 3. Thread

A **thread** is a single line of work happening *inside* a process.

- A process has at least one thread.
- A web browser might use many threads: one to draw the page, one to download, one to play video.
- As a SOC analyst you rarely investigate threads directly. You mostly work at the **process** level.

### 4. Service

A **[[service|service]]** is a process that the operating system starts and manages in the background.

- Services usually start when the computer boots, **before anyone logs in**.
- They have no window — you don't see them on the screen.
- Examples: Windows Update, the print spooler, Microsoft Defender Antivirus.

### Putting it together

| Term | What it is | Example |
|---|---|---|
| Program | A file on disk | `notepad.exe` sitting in System32 |
| Process | A running copy of a program | Notepad open on screen, PID 4120 |
| Thread | Work happening inside a process | The part of the browser downloading a file |
| Service | A background process managed by the OS | Windows Update running at boot |

> **Technical definition:** a process is an operating-system-managed container for a running program. It holds the program's memory, its security identity (the account and privileges it runs with), its open files and network connections, and one or more threads.

### 5. Two command-line tools you will see constantly

Most people use Windows by clicking. Windows also lets you control it by **typing commands**. Two programs do this:

**cmd.exe — Command Prompt**
- The classic Windows command window.
- You type a command, such as `ipconfig`, and it runs.

**powershell.exe — PowerShell**
- A more powerful command-line tool and scripting language built into Windows.
- **Scripts** are text files containing a list of commands to run automatically.

**Why they exist:** IT administrators manage hundreds of computers. Typing one command, or running one script, is much faster than clicking through screens on every machine.

**Why security cares:** because these tools can do almost anything on a computer, attackers like to use them too. That's why a PowerShell process is not bad by itself — but **who started it, and what it was asked to do**, matters a lot.

### 6. Other words used in this lesson

**SYSTEM**
- A built-in Windows account with the highest privileges on a computer. Windows itself and many services run as SYSTEM.

**Registry**
- A built-in Windows database of settings — for example, which programs start automatically when you log in.

**Digital signature (publisher)**
- A tamper-proof "stamp" that software companies add to their programs. It proves who made the file and that it hasn't been changed. `notepad.exe` is signed by Microsoft.

**File hash**
- A short fingerprint calculated from a file's contents. The same file always produces the same hash; changing even one byte produces a completely different hash.

**EDR (Endpoint Detection and Response)**
- Security software on each computer that records what happens (programs starting, files, connections), detects attacks and lets analysts respond. Microsoft's EDR is **Microsoft Defender for Endpoint**.

## why

A computer runs hundreds of things at once: your browser, your email, antivirus, updates, and the operating system itself.

The operating system needs a way to keep them **separate and safe**:

- One program must not be able to read another program's memory.
- One crashing program must not crash everything else.
- Each program must run with only the permissions of its user.

The **process** is the boundary that makes this possible. Each process gets its own memory and its own permissions.

> For defenders, this is a gift: every action on a computer is done **by a process**, running **as a user account**. That means every action can be traced back to *what* did it and *who* it ran as.

## name

- **Process** — as in *a procedure being carried out*. The program is the recipe; the process is the cooking happening right now.
- **Thread** — like a thread of activity running through a piece of work.
- **Service** — because it *serves* other programs and users, quietly, in the background.
- **Parent / child** — because processes start other processes, like a family tree (explained in the next section).

## problem

Without processes, a security analyst could not answer the most basic question:

**"What did this?"**

Processes give us attribution:

1. A file was written → *which process* wrote it?
2. A network connection was made → *which process* made it?
3. A setting was changed → *which process* changed it, and *as which user*?

The parent–child relationship (next section) adds an even more important question:

**"Why did this start?"**

## how

### Step 1: Quick recap of the building blocks

From **How a computer works**:

- The **CPU** executes instructions.
- **RAM** holds running programs (processes) and their data — and is wiped at power-off.
- **Storage** holds program files long-term.
- The **operating system** manages all three and decides what each program may do.

### Step 2: Kernel space and user space

The operating system is split into two privilege levels:

- **[[kernel|Kernel]]** — the core of the OS. It controls memory, hardware and every process. It has **full privileges**.
- **[[user-space|User space]]** — where normal applications run (browser, Office, Notepad). They have **limited privileges**.

When an application needs something sensitive (open a file, use the network), it **asks the kernel**, and the kernel decides.

> Why analysts care: something running at kernel level can hide from security tools. Kernel-level compromise is far more serious than a misbehaving application.

### Step 3: How a process starts

Here is what happens when you double-click Notepad:

1. You double-click the icon.
2. `explorer.exe` (the Windows desktop process) asks the OS to start `notepad.exe`.
3. The OS creates a new process and records:
  - the program path
  - the command line
  - the **parent process** (`explorer.exe`)
  - the user account
  - the start time
4. Notepad appears on screen.

### Step 4: Parents and the process tree

Every process — except the very first ones started at boot — is started by **another process**.

- The process that starts another is the **[[parent-process|parent]]**.
- The process that gets started is the **child**.

If you follow parents backwards, you get a **process tree**:

```
explorer.exe            ← parent (the user's desktop)
 └─ OUTLOOK.EXE         ← child: the user opened Outlook
     └─ msedge.exe      ← grandchild: the user clicked a link in an email
```

> The process tree answers "why did this start?" A browser started by Outlook makes sense. A command shell started by a spreadsheet is unusual and worth a closer look.

### Step 5: How services start

Services are started by a special manager, not by a user:

- On **Windows**: the Service Control Manager, `services.exe`.
- On **Linux**: usually `systemd`.

That is why on Windows you see many `svchost.exe` processes whose parent is `services.exe`.

## analogy

Think of a concert hall:

- The **program** is the sheet music sitting on a shelf.
- The **process** is an orchestra performing that music right now.
- The **threads** are the individual musicians playing at the same time.
- The **parent process** is whoever booked the performance.
- The **user account** is the name on the booking.
- A **service** is the house band that plays every night, whether or not anyone booked it.

## realWorld

Here are normal process trees you will see thousands of times:

**Opening Outlook**
```
explorer.exe → OUTLOOK.EXE
```

**Clicking a link inside an email**
```
OUTLOOK.EXE → msedge.exe
```

**Windows Update running in the background**
```
services.exe → svchost.exe
```

None of these are suspicious. Learning them first is what lets you spot the ones that are.

## securityExample

Security products pay close attention to **unusual parent–child pairs**.

Consider this tree:

```
OUTLOOK.EXE → EXCEL.EXE → powershell.exe
```

Read it step by step:

1. Outlook started Excel → the user opened an attachment. **Normal.**
2. Excel started PowerShell → a spreadsheet launched a scripting tool. **Unusual** for most users.

> The specific file may be brand new and unknown to antivirus. But the *relationship* between the processes is suspicious — and that is what EDR products (Endpoint Detection and Response) alert on.

## normal

### Normal parent–child pairs

| Parent | Child | Why it's normal |
|---|---|---|
| `explorer.exe` | Outlook, Edge, Excel | The user started them from the desktop |
| `services.exe` | `svchost.exe` | Windows hosts its services inside svchost |
| `wininit.exe` | `services.exe`, `lsass.exe` | Core processes started at boot |
| Software deployment agent | PowerShell running a company script | IT automation |

### Normal locations

- Windows system programs live in `C:\Windows\System32`.
- Installed applications live in `C:\Program Files` or `C:\Program Files (x86)`.

### Important Windows processes to recognize

| Process | What it normally does | Normal parent |
|---|---|---|
| `explorer.exe` | The desktop, taskbar and file windows — the user's session | `userinit.exe` (at logon) |
| `svchost.exe` | Hosts many Windows services | `services.exe` |
| `services.exe` | Starts and manages services | `wininit.exe` |
| `lsass.exe` | Checks passwords and manages sign-in secrets | `wininit.exe` |
| `winlogon.exe` | Handles the sign-in screen and Ctrl+Alt+Del | `smss.exe` |
| `cmd.exe` | Command Prompt | Usually `explorer.exe` or an admin tool |
| `powershell.exe` | PowerShell command line and scripts | Usually `explorer.exe`, an admin tool, or IT management software |
| `rundll32.exe` | Runs code stored in Windows library files (DLLs) | Many legitimate parents |
| `mshta.exe` | Runs HTML Application (`.hta`) files | Rarely used in modern business work |

> `lsass.exe` matters especially: because it handles passwords, any unusual program **reading its memory** is a high-priority alert in most SOCs.

## suspicious

Look for these warning signs:

- **Office or PDF apps starting command tools**
  - e.g. Word, Excel or a PDF reader starting `cmd.exe` or `powershell.exe`.
- **A system name in the wrong folder**
  - The real `svchost.exe` lives in `C:\Windows\System32` and is started by `services.exe`.
  - An `svchost.exe` in a user's `AppData` folder is not the real one.
- **Programs running from temporary or download folders**
  - e.g. `Downloads`, `Temp`, `AppData`, especially if the file is unsigned.
- **Long or scrambled command lines**
  - e.g. very long encoded text after the program name.
- **Unexpected privilege**
  - A process running as `SYSTEM` that a normal user appears to have started.

> "Unusual" is not the same as "malicious". It is a reason to investigate, not a verdict.

### Normal → suspicious → malicious

| | Example | What decides it |
|---|---|---|
| **Normal** | IT software runs PowerShell with a known company script at 04:00 on every laptop | Matches a known, approved pattern |
| **Suspicious** | Excel starts PowerShell on one finance laptop | Unusual relationship — needs investigation |
| **Confirmed malicious** | That PowerShell then downloads an unknown file, which connects to an address on a threat list, and the user says they only opened an invoice | Several pieces of evidence agree, with no business explanation |

## abuse

This is the defensive view — what to watch for, not how to do it.

Attackers try to **blend in** with normal processes:

- **Using tools already on the computer** (often called "living off the land"), such as PowerShell, because they look like normal admin activity.
- **Naming files after real system processes**, hoping an analyst only reads the name.
- **Starting from unexpected parents**, such as an Office document launching a script.

That is why analysts never judge a process by its name alone. Always check four things:

1. **Parent** — who started it?
2. **Path** — where is the file?
3. **Publisher** — is it signed, and by whom?
4. **Command line** — what options was it started with?

## evidence

When a process starts, the operating system and security tools can record:

- The program **path** (e.g. `C:\Windows\System32\cmd.exe`)
- The full **command line**
- The **parent process**
- The **user account**
- The **process ID** and parent process ID
- The **file hash** (a fingerprint of the file — recorded by EDR tools; Microsoft Defender reliably records the SHA-1 hash)
- The **start time**

When a **service** is installed, Windows records that too.

## where

| Evidence | Where it appears |
|---|---|
| Process creation (Windows built-in) | Security log, **Event 4688** — only if process auditing is enabled. Command line needs an extra policy setting. |
| Process creation (Sysmon) | **Sysmon Event 1** — Sysmon is a free Microsoft tool that records detailed process activity, if it is installed |
| Process creation (Microsoft Defender) | **`DeviceProcessEvents`** table in Advanced Hunting — always includes parent and command line |
| New service installed | System log, **Event 7045** |

## analyst

For any alert on a computer, build the process tree and question each link.

### Step 1: Build the tree

Write it out: **grandparent → parent → process → children**.

### Step 2: Check each link

For every process ask:

- Is this parent–child pair **normal for this user** and this device?
- Is the file in the **right location**?
- Is it **signed** by a trusted publisher?
- Does the **command line** make sense?

### Step 3: Look at what happened next

- Did it create **files**?
- Did it make **network connections**?
- Did it change **settings or registry**?

### Step 4: Check the scope

Did the same process or tree appear on **other devices**?

> In Microsoft Defender for Endpoint, the **device timeline** shows all of this in order, and every alert includes a **process tree**.

## microsoft

- **Defender for Endpoint** shows a **process tree** inside every alert and incident.
- The **device timeline** lets you scroll through every event before and after the alert.
- In **Advanced Hunting**, the `DeviceProcessEvents` table includes:
  - `FileName` — the process
  - `ProcessCommandLine` — its command line
  - `InitiatingProcessFileName` — **the parent**
  - `AccountName` — the user

## explainBack

Q: Explain what a process is without using the word "process".
A: When you open a program, the computer loads its instructions from disk into memory and starts running them. That running copy has its own memory, a number that identifies it, a user account it acts as, and the command that started it. The file on disk is just the recipe; this is the cooking happening right now.

Q: Why does it matter which program started another program?
A: Because the relationship tells you *why* something happened. A browser started by Outlook means someone clicked a link — normal. A command tool started by a spreadsheet is unusual for most people and is worth investigating, even if both programs are legitimate.

Q: PowerShell is a normal Windows tool. So why do security teams watch it so closely?
A: It can do almost anything on a computer, which is why admins use it — and why attackers like it too. So analysts look at the context: who started it, from where, as which user, and what command it ran.
