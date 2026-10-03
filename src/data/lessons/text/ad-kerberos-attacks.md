## bridge

In the Active Directory lesson you learned how Kerberos works: a ticket-granting ticket (TGT) from the domain controller, then service tickets for each resource. Because Kerberos is how almost every corporate sign-in works, attackers have studied its weak spots closely.

This lesson explains — from the defender's side — the Kerberos attacks SOC analysts hear about most: **Kerberoasting**, **AS-REP roasting**, **Golden Tickets** and **delegation abuse**: what each is, why it works, and the evidence it leaves.

**Chain:** Kerberos issues tickets → some tickets are encrypted with an account's password-derived key → attackers request tickets to crack offline, or forge tickets with stolen keys → domain controllers log ticket requests (4768, 4769) → Defender for Identity spots abnormal patterns → defenders fix weak service accounts and protect the krbtgt key

## what

### 1. Kerberoasting
Any authenticated domain user can request a **service ticket** for any service account that has a **[[spn|service principal name (SPN)]]**. Part of that ticket is encrypted with a key derived from the **service account's password**. An attacker can request tickets and try to **crack the password offline** — no failed logons, no lockouts.
- **Most at risk:** service accounts with **weak or old passwords**, especially where tickets use the older **RC4** encryption.
- **Evidence:** many **4769** (service ticket requested) events from one account in a short time, often with RC4 encryption type (`0x17`).

### 2. AS-REP roasting
Normally Kerberos requires **pre-authentication** — proving you know the password before the DC hands out a TGT response. If an account has **"Do not require Kerberos pre-authentication"** set, anyone can request its authentication response and try to crack it offline.
- **Most at risk:** accounts with pre-authentication disabled (rarely needed).
- **Evidence:** **4768** (TGT requested) events for those accounts, with pre-authentication type 0.

### 3. Golden Ticket
TGTs are signed with the key of a special account called **krbtgt**. An attacker who has stolen that key (usually after already gaining domain admin rights, e.g. through DCSync) can **forge TGTs** for any user, with any group memberships, valid for as long as they like.
- **Evidence:** often hard to see in normal logs; **Defender for Identity** detects forged-ticket anomalies. The fix requires **resetting the krbtgt password twice**.

### 4. Delegation abuse
**Delegation** lets a service act on behalf of users (e.g. a web server accessing a database as the user). **Unconstrained delegation** is risky: a server with it can collect users' TGTs — including admins' — and reuse them.
- **Defense:** avoid unconstrained delegation; use constrained or resource-based constrained delegation; mark sensitive accounts as "cannot be delegated" or add them to **Protected Users**.

## why

These attacks exist because of **design trade-offs**:
- Kerberos lets any user request service tickets so services can be found and used without extra configuration — which also lets attackers collect tickets.
- Pre-authentication can be disabled for very old compatibility needs.
- The krbtgt key must be trusted completely for single sign-on to work — so stealing it breaks that trust.
- Delegation exists so multi-tier applications work for users.

Defenders can't remove Kerberos — they **reduce the weaknesses** (strong service account passwords, AES encryption, no unnecessary pre-auth exceptions or unconstrained delegation) and **watch for the patterns**.

## name

- **Kerberoasting** — "roasting" (cracking) Kerberos service tickets offline.
- **AS-REP roasting** — roasting the **AS-REP** (Authentication Service Reply), the DC's answer to a TGT request.
- **Golden Ticket** — a forged TGT that opens every door, like a golden master key.
- **Delegation** — a service *delegated* to act for a user.

## problem

Understanding these attacks lets an analyst answer:

1. **Is someone harvesting service tickets?** (Kerberoasting)
2. **Which accounts could be roasted without any password guessing?** (AS-REP-roastable and weak service accounts)
3. **Could an attacker be using forged tickets?** (Golden Ticket — usually after domain compromise)
4. **Which servers could capture admins' credentials?** (unconstrained delegation)
5. **What should we fix first?** Posture recommendations in Defender for Identity.

## analogy

A theme park with wristbands:

- **Kerberoasting** — anyone with a day pass can ask for a ride token for any ride. Each token is stamped with that ride operator's secret code; an attacker collects tokens and works out weak codes at home.
- **AS-REP roasting** — a few staff members' badges are handed out without showing ID; anyone can take one home and study it.
- **Golden Ticket** — someone stole the stamp that makes wristbands. They can print their own, for anyone, valid forever — until the park changes the stamp (twice, to be sure).
- **Unconstrained delegation** — a ride operator who keeps a copy of every visitor's wristband.

## how

### Step 1: Kerberoasting, as evidence
1. An attacker on a compromised workstation lists accounts with SPNs (an LDAP query — seen by Defender for Identity).
2. They request service tickets for many of them → many **4769** events from one account in minutes.
3. Cracking happens **offline** — no further events on your network.
4. If a password is cracked, the service account later signs in somewhere unusual.

### Step 2: AS-REP roasting, as evidence
1. Accounts with pre-authentication disabled are found (LDAP).
2. TGT requests for them → **4768** with pre-authentication type 0.
3. Offline cracking; later, unusual sign-ins by those accounts.

### Step 3: Golden Ticket, as evidence
- Requires the krbtgt key — so look first for how domain admin rights or replication rights were gained (DCSync alerts).
- Forged tickets can have **unusual lifetimes**, group memberships or appear **without a matching TGT request (4768)** on any DC. Defender for Identity flags suspected Golden Ticket usage.

