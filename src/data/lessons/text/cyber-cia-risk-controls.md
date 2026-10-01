## bridge

So far you have learned how computers, networks, Windows, Linux and identities work. This lesson gives you the **vocabulary security teams use to reason about all of them**: what we protect (the CIA triad), what can go wrong (threat, vulnerability, risk), and how we protect it (controls, defense in depth, Zero Trust).

Every later lesson — phishing, detections, incident response — uses these words. When an analyst says "this is high risk" or "that control failed", this is what they mean.

**Chain:** What we protect (confidentiality, integrity, availability) → what threatens it (threats exploit vulnerabilities) → how likely and how bad (risk) → what reduces it (controls in layers) → how we know a control failed (detection and evidence)

## what

### 1. The CIA triad — what security protects
Security protects three properties of information and systems:

| Property | Simple meaning | Example of a failure |
|---|---|---|
| **Confidentiality** | Only the right people can see it | Customer data leaked to the internet |
| **Integrity** | It stays correct and unaltered | An attacker changes bank details on an invoice |
| **Availability** | It works when needed | Ransomware makes file servers unusable |

> Every security incident damages at least one of the three. Naming which one helps you explain impact.

### 2. Threat, vulnerability and risk
- **[[threat|Threat]]** — something that could cause harm: a criminal group, a malicious insider, a storm, a careless mistake.
- **[[vulnerability|Vulnerability]]** — a weakness that a threat could use: an unpatched server, a weak password, no multifactor authentication (MFA).
- **[[risk|Risk]]** — the chance that a threat uses a vulnerability, combined with how bad the result would be.

A common shorthand: **risk = likelihood × impact**.

### 3. Controls — how we reduce risk
A **control** is anything that reduces risk. Controls are grouped two ways.

**By purpose (when they act):**
- **Preventive** — stop it happening (MFA, firewalls, patching).
- **Detective** — notice it happening (logs, alerts, a SOC).
- **Corrective** — fix it afterwards (restore from backup, reset a password).

**By type (what they are):**
- **Technical** — software and hardware (encryption, endpoint protection).
- **Administrative** — policies and processes (access reviews, training).
- **Physical** — locks, badges, cameras.

### 4. Defense in depth
**Defense in depth** means using **several layers of controls**, so that when one fails, another still protects you. No single control is perfect.

### 5. Least privilege and Zero Trust
- **[[least-privilege|Least privilege]]** — give each account only the access it needs, for only as long as it needs it.
- **[[zero-trust|Zero Trust]]** — never trust automatically because something is "inside the network". Verify every request explicitly, use least privilege, and **assume breach** (design as if an attacker is already inside).

## why

These ideas exist because security teams **can't protect everything equally**. Budgets, people and time are limited.

- The **CIA triad** tells you *what* is being harmed, so you can describe impact clearly.
- **Risk** tells you *what matters most*, so you fix the biggest problems first.
- **Control types** help you check that you can prevent, detect *and* recover — not just one of them.
- **Defense in depth** and **Zero Trust** exist because attackers eventually get past single defenses, and old "trusted internal network" designs let them roam freely once inside.

## name

- **CIA triad** — the first letters of Confidentiality, Integrity, Availability; "triad" means a group of three. (Nothing to do with the intelligence agency.)
- **Vulnerability** — from the Latin *vulnus*, "wound": a place where you can be hurt.
- **Defense in depth** — a military term: several lines of defense, so breaking one line does not win the battle.
- **Zero Trust** — trust is not given by default; it has to be earned for each request.

## problem

These ideas let an analyst answer practical questions:

1. **"How bad is this incident?"** — Which of confidentiality, integrity and availability was affected, and for how much data or how many systems?
2. **"Why did this get through?"** — Which preventive control failed or was missing?
3. **"Why didn't we notice sooner?"** — Which detective control was missing?
4. **"Can we recover?"** — Do corrective controls (backups, account resets) exist and work?
5. **"What should we fix first?"** — The highest risk, not the loudest alert.

## analogy

A house:

- **Confidentiality** — curtains and a locked diary. **Integrity** — nobody secretly edits your will. **Availability** — you can get in your front door.
- **Threat** — a burglar. **Vulnerability** — a window left open. **Risk** — how likely a burglar finds the window, times what they could take.
- **Controls** — a lock (preventive), an alarm and camera (detective), insurance and a spare key (corrective).
- **Defense in depth** — a locked gate, a locked door, *and* a safe for valuables.
- **Zero Trust** — even people already inside the house need a key for the safe.

## how

### Step 1: Describe impact with the CIA triad
For any incident, ask three questions:
1. Could someone **see** data they shouldn't? (confidentiality)
2. Could someone **change** data or systems? (integrity)
3. Was anything **unavailable**? (availability)

### Step 2: Estimate risk
1. **Likelihood** — is the vulnerability exposed to the internet? Is it being exploited in the wild?
2. **Impact** — what data or business process depends on the system?
3. Combine them: an internet-facing unpatched server holding customer data is **high likelihood and high impact**.

### Step 3: Layer controls
For an important asset, check that you have at least one control of each purpose:

