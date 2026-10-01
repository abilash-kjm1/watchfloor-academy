## bridge

You have learned about Windows users, permissions and the Security event log on **one** computer. Real companies have thousands of computers and users. They can't create every account on every machine — so they use **Active Directory (AD)**, a central directory that every Windows computer trusts.

AD is still at the heart of most corporate networks, and of most serious attacks against them. After this lesson, Microsoft Entra ID (the cloud directory) will make more sense, because many companies run both and synchronize them.

**Chain:** Domain and domain controllers → users, groups and computers as objects → Kerberos and NTLM sign-ins → privileged groups and Group Policy → events on domain controllers → Defender for Identity and Sentinel

## what

### 1. Active Directory and the domain
**Active Directory Domain Services** — usually just **Active Directory (AD)** — is Microsoft's on-premises directory: a database of **users, groups, computers and policies** for an organization.

A **domain** (for example `corp.contoso.com`) is the boundary of one AD database. Computers that are **domain-joined** trust it for sign-ins.

### 2. Domain controllers
A **domain controller (DC)** is a server that holds a copy of the AD database and answers sign-in requests. Companies run several DCs that **replicate** changes to each other, so one failing does not stop sign-ins.

> Whoever controls a domain controller controls every account in the domain. DCs are the most valuable servers in most companies.

### 3. Objects, OUs and Group Policy
- Everything in AD is an **object**: a user, a group, a computer.
- **Organizational units (OUs)** are folders that organize objects (for example `Sales`, `Servers`).
- **Group Policy Objects (GPOs)** push settings to computers and users in an OU — password rules, firewall settings, software, scripts.

### 4. How sign-ins work: Kerberos and NTLM
- **[[kerberos|Kerberos]]** — the default. You prove your password once to the DC and receive **tickets** that you show to each service. Your password is not sent across the network.
- **[[ntlm|NTLM]] (NT LAN Manager)** — an older challenge-response method, still used when Kerberos can't be (for example when connecting by IP address instead of name).
- **LDAP (Lightweight Directory Access Protocol)** — the protocol programs use to **look things up** in the directory: "which groups is Alex in?"

### 5. Privileged groups
Some groups hold enormous power:

| Group | Power |
|---|---|
| **Domain Admins** | Full control of the domain and every domain-joined computer |
| **Enterprise Admins** | Full control of every domain in the forest |
| **Schema Admins** | Can change the structure of AD itself |
| **Administrators** (on DCs) | Full control of domain controllers |
| **Account Operators**, **Backup Operators** | Less obvious, but can be used to gain more control |

## why

AD exists because managing accounts **machine by machine** doesn't scale:

- One account per person works on **every** company computer.
- Leavers are disabled **once**, everywhere.
- Group membership grants access to file shares, applications and servers centrally.
- Group Policy enforces security settings across thousands of machines.

Kerberos exists so passwords don't travel across the network for every service. NTLM still exists for **backward compatibility** with old systems.

## name

- **Directory** — like a phone directory: a central list of who and what exists.
- **Domain** — an area of control, like a kingdom's domain.
- **Domain controller** — the server that *controls* (authenticates for) the domain.
- **Kerberos** — named after Cerberus, the three-headed dog guarding the underworld; the three heads are the client, the service and the trusted ticket server.
- **NTLM** — **NT LAN Manager**: from Windows NT and the older LAN (local area network) Manager product.

## problem

Knowing AD lets an analyst answer:

1. **Who signed in where?** — DCs record domain sign-ins for the whole company, not just one machine.
2. **Who gained admin power?** — changes to Domain Admins and other privileged groups.
3. **Who changed security settings?** — Group Policy and directory object changes.
4. **Is someone mapping our network?** — unusual volumes of directory lookups.
5. **How far could this compromised account reach?** — its groups and what those groups can access.

## analogy

A large office building:

