## bridge

In the Active Directory lesson you learned that domain controllers (DCs) handle every domain sign-in and directory lookup, and that attackers who reach a DC control the company. In the Defender XDR lessons you saw endpoint and email alerts. **Microsoft Defender for Identity (MDI)** is the part of Defender XDR that **watches Active Directory itself** — the Kerberos, NTLM and LDAP traffic and events on your identity servers — and turns suspicious patterns into alerts.

**Chain:** Sensors on domain controllers → observe authentication and directory traffic → learn normal behavior → raise identity alerts by attack stage → Defender XDR incident with endpoint and email context → `Identity*` tables for hunting → contain the account

## what

### 1. Defender for Identity
**Defender for Identity** is a cloud-based security service that uses **sensors installed on your on-premises identity servers** to detect attacks against Active Directory. Its alerts appear as Defender XDR incidents alongside endpoint, email and cloud-app alerts.

### 2. Where the sensors go
- **Domain controllers** — every one, so no sign-in or lookup is missed.
- **Active Directory Federation Services (AD FS)** and **Active Directory Certificate Services (AD CS)** servers.
- **Microsoft Entra Connect** servers that synchronize identities to the cloud.

A sensor reads the server's **network traffic** for identity protocols and its **Windows events**, then sends findings to the cloud service.

### 3. What it detects — by attack stage
| Stage | Example alerts (simplified names) | What it noticed |
|---|---|---|
| Reconnaissance | Account enumeration; security principal reconnaissance (LDAP); network-mapping (DNS) reconnaissance | Someone listing users, groups, admins or hosts |
| Credential access | Suspected brute force; suspected Kerberos service-ticket requests for cracking (Kerberoasting) | Password guessing; requests aimed at offline cracking |
| Lateral movement | Suspected pass-the-hash / pass-the-ticket | Stolen credentials reused on other machines |
| Domain dominance | Suspected DCSync (directory replication); suspected Golden Ticket usage | Requests only a DC should make; forged tickets |

### 4. More than alerts
- **Identity security posture assessments** — misconfigurations such as accounts with passwords that never expire, weak encryption, risky delegation (shown in Secure Score and Exposure Management).
- **Lateral movement paths** — how an attacker could chain admin sessions to reach a sensitive account.
- **Response actions** — disable a user in AD, or force a password reset, directly from Defender.

## why

Before tools like MDI, attacks on Active Directory were hard to see:

- DC logs are **huge** — millions of Kerberos events a day — and most reconnaissance looks like normal lookups.
- Many attacks **use valid credentials and legitimate protocols**, so antivirus sees nothing.
- The **most dangerous attacks** (DCSync, forged tickets) only make sense if you understand Kerberos and replication deeply.

MDI exists to **learn what is normal** for each account and machine, and to recognize the specific protocol patterns that real AD attacks produce — so a SOC analyst doesn't have to be a Kerberos expert to notice them.

## name

- **Defender for Identity** — it *defends* your *identity* infrastructure. It replaced an older product called **Azure Advanced Threat Protection** (and before that, Microsoft Advanced Threat Analytics), so you'll still see "ATP" in older articles.
- **Sensor** — like a smoke detector: it senses and reports, it doesn't put the fire out.
- **Lateral movement path** — the *path* an attacker could take moving *sideways* from machine to machine.

## problem

MDI helps an analyst answer:

1. **Is someone mapping our directory?** — reconnaissance alerts.
2. **Are passwords or tickets being attacked or stolen?** — credential-access alerts.
3. **Is a stolen credential being reused elsewhere?** — lateral movement alerts.
4. **Is the domain itself at risk?** — domain dominance alerts.
5. **Which sensitive accounts could an attacker reach from here?** — lateral movement paths.

## analogy

A bank vault room:

- **Active Directory** — the vault holding every key in the building.
- **Domain controllers** — the guards who hand out keys.
- **MDI sensors** — cameras and microphones at every guard post, plus an experienced supervisor who knows each employee's habits.
- **Reconnaissance alert** — someone asking every guard for the full list of who holds which keys.
- **DCSync alert** — someone wearing a guard's uniform asking another guard for a copy of the whole key register.
- **Lateral movement path** — "if a thief steals the cleaner's key, it opens the office where the manager leaves his keys…"

## how

### Step 1: Collection
1. The sensor on each DC captures **identity protocol traffic** (Kerberos, NTLM, LDAP, DNS, remote procedure calls) and reads relevant **Windows events**.
2. It parses them into activities: "account X requested a ticket for service Y from computer Z".
3. Activities go to the MDI cloud service, which **profiles** normal behavior per account and device.

### Step 2: Detection
Detections combine **known attack patterns** (e.g. a replication request from a non-DC computer) with **behavior** (e.g. an account suddenly querying hundreds of user objects it never touched before).

### Step 3: Investigation in Defender XDR
An MDI alert shows:
- the **source computer** and **account**;
- the **targets** (users, groups, DCs);
- a timeline of the **activities** that triggered it;
- links to related **endpoint** alerts on the source computer.

Because Defender XDR merges alerts into incidents, you often see the full story: a phishing email → malware on a laptop → reconnaissance from that laptop (MDI) → lateral movement.

### Step 4: Response
| Action | Effect |
|---|---|
| **Disable user in Active Directory** | Stops new sign-ins with that account (needs an MDI action account configured) |
| **Reset user password** | Forces a new password at next sign-in |
| **Isolate the source device** (Defender for Endpoint) | Cuts the attacker's foothold from the network |
| **Revoke cloud sessions** (Entra ID) | For hybrid accounts, ends cloud sessions too |