| Purpose | Example for email accounts |
|---|---|
| Preventive | MFA, Conditional Access, phishing filtering |
| Detective | Sign-in logs, risky sign-in alerts, SOC monitoring |
| Corrective | Revoke sessions, reset password, restore deleted mail |

### Step 4: Apply Zero Trust principles
1. **Verify explicitly** — check identity, device health, location and risk for every request.
2. **Use least privilege** — just enough access, just in time.
3. **Assume breach** — segment networks, encrypt data, and monitor everything so an intruder is limited and noticed.

## realWorld

A small company relies on one control: a strong firewall. A user's password is stolen through phishing. The attacker signs in to cloud email from the internet — the firewall never sees it.

After the incident the company adds layers: MFA (preventive), sign-in alerts monitored by a SOC (detective), and a tested process to revoke sessions and reset accounts (corrective). The next stolen password is useless without the second factor, and the attempt is noticed.

## securityExample

An analyst writes the impact section of an incident report:

- **Confidentiality** — the attacker read 3 mailboxes for 2 hours. **Affected.**
- **Integrity** — the attacker created an inbox rule hiding replies from the finance team. **Affected.**
- **Availability** — no systems were taken offline. **Not affected.**

Root cause: a **vulnerability** (the account was excluded from MFA) was used by a **threat** (a password-spraying campaign). The missing **preventive** control is the main lesson learned; the **detective** control (sign-in alert) worked.

## normal

- Controls exist in all three purposes for important systems.
- Access is reviewed regularly; people have only what their job needs.
- Exceptions (an account excluded from MFA, a firewall rule open to the internet) are **documented, approved and time-limited**.
- Risk decisions are written down: "we accept this risk until the system is replaced in March".

## suspicious

- An important system with **only preventive controls** and no logging — you could not see an attack.
- **Exceptions that never expire** — old MFA exclusions, "temporary" admin rights from years ago.
- Accounts with **far more access** than their role needs.
- **Flat networks** where any computer can reach any other — no layers, no segmentation.
- Backups that have **never been tested** — a corrective control you cannot rely on.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A documented, approved MFA exclusion for a break-glass account, monitored by an alert |
| **Suspicious** | An MFA exclusion for a regular user that nobody can explain |
| **Confirmed malicious** | That excluded account signs in from an unknown country and creates an inbox forwarding rule |

## abuse

Defensive view — attackers look for the **weakest layer**, not the strongest:

| Weakness | How it is misused | What defenders do |
|---|---|---|
| Unpatched internet-facing system | Exploited for initial access | Patch fast; monitor exposure |
| Missing MFA | Stolen or guessed passwords work | Enforce MFA; alert on single-factor sign-ins |
| Excessive privileges | One compromised account reaches everything | Least privilege; privileged access reviews |
| No logging | Activity goes unnoticed | Collect and monitor the key log sources |
| Untested backups | Ransomware recovery fails | Test restores regularly |

## evidence

Controls themselves leave evidence:

- **Preventive controls** log what they blocked — failed sign-ins with MFA required, blocked emails, firewall denies.
- **Detective controls** produce alerts and incidents.
- **Corrective actions** appear in audit logs — password resets, session revocations, restores.
- **Configuration and exposure data** show where controls are missing — devices without updates, accounts without MFA.

## where

| Evidence | Where |
|---|---|
| Sign-ins with and without MFA | `SigninLogs` (column `AuthenticationRequirement`) |
| Device exposure and missing updates | `DeviceInfo` (`ExposureLevel`), Defender Vulnerability Management |
| Admin changes and resets | `AuditLogs` (Entra ID), Windows `SecurityEvent` |
| Alerts and incidents | `SecurityAlert`, `SecurityIncident` in Microsoft Sentinel |

## analyst

For every incident, an analyst can write three short lines:

1. **Impact:** which of C, I and A was affected, and how much.
2. **Control gap:** which preventive control failed or was missing, and which detective control caught it (or didn't).
3. **Recommendation:** the layer to add or fix so this exact path is blocked or noticed next time.

That turns a technical investigation into something managers can act on.

## microsoft

- **Microsoft Entra ID** — MFA and Conditional Access are preventive identity controls; sign-in logs are detective.
- **Microsoft Defender XDR** — detective and corrective controls across endpoints, email, identities and cloud apps (alerts, automated investigation, response actions).
- **Microsoft Sentinel** — the detective layer that collects logs from everything and raises incidents.
- **Microsoft Secure Score** and **exposure management** — measure which recommended preventive controls are missing.
- Microsoft's **Zero Trust** guidance describes the three principles: verify explicitly, use least privilege, assume breach.

## explainBack

Q: Explain threat, vulnerability and risk using a house.
A: The burglar is the threat. An open window is the vulnerability. Risk is how likely a burglar finds the open window, multiplied by how much they could take — a mansion with an open window is higher risk than a shed.

Q: Why isn't one very strong control enough?
A: Every control can fail or be bypassed. With several layers — prevent, detect, correct — an attacker who gets past one still meets another, and you notice and recover even when prevention fails.

Q: What does "assume breach" change about how you design security?
A: You stop relying on the network edge alone. You limit what any single account or device can reach, encrypt data, and monitor everything, so an attacker who is already inside can do less damage and is noticed quickly.
