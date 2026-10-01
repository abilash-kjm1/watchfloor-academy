## bridge

You can write basic **KQL** and you know **Defender XDR** collects endpoint, email and identity data. Advanced Hunting is where you query that data — and the most important skill is choosing the right table for your question.

**Chain:** Question → *right table* → time window → entity filter → result → pivot to the next table

## what

**[[advanced-hunting|Advanced Hunting]]** is the place in the Microsoft Defender portal where you write **KQL queries** over raw security data.

- It covers about **30 days** of Defender XDR data.
- In the unified platform, it can also query **Sentinel** data.

The data is split into **tables**. Each table records **one kind of activity**:

- programs starting
- network connections
- sign-ins
- emails
- …and so on.

> The core skill: given a question, **pick the right table**.

## why

**Alerts** only show what a detection was built to catch.

Analysts also need the **raw activity** to:

- **Verify** alerts.
- **Scope** incidents.
- **Find threats** that no rule caught.

Splitting data into purpose-built tables keeps queries **fast** and schemas **easy to understand**.

## name

- **Hunting** — searching *proactively* for threats, instead of waiting for alerts.
- **Advanced** — compared with a simple search box: you get full KQL over raw data.

## problem

The most common beginner mistake is **querying the wrong table**.

- Example: searching the *process* table for a *network* destination.

Choosing the right table is literally an SC-200 objective:

> *"Identify the appropriate table to use in a KQL query."*

## how

### Start from the question, then pick the table

**About devices**

| Question | Table |
|---|---|
| What program ran? With what command line? Started by what? | `DeviceProcessEvents` |
| What did the device connect to? Which program connected? | `DeviceNetworkEvents` |
| Who logged on to the device, how, and from where? | `DeviceLogonEvents` |
| Which files were created, changed, renamed or deleted? | `DeviceFileEvents` |
| Which registry settings changed? | `DeviceRegistryEvents` |

**About email**

| Question | Table |
|---|---|
| Which emails were delivered or blocked? From whom, to whom? | `EmailEvents` |
| Which attachments were in an email? | `EmailAttachmentInfo` |
| Which links were in an email? | `EmailUrlInfo` |
| Who clicked a link? | `UrlClickEvents` |

**About identity**

| Question | Table |
|---|---|
| Sign-ins against on-premises Active Directory? | `IdentityLogonEvents` |
| Directory lookups against domain controllers? | `IdentityQueryEvents` |

Terms used here:
- **Kerberos** and **NTLM** — the two sign-in methods Windows domains use (Kerberos is the modern default; NTLM is older).
- **LDAP**, **DNS** and **SAMR** — ways programs ask a domain controller for information (account lists, group members, computer names). Unusual volumes of these lookups can mean someone is mapping the environment.

**Other**

| Question | Table |
|---|---|
| Activity in cloud apps (Microsoft 365, SaaS)? | `CloudAppEvents` |
| Which alerts fired, and with what evidence? | `AlertInfo` / `AlertEvidence` |

### Columns you'll see in many tables

- `Timestamp` — when it happened.
- `DeviceName` / `DeviceId` — which device.
- `AccountName` — which user.
- `ActionType` — what kind of event (e.g. `ConnectionSuccess`, `FileCreated`).
- `ReportId` — identifies the event record.
- `InitiatingProcess…` columns — **the program that caused the event**.

## analogy

A hospital keeps separate records for **prescriptions**, **lab results**, **X-rays** and **visitors**.

You don't look for an X-ray in the prescription system.

Advanced Hunting tables are those separate record systems — **pick the one that records the thing you're asking about**.

## realWorld

Scoping a phishing incident means walking through several tables, one after another:

1. `EmailEvents` — **who received** the email?
2. `EmailUrlInfo` — **which link** was in it?
3. `UrlClickEvents` — **who clicked** the link?
4. `DeviceProcessEvents` / `DeviceNetworkEvents` — **what happened** on the clickers' devices?
5. `SigninLogs` / `IdentityLogonEvents` — were their **credentials used** afterwards?

## securityExample

Three questions about one suspicious file, each answered by a different table:

**1. Which device downloaded the file, and from where?**
- `DeviceFileEvents` — look for `FileCreated`, with `FileOriginUrl` and the file's `SHA1`.

**2. Did it run?**
- `DeviceProcessEvents` — search for the same `SHA1`.

**3. What did it connect to?**
- `DeviceNetworkEvents` — filter by `InitiatingProcessSHA1`.

> Why SHA-1? Microsoft's schema documentation notes that the `SHA256` columns in these device tables are "usually not populated", so hash hunts there should use `SHA1`.

## normal

Every table has a normal baseline:

- **Thousands** of process starts from browsers and Office.
- **Network connections** to Microsoft and cloud apps.
- **Logons** at the start of each shift.

> Learn these baselines with `summarize` queries **before** hunting for rare activity.

## suspicious

**Rarity** across tables is the hunter's friend:

- A program seen on **only one device**.
- A destination contacted by **only one device**.
- A **logon type** never before seen for an account.
- A registry "Run" key written by a program that **isn't an installer**.

## abuse

Defensive view: attackers try to **blend into the most common activity** in each table — common programs, common destinations.

> That's why hunting focuses on **relationships** (who started what, what connected where) rather than single values.

## evidence

Each table **is** a type of evidence.

> Always check the `ActionType` values first. They differ per table — e.g. `ConnectionSuccess`, `FileCreated`, `LogonFailed`.

## where

Microsoft Defender portal → **Investigation & response** → **Hunting** → **Advanced hunting**.

- The **schema** pane lists every table and column.
- Each column has documentation.

## analyst

An investigation pattern that works every time:

1. **Question** — what exactly am I trying to find out?
2. **Table** — which table records that activity?
3. **Time window** — e.g. the last 7 days.
4. **Entity filter** — the user, device, file or IP.
5. **Project** — keep the relevant columns.
6. **Summarize / scope** — how many devices, users, how often?
7. **Pivot** — take a value into the next table.

Save useful queries. Turn reliable ones into **custom detection rules**.

## microsoft

**Custom detection rules**
- Built from Advanced Hunting queries in Defender XDR.
- Microsoft recommends the query return `Timestamp` (or `TimeGenerated`), and for Defender for Endpoint tables also `DeviceId` and `ReportId`, so alerts link to the right device and event.

**Device names**
- `DeviceName` holds the full name, like `fin-ws-014.contoso.com`. Use `startswith` or `has` rather than `==` with the short name.

**Time column names**
- Defender XDR tables use `Timestamp`.
- Sentinel tables use `TimeGenerated`.

## explainBack

Q: Which table would you use to find which program on a laptop connected to a suspicious IP — and why not the process table?
A: DeviceNetworkEvents, because it records connections together with the program that made them. The process table records programs starting, not where they connected.

Q: How do the email tables link to each other?
A: Through NetworkMessageId, a unique ID for each email that appears in EmailEvents, EmailUrlInfo, EmailAttachmentInfo and UrlClickEvents.

Q: Why use SHA1 instead of SHA256 when hunting a file hash in Defender device tables?
A: Microsoft documents that the SHA256 column in those tables is usually empty, so a SHA256 search could miss every match.
