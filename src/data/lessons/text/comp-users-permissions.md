## bridge

In **Programs, processes and services** you learned that every process runs **as a user account**. This lesson explains what accounts are, how groups and permissions control what each account can do, and why changes to powerful accounts are among the most important things a SOC watches.

## what

This lesson covers four ideas about **who is allowed to do what** on a computer.

### 1. User account
A **user account** is an identity that the system recognizes.
- Example: `alex.morgan` signing in to a laptop.

### 2. Group
A **group** is a collection of accounts that are managed together.
- Example: everyone in the "Finance" group can open the finance share.

### 3. Permission
A **[[permission|permission]]** is a rule that allows or denies an action on a resource.
- Actions include: read, write, run, change settings.
- Example: "Finance can **read** the payroll folder, but not **change** it."

### 4. Least privilege
**[[least-privilege|Least privilege]]** means giving each account only the access it needs, and only for as long as it needs it.
- Example: a help-desk technician can reset passwords, but cannot change company-wide settings.

### Where company accounts live

Home computers keep accounts on the computer itself. Companies with thousands of people need **one central place** for accounts instead. Two systems do this:

**Active Directory (AD)**
- Microsoft's directory for accounts and computers *inside* a company's own network ("on-premises" — on the company's own servers).
- The servers that run it are called **domain controllers (DCs)**. When you sign in to a work laptop, a domain controller checks your password.

**Microsoft Entra ID** (formerly Azure Active Directory)
- Microsoft's **cloud** identity service. It checks sign-ins to Microsoft 365, Teams, Azure and thousands of other cloud apps.

Many companies use **both**, connected together.

**MFA (multi-factor authentication)**
- Signing in with **two or more different kinds of proof**: something you know (password), something you have (phone), or something you are (fingerprint). A stolen password alone is then not enough.

## why

Computers are shared by many people and programs.

Without accounts and permissions:

- Any user could read everyone else's files.
- Any program could change the whole system.

**Groups** exist because managing permissions one person at a time does not scale. You grant access to "Finance" once, then simply add people to the group.

## name

**Privilege** originally meant a special right given to some people and not others.

In computing, **privileged accounts** have special rights over the system itself. Examples:

- `Administrator` on Windows
- `root` on Linux
- **Domain Admins** in Active Directory
- **Global Administrator** in Microsoft Entra ID

## problem

Permissions **limit the damage** of mistakes and attacks.

| If this account is misused… | …the damage is limited to |
|---|---|
| A standard user | What that user can reach |
| An administrator | Potentially the whole environment |

> This is why SOCs treat **privileged accounts** and **changes to privileged groups** as high priority.

## how

### Authentication, authorization, accounting (AAA)

Three steps happen whenever someone uses a system:

1. **[[authentication|Authentication]]** — *prove who you are.*
  - Password, MFA prompt, certificate.
2. **Authorization** — *decide what you're allowed to do.*
  - Permissions, roles, group membership.
3. **Accounting** — *record what you did.*
  - Logs.

> Logs are the **accounting** step. That is why they are the SOC's main evidence.

### How different systems handle permissions

- **Windows** — each file and object has an access control list (who can do what).
- **Active Directory / Entra ID** — access is managed through groups and roles.
- **Linux** — each file has owner / group / everyone permissions (read, write, execute). The `sudo` command allows temporary elevation.

### Service accounts

A **service account** is a non-human account that runs an application.

- It often has **broad permissions**.
- It normally **never signs in interactively** (nobody types its password at a keyboard).

> So if a service account suddenly signs in interactively from a workstation, that is a strong warning sign.

## analogy

Think of an office building:

- Your **badge** proves who you are → *authentication*.
- **Badge rules** decide which floors you can enter → *authorization*.
- The **door log** records every door you opened → *accounting*.
- A **master key** opens everything → *an administrator account*. That is why it is locked away and every use of it is recorded.

## realWorld

Good practice in a real company:

- The help-desk technician gets the **Helpdesk Administrator** role — not Global Administrator.
- The backup service account can **read all files**, but **cannot sign in interactively**.
- New employees are added to **their department's group** and automatically get the right access.

## securityExample

At 23:47 on a Sunday, an account is added to a **highly privileged group** by someone who doesn't usually manage groups.

Even if nothing else looks wrong yet:

- That change could give **complete control** of the environment to whoever controls that account.

> Many SOCs alert on **every** change to privileged groups — then confirm whether it was approved.

## normal

- Group changes made by the **identity / IT team**, during **business hours**, linked to a **ticket**.
- Administrators using **separate admin accounts** only for admin work.
- Service accounts authenticating **from the servers they run on**.

## suspicious

- Additions to **privileged groups** outside approved change windows.
  - e.g. Domain Admins, Enterprise Admins, Global Administrator.
- A **new account** that immediately receives high privilege.
- **Service accounts** signing in interactively or from workstations.
- A standard user suddenly using **admin tools** or opening **many file shares**.

## abuse

Defensive view.

In most serious incidents, attackers try to:

- **Gain more privilege** than they started with (*privilege escalation*).
- **Keep their access** (*persistence*).

In the logs, this often appears as:

- Accounts being **created**.
- Accounts being **added to groups**.

> Monitoring privileged groups closely, and enforcing least privilege, means one stolen account has limited reach.

## evidence

**Windows / Active Directory events**

| Event ID | Meaning |
|---|---|
| 4720 | A user account was created |
| 4728 | A member was added to a security-enabled **global** group (a domain group) |
| 4732 | A member was added to a security-enabled **local** group |
| 4756 | A member was added to a security-enabled **universal** group |
| 4672 | Special (admin-level) privileges were given at logon |

**Reading a group-change event correctly**

In events 4728 / 4732 / 4756 the field names can mislead you:

| Field | What it actually holds |
|---|---|
| `SubjectUserName` | **Who made the change** |
| `MemberName` | **Who was added** (shown as a directory path) |
| `TargetUserName` | **The group's name** (not a user!) |

> Microsoft reuses the "Target" fields for the *object being changed* — here, the group. Misreading this is a common beginner mistake.

**Microsoft Entra ID**
- **Audit log** entries for role assignments and group membership changes.

## where

- **Windows Security log** on domain controllers → the `SecurityEvent` table in Microsoft Sentinel.
- **Entra ID audit logs** → the `AuditLogs` table in Sentinel.
- **Defender for Identity** → tracks sensitive group changes and raises identity alerts.

## analyst

When you see a privilege change, answer these questions:

1. **Who** made the change?
2. **From which device?**
3. Is there an approved **ticket** or change record?
4. Was the person's own **sign-in** normal just before the change?
5. What did the newly privileged account **do afterwards**?

## microsoft

- **Entra ID roles** — control administrative rights in the cloud.
- **Privileged Identity Management (PIM)** — gives admin rights *just in time*, only when needed.
- **Defender for Identity** — watches on-premises Active Directory changes.
- **Sentinel analytics rules** — alert on `SecurityEvent` and `AuditLogs` changes.

## explainBack

Q: Explain authentication, authorization and accounting using a gym membership.
A: Showing your membership card at the door proves who you are (authentication). Your membership level decides which areas you can use — pool or not (authorization). The front desk system records every visit (accounting) — that record is what an investigator would read later.

Q: Why does a SOC care more about someone being added to "Domain Admins" than to "Sales-Team"?
A: Domain Admins can control every computer and account in the company. If the wrong person — or an attacker — gets that membership, the whole environment is at risk. Adding someone to a sales group only gives access to sales files.

Q: In event 4728, which field tells you the group name, and which tells you who was added?
A: TargetUserName holds the group name; MemberName holds the account that was added; SubjectUserName is the person who made the change.
