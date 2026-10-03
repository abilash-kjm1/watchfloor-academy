## bridge

You have learned how Windows organizes users, processes and event logs. Most web servers, cloud workloads, containers and network appliances run **Linux** instead. The ideas are the same — users, permissions, processes, services, logs — but the names and places are different.

This lesson teaches the Linux version of each idea, and where its evidence ends up in Microsoft Sentinel.

**Chain:** Linux users and groups → file permissions and root → processes and systemd services → syslog and the journal → Syslog via the Azure Monitor Agent (AMA) → the `Syslog` table in Sentinel

## what

### 1. Linux in one sentence
**Linux** is a free, open-source operating system family. Popular versions ("distributions") include **Ubuntu**, **Debian**, **Red Hat Enterprise Linux (RHEL)** and **Amazon Linux**. Most are run without a desktop, managed through a text terminal — often remotely over **[[ssh|SSH (Secure Shell)]]**, an encrypted remote-login protocol on TCP port 22.

### 2. Users and groups
- Every user has a name and a number, the **UID (user ID)**. Accounts are listed in `/etc/passwd`.
- Password hashes are stored separately in `/etc/shadow`, readable only by root.
- **root** (UID 0) is the all-powerful administrator — like a Windows administrator and SYSTEM combined.
- Groups are listed in `/etc/group`. Members of the **sudo** group (Debian/Ubuntu) or **wheel** group (Red Hat family) may run commands as root.

### 3. sudo — borrowing root for one command
Instead of logging in as root, administrators run `sudo <command>`. sudo checks the rules in `/etc/sudoers`, asks for the user's own password, runs the command as root, and **logs it**. This gives accountability: you can see *who* used admin rights and *for what*.

### 4. File permissions
Every file has an **owner**, a **group**, and three sets of permissions:

| Who | r (read) | w (write) | x (execute) |
|---|---|---|---|
| Owner | ✓ | ✓ | ✓ |
| Group | ✓ | — | ✓ |
| Others | ✓ | — | ✓ |

`ls -l` shows this as `-rwxr-xr-x`. The number form (`chmod 755`) means the same thing.

A special **SUID** bit makes a program run with its *owner's* privileges — for example `passwd` runs as root so users can change their own password. Unexpected SUID programs are a classic privilege-escalation risk.

### 5. Processes and services
- Every running program is a **process** with a **process ID (PID)**. `ps aux` lists them.
- **PID 1** is **systemd**, which starts everything else.
- Long-running background programs (web server, SSH server) are **services**, called **units** in systemd. `systemctl status sshd` shows one.
- **cron** runs commands on a schedule (the Linux equivalent of Windows scheduled tasks).

### 6. Logs
- Programs send log messages to **syslog**. Each message has a **facility** (which part of the system: `auth`, `authpriv`, `cron`, `daemon`, `kern`…) and a **severity** from 0 (emergency) to 7 (debug).
- Many systems also keep the **systemd journal**, read with `journalctl`.
- Sign-in and sudo messages go to `/var/log/auth.log` (Debian/Ubuntu) or `/var/log/secure` (Red Hat family).

## why

Linux security works this way for historical and practical reasons:

- **Multi-user from the start** — Linux descends from Unix, built for many people sharing one machine, so users, groups and permissions are central.
- **Root is separate** so that everyday work can't accidentally (or maliciously) damage the system.
- **sudo** exists so several administrators can share admin power without sharing the root password — and each action is attributed to a person.
- **syslog** exists so that every program can log in one standard way, and logs can be forwarded to a central server — which is exactly what a SIEM (security information and event management system) needs.

## name

- **Linux** — named after its creator, Linus Torvalds, plus "Unix".
- **root** — the account at the *root* of the file system tree (`/`).
- **sudo** — "**s**uper**u**ser **do**": do this one thing as the superuser.
- **daemon** — an old computing word for a background helper process; many service names end in **d** (`sshd`, `systemd`).
- **cron** — from Chronos, the Greek god of time.
- **syslog** — "system log".

## problem

Knowing Linux lets an analyst answer:

