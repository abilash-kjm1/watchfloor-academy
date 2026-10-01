## bridge

In **Users, groups and permissions** you met **Microsoft Entra ID**, the cloud service that checks sign-ins to Microsoft 365 and thousands of other apps. This lesson looks inside it: the identities it manages, and the two logs every SOC uses to investigate cloud accounts — **sign-in logs** (who signed in, from where, did it work) and **audit logs** (what was changed).

**Chain:** User → signs in to an app → Entra ID checks identity → *sign-in log* → changes recorded in the *audit log* → evidence for investigation

## what

### Microsoft Entra ID
Microsoft's cloud **identity provider** — the service that decides *who you are* and *whether you may sign in* to cloud apps such as Outlook, Teams and the Azure portal. It was called **Azure Active Directory (Azure AD)** until 2023, so older material uses that name.

### What Entra ID keeps track of

**Users**
- People's accounts, e.g. `alex.morgan@contoso.com`. The full sign-in name is called the **UPN** (User Principal Name).

**Groups**
- Collections of users used to grant access together.

**Roles**
- Sets of administrative powers, e.g. *Global Administrator* (can change everything) or *Helpdesk Administrator* (can reset passwords).

**Applications and service principals**
- An **application** is a piece of software registered so it can use Entra ID for sign-in.
- A **service principal** is the application's own identity *inside your organization* — the account an app uses when it acts by itself, without a user.

### The two logs this lesson is about

**Sign-in logs** — one record per sign-in attempt: who, when, from which IP and device, to which app, and whether it worked.

**Audit logs** — one record per change: a user created, a password reset, someone added to a role, an app given permissions.

> Sign-in logs answer **"who got in?"** Audit logs answer **"what did they change?"**

## why

In the cloud there is no office door. Anyone on the internet can *try* to sign in to a company's Microsoft 365. So the sign-in check becomes the main security boundary.

That makes identity logs essential:

- Most cloud incidents start with a **stolen or guessed password** or a **stolen session**.
- The sign-in log is often the **first and only evidence** that the wrong person got in.
- The audit log shows what an attacker did **after** getting in — for example creating a backdoor account or giving an app access to mail.

## name

- **Entra** — Microsoft's brand for its identity products (renamed from Azure AD in 2023).
- **Sign-in log** — a log of sign-ins.
- **Audit log** — "audit" means an official check of records; this log records changes so they can be checked later.
- **Service principal** — "principal" is the security term for *anything that can be given permissions* (a user, a group, an app).

## problem

Without these logs, a SOC could not answer:

1. Did the person who signed in really have the right password **and** pass MFA?
2. Was the sign-in from the user's normal **place and device**?
3. Which **app** did they access?
4. What did they **change** once inside?

## analogy

Think of a company's front desk:

- The **sign-in log** is the visitor book: name, time, where you came from, whether security let you in.
- The **audit log** is the building manager's notebook: "new key cut for room 4", "Alex given access to the server room".

An investigator reads the visitor book to find who came in, then the manager's notebook to see what they changed.

## how

### Step 1: What happens during a sign-in

1. A user opens an app (e.g. Outlook on the web).
2. The app sends the user to Entra ID to sign in.
3. Entra ID checks the **password** (first factor).
4. Entra ID evaluates **Conditional Access** policies (next lesson) — for example, "require MFA".
5. If MFA is required, the user approves it.
6. Entra ID issues a **token** — a digital pass the app accepts for a period of time.
7. Every step is written to the **sign-in log**, whether it succeeded or failed.

### Step 2: The four kinds of sign-in log

| Log | What it covers | Sentinel table |
|---|---|---|
| **Interactive user sign-ins** | A person typed a password or approved MFA | `SigninLogs` |
| **Non-interactive user sign-ins** | An app signed in *on behalf of* a user using an existing token, without the user doing anything | `AADNonInteractiveUserSignInLogs` |
| **Service principal sign-ins** | An app signing in as itself | `AADServicePrincipalSignInLogs` |
| **Managed identity sign-ins** | Azure resources signing in with identities Azure manages for them | `AADManagedIdentitySignInLogs` |

> Non-interactive sign-ins far outnumber interactive ones. They matter for investigations because a **stolen token** is used silently — it shows up as non-interactive activity.

### Step 3: The fields you'll read most

| Field | Tells you |
|---|---|
| `UserPrincipalName` | Who |
| `TimeGenerated` | When (UTC) |
| `IPAddress`, `Location` | From where (country code) |
| `AppDisplayName` | Which app |
| `ClientAppUsed` | Browser, mobile app, or an old protocol such as IMAP |
| `DeviceDetail` | Operating system, browser, whether the device is managed/compliant |
| `ResultType` | The result code — `0` means success |
| `ConditionalAccessStatus` | success, failure or notApplied |
| `AuthenticationRequirement` | singleFactorAuthentication or multiFactorAuthentication |
| `RiskLevelDuringSignIn` | Risk assessed by Identity Protection (next lesson) |

### Step 4: Result codes worth recognizing

| ResultType | Meaning |
|---|---|
| `0` | Success |
| `50126` | Invalid username or password |
| `50053` | Account locked (or sign-in blocked from a known-malicious IP) |
| `50074` / `50076` | Strong authentication (MFA) required — the user must complete MFA |
| `500121` | Authentication failed during the MFA step |
| `53003` | Blocked by a Conditional Access policy |

### Step 5: Audit log basics

Each audit record has:

