## bridge

In **From event to incident** you learned how alerts become incidents. During an investigation you find specific clues — a file, an address, a domain. This lesson explains how SOCs describe those clues (**IOCs**), the behaviors around them (**IOAs**), and attackers' overall methods (**TTPs**) — and how one clue helps you find every other affected computer.

**Chain:** Incident → evidence found → indicator → search everywhere → scope → block → detection

## what

This lesson covers three related ideas. They answer three different questions.

### 1. IOC — Indicator of Compromise

An **[[ioc|IOC]]** is a specific piece of evidence that shows a system has been touched by known malicious activity.

It answers: **"Have we seen this known-bad thing?"**

Common types of IOC:

- A **file hash** — a unique fingerprint calculated from a file's contents. Two common types are SHA-1 (40 characters) and SHA-256 (64 characters).
- An **IP address** — e.g. `203.0.113.77`
- A **domain name** — e.g. `contoso-helpdesk.example`
- A **URL** — a specific web address.
- An **email sender** or subject line.
- A **file name or folder path**.

### 2. IOA — Indicator of Attack

An **[[ioa|IOA]]** describes a *behavior* that suggests an attack is happening right now — no matter which tool or file the attacker uses.

It answers: **"Is attack-like behavior happening?"**

- Example: *an Office application starts a scripting tool, which then connects to the internet.*

### 3. TTP — Tactics, Techniques and Procedures

**[[ttp|TTPs]]** describe *how* an attacker operates:

- **Tactics** — their goal (e.g. "steal passwords").
- **Techniques** — the method used to reach that goal.
- **Procedures** — the exact way a specific attacker carries it out.

It answers: **"How does this attacker work?"**

### Side by side

| | IOC | IOA | TTP |
|---|---|---|---|
| Describes | A specific *thing* | A *behavior* | An attacker's *methods* |
| Example | A domain name | Office app starting a script tool | Phishing → steal passwords → move to other computers |
| Strength | Precise, easy to automate | Works even when tools change | Guides what to detect and hunt |
| Weakness | Easy for attackers to change | More false alarms, needs tuning | Too broad to alert on directly |

## why

When an organization is attacked, its investigation finds facts such as:

> *"This file, downloaded from this server, connected to this domain."*

Other organizations want to know **immediately**: *did this happen to us too?*

The industry needed a short, shareable way to say *"look for this"*. **That is the IOC.**

Later, defenders noticed a problem: IOCs are **easy for attackers to change**. So the focus expanded to:

- **IOAs** — behaviors, which are harder to change.
- **TTPs** — the attacker's overall methods, which are hardest to change.

## name

- **Indicator** — a sign pointing at something.
- **Of Compromise** — the thing pointed at is a compromise that has *already happened*.

> That past tense matters. Classic IOCs are **forensic** — evidence *after* the fact.

- **Indicator of *Attack*** — the term was created to shift attention to activity *in progress*.
- **TTP** — borrowed from military doctrine, where "tactics, techniques and procedures" describe how a force operates.

## problem

Before shared indicators, every organization had to discover the same threats on its own.

IOCs solve three problems:

### Scoping
*"We found one bad file — which other computers have it?"*

### Sharing
One victim's findings can protect many others through **threat intelligence feeds** — regularly updated lists of known-bad indicators published by security vendors, governments and industry groups.

### Automation
Known-bad values can be **blocked** or **alerted on** automatically.

## how

### The IOC lifecycle

Here is how an IOC moves through a SOC, step by step:

1. **An incident occurs** — an alert fires and an analyst investigates.
2. **Evidence is found** — e.g. a file hash, an IP address or a domain.
3. **It is confirmed malicious** — not just unusual. It is now an *indicator*.
4. **The SOC searches everywhere** — every computer, mailbox and log for that indicator.
5. **The scope grows** — new matches reveal more affected users and devices.
6. **It is blocked** — e.g. added as a blocking indicator in Microsoft Defender for Endpoint.
7. **A detection is created** — so future matches alert automatically.
8. **It is reviewed and expired** — IP addresses get reassigned and domains get sold. Old IOCs cause false alarms.

> The most important step is **4**. An IOC's biggest value is answering: *"Where else is it?"*

## analogy

Think of a stolen car:

- **IOC** = the car's **license plate**. Every police officer can look for that exact plate. But a thief can swap plates in minutes.
- **IOA** = someone **trying every car door in a parking lot**. It doesn't matter what car they drive — the *behavior* gives them away.
- **TTP** = the thief's **known methods**: which neighborhoods, what time of night, which tools.

## realWorld

A government security advisory lists:

- 30 IP addresses
- 12 domains
- 8 file hashes

…all linked to one attack campaign.

A SOC imports them into **Microsoft Sentinel threat intelligence**. Built-in rules then automatically compare them against network, DNS and sign-in logs, and alert on any match.

## securityExample

During an investigation, you confirm that a malicious document:

- had a specific **file hash** (SHA-1), and
- connected to `updates-contoso-cdn.example`.

What you do next:

1. **Search** Advanced Hunting for that hash across **all** devices.
2. You find it on **three more laptops**. The incident just grew from one device to four.
3. **Block** the hash and the domain as indicators.
4. **Create a detection** for any future occurrence.

## normal

Most hashes, IPs and domains in your environment are **harmless**:

- Microsoft and other vendor **update servers**.
- **Content delivery networks** (CDNs) that serve websites.
- Everyday **cloud apps**.

Also normal:

- A signed, popular application's hash appearing on **thousands** of devices.
- **Cloud and shared hosting IPs** being used by many unrelated, legitimate customers.

## suspicious

These deserve a closer look:

- **A rare file** — a hash seen on only one or two devices, running from a Downloads or Temp folder.
- **A new look-alike domain** — registered days ago, with a name imitating a real brand.
- **A trusted threat-feed match** — an IP listed by a reputable feed, recently, with high confidence.
- **The same indicator across unrelated users** — appearing for several people who don't normally share activity.

> "Rare" is not the same as "malicious". It is a reason to look closer, not a verdict.

### Normal → suspicious → malicious, for an indicator

| | Example |
|---|---|
| **Normal** | A Microsoft update server IP contacted by 4,000 devices |
| **Suspicious** | A two-day-old look-alike domain contacted by 3 laptops |
| **Confirmed malicious** | The same domain appears in a high-confidence threat feed, the program that contacted it was an unsigned file in Downloads, and that file's hash matches a known malware sample |

## abuse

Defensive view: the key point is **how easily each type of indicator changes**.

- Changing even one byte of a file gives it a **new hash**.
- Moving to new servers gives **new IP addresses and domains**.

This is captured by the **[[pyramid-of-pain|Pyramid of Pain]]** (David Bianco). From easiest to hardest for an attacker to change:

1. Hash values *(easiest)*
2. IP addresses
3. Domain names
4. Network and host artifacts *(traces left on networks or computers, such as unusual file paths or user agents)*
5. Tools
6. TTPs *(hardest)*

> Defenders who rely only on IOCs are always one step behind. Durable detections focus on behavior.

## evidence

Each type of indicator shows up in different evidence:

| Indicator | Where it shows up |
|---|---|
| File hash | Process, file and image-load events from endpoints (in Microsoft Defender use **SHA-1** — the SHA-256 column there is usually empty) |
| IP address | Network connections, firewall logs, sign-in logs |
| Domain | DNS queries, proxy/web logs, URLs in emails |
| URL | Email URL data, proxy logs, Safe Links clicks |
| Email sender / subject | Email events |
| Behavior (IOA) | Process trees, sequences across several tables |

## where

Where to search in Microsoft tools:

**Endpoints** (Defender XDR Advanced Hunting)
- `DeviceProcessEvents`
- `DeviceFileEvents`
- `DeviceNetworkEvents`

**Identity**
- `SigninLogs` (Entra ID)
- `IdentityLogonEvents` (Defender for Identity)

**Email**
- `EmailEvents`
- `EmailUrlInfo`
- `EmailAttachmentInfo`

**Network and DNS**
- Firewall logs (`CommonSecurityLog`)
- DNS logs

**Threat intelligence in Sentinel**
- The threat intelligence tables filled by TI connectors.

## analyst

When you receive an IOC, follow these six steps:

1. **Validate** — is it really malicious? Check the source, its confidence level, its age, and whether it's shared infrastructure (like a CDN).
2. **Enrich** — look up its reputation, first-seen date and related indicators.
3. **Hunt** — search every relevant table over a sensible time window.
4. **Scope** — list every affected user, device and mailbox.
5. **Act** — block it, contain affected systems, create a detection.
6. **Pivot to behavior** — ask: *"What behavior led here?"* Then write an IOA-style detection that would catch it even with a new hash.

## microsoft

**Microsoft Defender for Endpoint**
- Supports custom **indicators**: file hashes, IP addresses, URLs/domains and certificates.
- Each can be set to allow, audit, warn or block.

**Microsoft Defender XDR**
- **Threat analytics** reports list indicators and TTPs for tracked threats.

**Microsoft Sentinel**
- Ingests threat indicators through threat intelligence connectors, including **STIX/TAXII** — STIX is a standard file format for describing threat intelligence, and TAXII is the standard way to send it between systems.
- Provides built-in rules that match indicators against your logs.

**Advanced Hunting**
- Lets you search for any indicator across endpoint, email and identity tables with KQL.

## explainBack

Q: Explain an IOC to someone without using the words "indicator" or "compromise".
A: It's a specific clue left behind by a known attack — like a file's fingerprint, a web address or an internet address. Once you know the clue, you can search every computer for it to find out where else the attack reached.

Q: Why do defenders also need IOAs and TTPs if they have IOCs?
A: Attackers can change files and addresses in minutes, so IOC lists go stale quickly. Behaviors (IOAs) and methods (TTPs) are much harder to change, so detections based on them keep working.

Q: You find a malicious file on one laptop. What is the single most useful thing its hash lets you do next?
A: Search all other devices for the same hash to see how far the problem spread — that's scoping the incident.