## realWorld

After deployment, an MDI tenant typically shows:

- **Posture recommendations** within days: old service accounts with non-expiring passwords, accounts allowing weak encryption, unmonitored DCs without sensors.
- Occasional **reconnaissance alerts** from IT tools and vulnerability scanners that legitimately query AD — tuned with exclusions after review.
- Very rare high-severity alerts — which is exactly why each one deserves immediate attention.

## securityExample

Defender XDR incident: *"Multi-stage incident involving initial access and discovery"*.

1. A user on `LAPTOP-07` opened a malicious attachment (Defender for Endpoint alert).
2. Thirty minutes later, MDI raises **"Security principal reconnaissance (LDAP)"** — `LAPTOP-07` queried all members of Domain Admins and all service accounts.
3. Ten minutes after that: **"Suspected Kerberos SPN exposure"** — the same account requested service tickets for 40 service accounts.

The analyst sees an attacker moving from a laptop foothold toward privileged credentials. Actions: isolate `LAPTOP-07`, disable and reset the user's account, reset passwords of the service accounts whose tickets were requested (prioritizing those with weak passwords), and hunt for any sign-ins by those service accounts from unusual machines.

## normal

- Domain-joined computers making steady Kerberos and LDAP requests as people work.
- IT management tools, backup software and vulnerability scanners **querying AD in bulk** on schedules.
- Admins signing in to DCs from **privileged access workstations**.
- A few low-severity alerts from known tools, tuned after review.

## suspicious

- **Reconnaissance from ordinary user workstations** — especially queries for admin groups or all service accounts.
- **Many service-ticket requests** from one account in a short time.
- **Replication requests from a computer that is not a DC**.
- Sign-ins using a **forged or anomalous Kerberos ticket**.
- Credentials used on **many machines** shortly after a single compromise.
- A DC **without a healthy sensor** — a blind spot.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | The vulnerability scanner enumerates all users every Sunday at 03:00 |
| **Suspicious** | A marketing laptop enumerates all members of Domain Admins on a Tuesday afternoon |
| **Confirmed malicious** | The same laptop then requests service tickets for 40 service accounts, and one of those accounts signs in to a DC an hour later |

## abuse

Defensive mapping of common Active Directory attacks to MDI coverage:

| Attack (MITRE ATT&CK name) | Plain description | How MDI helps |
|---|---|---|
| Account Discovery: Domain Account | Listing domain users and groups | Reconnaissance alerts |
| Steal or Forge Kerberos Tickets: Kerberoasting | Requesting tickets to crack service-account passwords | SPN exposure alerts; posture checks for weak encryption |
| Use Alternate Authentication Material: Pass the Hash / Pass the Ticket | Reusing stolen credential material | Lateral movement alerts |
| OS Credential Dumping: DCSync | Requesting password data via replication | DCSync alerts |
| Steal or Forge Kerberos Tickets: Golden Ticket | Forged tickets signed with the krbtgt secret | Forged-ticket alerts; krbtgt posture checks |

## evidence

- **Identity activities** — sign-ins (Kerberos, NTLM), directory queries, directory changes — as structured events.
- **Alerts** with source, targets and activity timelines.
- **Posture assessments** — configuration weaknesses.
- **Lateral movement path** graphs for sensitive accounts.

## where

| Evidence | Where |
|---|---|
| Domain sign-ins (protocol, source device, result) | `IdentityLogonEvents` |
| Directory lookups (LDAP, SAMR, DNS queries) | `IdentityQueryEvents` |
| Directory changes (group membership, password resets, account changes) | `IdentityDirectoryEvents` |
| Alerts and evidence | `AlertInfo`, `AlertEvidence` (`ServiceSource == "Microsoft Defender for Identity"`) |
| Incidents | Defender XDR incident queue; `SecurityIncident` in Sentinel when connected |

## analyst

For any MDI alert:

1. **Source:** which computer and account started it? Is that machine already in another alert?
2. **Targets:** which users, groups or DCs were touched? Are any privileged or sensitive?
3. **Legitimacy:** is the source a known tool (scanner, backup, IT management)? Check with the owner before tuning.
4. **Progression:** did reconnaissance lead to credential access or lateral movement?
5. **Containment:** disable or reset accounts, isolate the source device, reset targeted service-account passwords — and for domain dominance alerts, escalate immediately.

## microsoft

- **Microsoft Defender for Identity** — sensors, alerts, posture assessments, lateral movement paths, AD response actions.
- **Microsoft Defender XDR** — merges identity alerts with endpoint, email and cloud alerts; automatic attack disruption can contain compromised accounts.
- **Advanced Hunting** — `IdentityLogonEvents`, `IdentityQueryEvents`, `IdentityDirectoryEvents`.
- **Microsoft Sentinel** — receives MDI incidents and alerts through the Defender XDR connector, alongside domain controller `SecurityEvent` logs.

## explainBack

Q: Why do Defender for Identity sensors go on domain controllers rather than laptops?
A: Every domain sign-in and directory lookup passes through the DCs, so sensors there see the whole company's identity activity — including attacks that never touch a laptop's antivirus.

Q: Why is a replication request from a normal computer so serious?
A: Replication is how DCs share the directory — including password data. Only DCs should ask for it. A normal computer asking means someone is trying to copy credentials for every account (DCSync).

Q: A reconnaissance alert comes from the IT vulnerability scanner. What do you do?
A: Confirm with the scanner's owner that the timing and scope match its schedule, then create a narrow exclusion for that scanner and that alert type — not a broad exclusion that would hide real reconnaissance from other machines.