- `OperationName` — what happened, e.g. *Add member to role*, *Reset user password*, *Consent to application*.
- `InitiatedBy` — **who** did it (a user or an app).
- `TargetResources` — **what** was changed.
- `Result` — success or failure.

## realWorld

A normal day for one employee, in the logs:

1. **08:52** — interactive sign-in to Teams from the office IP, MFA satisfied → `ResultType 0`.
2. **All day** — hundreds of non-interactive sign-ins as Outlook and Teams refresh their tokens.
3. **14:10** — audit log: *Update user* — HR changed the employee's job title.

Nothing unusual. Learn this shape first.

## securityExample

An account shows this sequence:

1. **02:14** — 12 failed sign-ins (`50126`) from an IP in a country the user has never used.
2. **02:31** — success (`0`) from the same IP, **single-factor** (no MFA), using `ClientAppUsed = IMAP` (an old email protocol that can't do MFA).
3. **02:40** — audit log: *New-InboxRule* style activity forwarding mail outside (recorded in Microsoft 365 audit) and, in Entra, *Consent to application* for an unknown app.

Each step alone might have an explanation. Together they tell a clear story: a guessed password used through a protocol that skipped MFA, followed by changes that keep access and steal mail.

## normal

- Sign-ins from the user's usual countries, IP ranges and managed devices.
- MFA satisfied (`multiFactorAuthentication`) for interactive sign-ins.
- Large volumes of non-interactive sign-ins from known apps.
- Audit changes made by the IT/identity team, during business hours, matching tickets.

## suspicious

- Success after several failures from the **same unfamiliar IP**.
- **Single-factor** success where MFA is normally required.
- **Legacy protocols** (IMAP, POP, SMTP AUTH) — they can't enforce MFA.
- A new country **and** a new device **and** unusual time together.
- Audit events: new **role assignments**, new **app consents**, **MFA methods added** for a user, password resets by unexpected people.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | Sign-in from London while the user is on an approved trip, MFA satisfied, managed laptop |
| **Suspicious** | Sign-in from a new country with no travel record |
| **Confirmed malicious** | That sign-in followed password failures from the same IP, used IMAP without MFA, and was followed by a new MFA method being registered that the user doesn't recognize |

## abuse

Defensive view of common identity attack paths:

- **Guessing or reusing passwords** across many accounts.
- **Tricking users** into typing their password (and sometimes approving MFA) on a fake sign-in page.
- **Stealing a session token**, so the attacker doesn't need the password at all.
- After getting in: **registering their own MFA method**, **creating accounts**, or **granting an app access** to mail and files so access survives a password reset.

> This is why the audit log matters as much as the sign-in log: it shows how an attacker tries to **stay in**.

## evidence

- **Sign-in records** — successes, failures, MFA details, Conditional Access results, device, location, risk.
- **Audit records** — user, group, role, app and policy changes, with who made them.
- **Risk detections** from Identity Protection (next lesson).

## where

| Evidence | Where |
|---|---|
| Sign-ins (all four types) | Microsoft Entra admin center → Monitoring → Sign-in logs; Sentinel tables listed above |
| Changes | Entra admin center → Audit logs; Sentinel `AuditLogs` table |
| Getting them into Sentinel | The **Microsoft Entra ID** data connector (you choose which log types to send) |
| Retention in Entra itself | Limited (about 30 days with P1/P2 licenses) — sending logs to Sentinel keeps them longer |

## analyst

When you investigate a possibly compromised account:

1. **Pull the user's sign-ins** for the last 7–30 days. Note normal countries, IPs, devices and apps — the **baseline**.
2. **Find the odd ones out**: new IP, country, device, protocol or single-factor success.
3. **Check failures just before** a suspicious success — guessing?
4. **Check non-interactive sign-ins** from the same IP — a stolen token in use?
5. **Read the audit log** after the suspicious sign-in: new MFA methods, role changes, app consents, password changes.
6. **Decide and act** (covered in the next lesson): revoke sessions, reset the password, remove attacker-added methods.

## microsoft

- **Microsoft Entra admin center** — where admins view sign-in and audit logs directly.
- **Microsoft Sentinel** — the Microsoft Entra ID connector streams these logs into `SigninLogs`, `AADNonInteractiveUserSignInLogs`, `AuditLogs` and more, for KQL and analytics rules.
- **Microsoft Defender XDR** — identity alerts appear in unified incidents; in the Defender portal, Entra sign-in data can also be queried in Advanced Hunting.
- **SC-200** — "Investigate and remediate compromised identities that are identified by Microsoft Entra ID" is an exam objective.

> **Stable concept vs current UI:** the logs and fields are stable; menu paths in the admin centers change — check Microsoft's docs.

## explainBack

Q: Explain the difference between the sign-in log and the audit log using a hotel.
A: The sign-in log is the record of who used their key card to enter, when, and whether the door opened. The audit log is the record of changes — a new guest registered, a card given access to an extra floor. One shows who got in; the other shows what changed.

Q: Why do non-interactive sign-ins matter in an investigation even though the user did nothing?
A: They happen when an app uses an existing token on the user's behalf. If an attacker steals a token, they use it the same way — so a non-interactive sign-in from an unknown IP can reveal stolen-session activity that the interactive log never shows.

Q: A sign-in shows ResultType 0, single-factor, ClientAppUsed IMAP, from a new country. Why is that worrying?
A: It succeeded without MFA through an old protocol that can't do MFA, from somewhere the user has never been. That combination is typical of someone using a stolen or guessed password to bypass MFA.