- **AD** — the building's central security office and staff register.
- **Domain controller** — the security desk that issues badges; there are several desks, all sharing the same register.
- **Kerberos** — you show ID once at the desk and get a **day badge (ticket-granting ticket)**. To enter each room, you show the badge at the desk to get a **room pass (service ticket)**. You never hand your ID to the room.
- **NTLM** — an older system where each room phones the desk to check your answer to a challenge question.
- **Domain Admins** — the master-key holders. Add someone to that list and they can open every door.
- **Group Policy** — building-wide rules posted to every floor at once.

## how

### Step 1: A Kerberos sign-in, simplified
1. **Sign in:** you type your password on a domain-joined laptop.
2. **Ticket-granting ticket (TGT):** the laptop proves your identity to the DC's **Key Distribution Center** and receives a TGT, signed with the secret of a special account called **krbtgt**. *(DC event 4768.)*
3. **Service ticket:** to open a file share, the laptop shows the TGT and asks for a ticket for that service. *(DC event 4769.)*
4. **Access:** the file server accepts the service ticket and checks your group memberships for permission. *(Event 4624 on the file server.)*

Kerberos uses **TCP/UDP port 88** on the DC.

### Step 2: NTLM, simplified
1. The server sends a random **challenge**.
2. The client answers using a value derived from the password hash.
3. The DC confirms the answer is right. *(DC event 4776.)*

NTLM is weaker than Kerberos: it doesn't verify the server's identity, and a stolen password hash can be replayed ("pass-the-hash").

### Step 3: How group changes are recorded
When someone adds a user to a group, the DC logs:

| Event ID | Meaning |
|---|---|
| **4728** | Member added to a security-enabled **global** group (e.g. Domain Admins) |
| **4732** | Member added to a security-enabled **local** group (e.g. Administrators) |
| **4756** | Member added to a security-enabled **universal** group (e.g. Enterprise Admins) |
| **4720** | A user account was created |
| **5136** | A directory object was modified (needs directory service auditing — used for GPO changes) |

### Step 4: Hybrid identity
Most companies also use the cloud. **Microsoft Entra Connect** synchronizes AD users and groups to Microsoft Entra ID, so people use one identity for both. That means a compromised AD account can often reach cloud services too — and vice versa.

## realWorld

A typical Monday morning on the DCs:

- Thousands of **4768/4769** events as people sign in and open file shares, email and printers.
- Some **4625** failures from mistyped passwords.
- An IT ticket: "add Priya to the Finance-Share group" — one **4728** event, matching a change request.
- No changes at all to Domain Admins — these should be rare and planned.

## securityExample

At 23:40 UTC, the DC logs event **4728**: the account `svc-backup` added `jsmith` to **Domain Admins**. There is no change ticket.

The analyst checks:
1. **Who is `svc-backup`?** A service account that should only run backups — it should never manage groups.
2. **Where did the change come from?** A workstation in Sales, not an IT admin machine.
3. **What happened next?** `jsmith` signs in to two DCs within ten minutes.

A service account making privileged group changes from a user workstation, at night, without a ticket, is treated as a likely domain compromise: remove the membership, disable both accounts, isolate the workstation, and escalate immediately.

## normal

- Very high volumes of Kerberos ticket events — this is how the company works.
- Privileged group changes that are **rare**, done by **known admins**, from **admin workstations**, with a **change ticket**.
- NTLM from a known set of older systems.
- Group Policy changes during planned maintenance.

## suspicious

- **Any unplanned change to privileged groups** (4728/4732/4756 on Domain Admins, Enterprise Admins, Administrators).
- **Service accounts behaving like people** — interactive sign-ins, group changes.
- One account requesting **service tickets for many different services** in a short time.
- **NTLM sign-ins** from systems that normally use Kerberos.
- A non-DC computer **requesting directory replication** — something only DCs should do.
- **Bursts of directory queries** (LDAP lookups of all users, groups or admins) from a normal workstation.
- New or edited GPOs outside change windows.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | IT admin adds a new hire to Sales-Users with a ticket |
| **Suspicious** | A workstation enumerates every member of Domain Admins via LDAP at 02:00 |
| **Confirmed malicious** | Shortly after, a service account adds a regular user to Domain Admins, who then signs in to a DC |