1. **Who signed in, from where?** — SSH accept and failure messages in the auth log.
2. **Who used admin rights?** — sudo log lines show the user, the target user and the exact command.
3. **What is running and listening?** — processes and services; `ss -tulpn` shows listening ports.
4. **How would an attacker survive a reboot?** — cron jobs, new systemd services, added SSH keys.
5. **Are we even collecting this?** — whether the Linux server sends syslog to Sentinel.

## analogy

An apartment building:

- **root** — the building manager with a master key.
- **sudo** — a resident borrowing the master key from the front desk for one job, and the desk writes down who took it, when and why.
- **File permissions** — each flat's door: owner can enter; family (group) may enter; visitors (others) maybe only look through the window.
- **systemd** — the caretaker who starts the lifts, heating and lights each morning.
- **cron** — the timed sprinklers and bin collection.
- **syslog** — the front desk's logbook, copied each night to head office (the SIEM).

## how

### Step 1: An SSH sign-in, step by step
1. A client connects to TCP port 22 on the server.
2. The SSH service (`sshd`) checks the key or password.
3. Success or failure is written to the auth log with the user, source IP and port:
   - `Accepted publickey for alex from 198.51.100.20 port 50122 ssh2`
   - `Failed password for invalid user admin from 203.0.113.5 port 52314 ssh2`
4. A session starts as that user, with that user's permissions.

### Step 2: How sudo is recorded
When `alex` runs `sudo apt update`, a line like this is logged:

```
alex : TTY=pts/0 ; PWD=/home/alex ; USER=root ; COMMAND=/usr/bin/apt update
```

Read it as: **who** (alex) ran **what** (`/usr/bin/apt update`) **as whom** (root), from **where** (terminal pts/0, folder /home/alex).

### Step 3: Reading permissions
`-rwsr-xr-x 1 root root /usr/bin/passwd`
- First character `-` = regular file (`d` would be a folder).
- `rws` = owner (root) can read, write, and the `s` means SUID.
- `r-x` = group can read and run; `r-x` = everyone else can read and run.

### Step 4: Getting Linux logs into Sentinel
1. Install the **Azure Monitor Agent (AMA)** on the Linux server (or on a central Linux log forwarder).
2. Create a **data collection rule (DCR)** that chooses facilities (for example `auth`, `authpriv`, `cron`) and a minimum severity.
3. Messages arrive in the **`Syslog`** table. Security appliances that send **Common Event Format (CEF)** messages arrive in **`CommonSecurityLog`** instead.

### Useful commands (read-only)

| Command | Shows | Analyst question |
|---|---|---|
| `who`, `last` | Who is / was logged in | Who was on this server? |
| `ps aux` | All processes | What is running, as which user? |
| `ss -tulpn` | Listening ports and their processes | What is exposed to the network? |
| `systemctl list-units --type=service` | Services | Is there a service nobody recognizes? |
| `crontab -l`, `ls /etc/cron.d` | Scheduled jobs | Is something set to run repeatedly? |
| `journalctl -u ssh` | Service log | What did SSH record? |
| `grep "Failed password" /var/log/auth.log` | Failed sign-ins | Is someone guessing passwords? |

## realWorld

A company runs its website on three Ubuntu virtual machines in Azure. Each sends `auth` and `authpriv` syslog through AMA to Sentinel.

On a normal day the logs show: admins signing in with SSH keys from the company VPN (virtual private network), occasional `sudo apt upgrade` commands during patch windows, and constant failed password attempts from the internet against port 22 — background noise that every internet-facing SSH server receives.

## securityExample

Sentinel shows thousands of `Failed password` messages against `web-02` from one IP. That alone is common internet noise. Then the analyst sees:

1. `Accepted password for deploy from 203.0.113.5` — the same IP **succeeded** once.
2. Two minutes later: `deploy : USER=root ; COMMAND=/usr/bin/crontab -e` — the account edited the root schedule.
3. A new outbound connection appears from `web-02` to an unknown server.

The successful sign-in after many failures, followed by admin activity and persistence, turns noise into a real incident: isolate the server, preserve evidence, remove the cron job and the access path, and disable password login for SSH.

## normal

- Many **failed SSH attempts** from the internet against an exposed port 22 (noise — but it shows the server is exposed).
- Admins signing in with **SSH keys** from known networks, at expected times.
- `sudo` used by a **small, known group** for routine tasks (updates, restarting services).
- Stable services and cron jobs that match the server's purpose.