### Step 4: Prevention
| Weakness | Fix |
|---|---|
| Weak service account passwords | Long random passwords; **group managed service accounts (gMSA)** that rotate automatically |
| RC4 Kerberos encryption | Require AES where possible |
| Pre-authentication disabled | Re-enable it unless absolutely needed |
| Unconstrained delegation | Remove it; use constrained delegation; Protected Users |
| krbtgt compromise | Reset krbtgt twice (carefully, with replication between resets) |

## realWorld

Domain controllers log thousands of 4769 events every hour as people open file shares, email and printers. A typical user requests tickets for a handful of services. Defender for Identity posture reports usually list a few old service accounts with SPNs and never-expiring passwords — the first things to fix.

## securityExample

Defender for Identity alerts: *Suspected Kerberos SPN exposure*. The analyst checks DC events:

- At 14:12, account `mkt-jdoe` on `MKT-LAP-07` requested **service tickets for 38 accounts in 90 seconds**, most with RC4 encryption.
- Two hours later, `svc-reporting` (one of the 38) signs in to a finance server it has never used.

The password of `svc-reporting` was probably cracked offline. Response: reset `svc-reporting` (and the other 37 service accounts, starting with the most privileged), convert them to gMSAs where possible, investigate `MKT-LAP-07`, and require AES encryption.

## normal

- Users requesting tickets for a few services they use daily.
- Service accounts with long, random or managed passwords.
- No accounts with pre-authentication disabled (or a documented few).
- Delegation limited to specific, constrained configurations.

## suspicious

- **One account requesting many service tickets** in minutes, especially with **RC4**.
- **4768** with pre-authentication type 0 for accounts that shouldn't have it disabled.
- **Service accounts signing in interactively** or to unusual machines.
- Kerberos activity from a **non-domain-controller** acting like a DC (replication).
- Tickets with **abnormal lifetimes** or no matching TGT request.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A user requests tickets for the file server, Exchange and a printer |
| **Suspicious** | One workstation requests RC4 tickets for 38 service accounts in 90 seconds |
| **Malicious** | One of those service accounts then signs in to a finance server from that workstation |

## abuse

Defensive mapping:

| Technique (MITRE ATT&CK) | Detection | Prevention |
|---|---|---|
| Steal or Forge Kerberos Tickets: Kerberoasting (T1558.003) | 4769 bursts, RC4; MDI alerts | gMSA, long passwords, AES |
| Steal or Forge Kerberos Tickets: AS-REP Roasting (T1558.004) | 4768 pre-auth type 0 | Re-enable pre-authentication |
| Steal or Forge Kerberos Tickets: Golden Ticket (T1558.001) | MDI forged-ticket alerts | Protect DCs; reset krbtgt twice after compromise |
| Use Alternate Authentication Material: Pass the Ticket (T1550.003) | MDI lateral movement alerts | Protected Users; limit admin sign-ins |

## evidence

- **4768** — TGT requested (with pre-authentication type and encryption type in the event data).
- **4769** — service ticket requested (service name, account, client address, encryption type).
- **4771** — Kerberos pre-authentication failed.
- **Defender for Identity** — LDAP reconnaissance, SPN exposure, forged-ticket and lateral movement alerts; posture assessments.

## where

| Evidence | Where |
|---|---|
| 4768 / 4769 / 4771 | `SecurityEvent` from domain controllers (Common event set) |
| Kerberos and LDAP activity | `IdentityLogonEvents`, `IdentityQueryEvents` |
| Identity alerts | Defender XDR incidents; `AlertInfo` |
| Posture weaknesses | Defender for Identity security posture assessments (Secure Score / Exposure Management) |

## analyst

For Kerberos-related alerts:

1. **Who requested what?** Account, source machine, which services, how many, which encryption.
2. **Is the source a known tool?** (Rare for Kerberoasting-like bursts.)
3. **What did the targeted accounts do next?** Any unusual sign-ins?
4. **How privileged are the targeted accounts?** Prioritize resets accordingly.
5. **Fix the posture** so the same attack fails next time.

## microsoft

- **Microsoft Defender for Identity** — detects reconnaissance, Kerberoasting (SPN exposure), AS-REP roasting, forged tickets and pass-the-ticket; posture assessments list roastable accounts and risky delegation.
- **Microsoft Sentinel** — DC Security events (4768, 4769, 4771) via Windows Security Events via AMA.
- **Active Directory** — gMSAs, Protected Users group, "account is sensitive and cannot be delegated", AES encryption settings.

## explainBack

Q: Why doesn't Kerberoasting produce failed logons?
A: The attacker only requests service tickets, which any domain user is allowed to do. The password cracking happens offline on the attacker's own computer, so the domain never sees wrong-password attempts.

Q: What makes an account AS-REP roastable, and what's the fix?
A: Having "Do not require Kerberos pre-authentication" enabled. The fix is to turn pre-authentication back on for that account unless there's a documented need.

Q: Why must krbtgt be reset twice after a Golden Ticket compromise?
A: Domain controllers accept tickets signed with the current and the previous krbtgt key. Resetting once still leaves the old (stolen) key valid as the "previous" one; the second reset, after replication, removes it.