## abuse

Defensive view of common AD attack techniques — what they are and what detects them:

| Technique (MITRE name) | In plain words | What defenders watch |
|---|---|---|
| Account discovery | Listing users, groups and admins | Unusual LDAP or Security Account Manager Remote (SAMR) query volumes (Defender for Identity) |
| Kerberoasting | Requesting service tickets to crack service-account passwords offline | Many 4769 requests from one account; weak (RC4) encryption types |
| Pass-the-hash | Reusing a stolen password hash with NTLM | Unusual NTLM sign-ins; one account on many machines |
| DCSync | Pretending to be a DC to request password data | Replication requests from non-DC computers |
| Account manipulation | Adding accounts to privileged groups | 4728/4732/4756 on privileged groups |
| Group Policy modification | Pushing malicious settings or scripts to many computers | 5136 changes on GPOs; new startup scripts |

## evidence

- **Domain controller Security log** — 4768, 4769, 4771 (Kerberos pre-authentication failed), 4776 (NTLM validation), 4624/4625, group and account changes.
- **Directory change events** — 5136 when directory service auditing is configured.
- **Network-level observation of DC traffic** — Kerberos, NTLM, LDAP and replication, as seen by Defender for Identity's sensor on each DC.
- **Endpoint evidence** on the machines involved — processes, logons, connections.

## where

| Evidence | Where |
|---|---|
| DC security events | `SecurityEvent` in Sentinel (Windows Security Events via AMA on the DCs) |
| Domain sign-ins (Kerberos, NTLM) | `IdentityLogonEvents` (Defender for Identity) |
| Directory lookups (LDAP, SAMR) | `IdentityQueryEvents` |
| Group and account changes | `IdentityDirectoryEvents`, plus `SecurityEvent` 4728/4732/4756 |
| Identity alerts | Defender XDR incidents, `AlertInfo` / `AlertEvidence` |

## analyst

For any suspected AD compromise:

1. **Which accounts are involved,** and are any of them privileged or service accounts?
2. **What changed?** Privileged groups, new accounts, GPOs.
3. **Where did it come from?** Which workstation or server initiated the action?
4. **What else did that source do?** Directory queries, ticket requests, sign-ins to DCs.
5. **What is the blast radius?** Every system the account can reach through its groups — and, in hybrid setups, the cloud.

Treat changes to Domain Admins like a fire alarm: verify immediately, even at night.

## microsoft

- **Active Directory Domain Services** — the on-premises directory.
- **Microsoft Defender for Identity** — sensors on DCs observe Kerberos, NTLM, LDAP and replication traffic and raise identity alerts (account discovery, Kerberoasting, DCSync and more). Data appears in `IdentityLogonEvents`, `IdentityQueryEvents` and `IdentityDirectoryEvents`.
- **Microsoft Sentinel** — collects DC Security events through Windows Security Events via AMA (Azure Monitor Agent).
- **Microsoft Entra Connect** — synchronizes AD identities to Microsoft Entra ID for hybrid sign-in.

## explainBack

Q: Explain a Kerberos ticket-granting ticket using a theme park.
A: You show your ID once at the entrance and get a wristband (the TGT). For each ride you show the wristband to get a ride pass (a service ticket). You never hand your ID to the ride operators — and the wristband expires at the end of the day.

Q: Why is a change to Domain Admins more urgent than a change to Sales-Users?
A: Domain Admins can control every account and computer in the domain. An unauthorized member there can do anything — create accounts, push malware through Group Policy, read every mailbox — so it must be checked immediately.

Q: Why do analysts care when NTLM appears where Kerberos is expected?
A: NTLM is the older, weaker method, and stolen password hashes can be replayed with it. Unexpected NTLM can be a sign of misconfiguration — or of someone using stolen hashes to move between machines.