## suspicious

- A **successful sign-in from an IP that just produced many failures**.
- **Password** sign-ins on servers meant to use keys only.
- `sudo` used by an account that **never** used it before, or for unusual commands (editing users, cron, SSH keys, downloading files).
- **New cron jobs or systemd services** created outside a change window.
- A new key added to a user's `~/.ssh/authorized_keys`.
- New **SUID** files, or programs running from `/tmp` or `/dev/shm`.
- **Gaps in logging** — a server that stops sending syslog.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | 2,000 failed SSH logins a day from random internet IPs, zero successes |
| **Suspicious** | One success for the `deploy` account from an IP that failed 300 times |
| **Confirmed malicious** | That session runs sudo to add a cron job that downloads and runs a file every 5 minutes |

## abuse

Defensive view — how Linux features are misused and what to watch:

| Feature | Misuse | What defenders watch |
|---|---|---|
| SSH | Password guessing; stolen keys | Failures then success; password logins; new source IPs |
| sudo | Using a compromised admin account | Unusual sudo users and commands |
| cron / systemd | Persistence that survives reboots | New jobs and units; changes outside change windows |
| SSH authorized_keys | Adding the attacker's key as a back door | File changes to `authorized_keys` |
| SUID binaries | Privilege escalation | New or unexpected SUID files |
| Logging | Stopping or wiping logs to hide | Hosts that go silent; cleared log files |

## evidence

- **Auth log / journal** — SSH accepts and failures, sudo commands, user and group changes.
- **cron and systemd messages** — jobs and services starting.
- **Process and file activity** — recorded by an endpoint detection and response (EDR) tool such as Defender for Endpoint on Linux.
- **Network connections** — which process connected where.
- **Silence** — when a host stops logging, the absence is itself evidence.

## where

| Evidence | Where |
|---|---|
| SSH and sudo messages | `Syslog` table (facilities `auth` / `authpriv`), via AMA and a DCR |
| Firewall and appliance logs in CEF | `CommonSecurityLog` |
| Process, file and network activity | `DeviceProcessEvents`, `DeviceFileEvents`, `DeviceNetworkEvents` (Defender for Endpoint on Linux) |
| Device inventory (which hosts are Linux) | `DeviceInfo` (`OSPlatform`) |

## analyst

For a suspicious Linux host, work through:

1. **Access:** who signed in, how (key or password), from where? Any success after many failures?
2. **Privilege:** which accounts used sudo, and for what commands?
3. **Persistence:** new cron jobs, systemd units, SSH keys, startup scripts?
4. **Activity:** unusual processes (especially from `/tmp`), new listening ports, unexpected outbound connections?
5. **Visibility:** is the host still logging? When did logs stop?

Always convert times to UTC (Coordinated Universal Time) when lining up Linux logs with other sources — servers may log in local time.

## microsoft

- **Microsoft Sentinel — Syslog via AMA** connector: collects Linux syslog into the `Syslog` table, configured with a data collection rule.
- **Common Event Format (CEF) via AMA**: a Linux log forwarder receives appliance logs and sends them to `CommonSecurityLog`.
- **Microsoft Defender for Endpoint on Linux**: EDR for Linux servers, feeding the same Advanced Hunting tables as Windows devices.
- **Microsoft Defender for Cloud** (Defender for Servers): protects Linux virtual machines in Azure and other clouds.

## explainBack

Q: Explain sudo to someone who only knows Windows.
A: It's like right-clicking "Run as administrator" for one command, except it checks a rules file to see if you're allowed, asks for your own password, and writes down who ran which command as admin — so admin actions are always attributable to a person.

Q: Why is "many failed SSH logins" usually noise, but "one success after many failures" important?
A: Every internet-facing SSH server gets constant guessing attempts, so failures alone mostly show exposure. A success from the same source means a guess may have worked — the attacker could now be inside with that account's permissions.

Q: Name three places a Linux attacker might hide something to survive a reboot.
A: A cron job, a new systemd service, or an extra key in a user's authorized_keys file (shell startup scripts are another).
