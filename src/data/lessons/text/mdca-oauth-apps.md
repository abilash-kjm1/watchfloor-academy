## bridge

Your organization doesn't only use Microsoft 365. People sign in to dozens of cloud apps — and they connect third-party apps to their Microsoft 365 data with a single "Accept" click. **Microsoft Defender for Cloud Apps** gives the SOC visibility and control over that cloud app world, and its **app governance** capability watches the **OAuth apps** that hold permissions to your data.

This lesson focuses on the threat SC-200 highlights: a user consenting to a malicious or risky app — a back door that survives password resets.

**Chain:** Users sign in to cloud apps → some grant OAuth apps permission to their data → Defender for Cloud Apps discovers apps and monitors activity → app governance scores risky apps → alerts → investigate what the app accessed → revoke consent, disable the app, tighten consent settings

## what

### 1. Defender for Cloud Apps
**Microsoft Defender for Cloud Apps** is a **cloud access security broker (CASB)** and SaaS security tool. Its main capabilities:

| Capability | What it does |
|---|---|
| **Cloud discovery** | Finds which cloud apps people use (shadow IT) from firewall/proxy logs or Defender for Endpoint |
| **App connectors** | Connect via API to apps like Microsoft 365, Salesforce or GitHub to see activities and files |
| **Conditional Access app control** | A session proxy that can monitor or block actions (e.g. downloads) in real time |
| **Policies and anomaly detection** | Alerts on risky activity: impossible travel, mass download, suspicious inbox rules |
| **App governance** | Monitors **OAuth apps** registered in Microsoft Entra ID: permissions, usage, risk |

### 2. OAuth apps and consent
**OAuth** is the standard that lets an app access your data **without your password**. When you click "Accept" on a consent screen, Microsoft Entra ID gives the app a **token** with specific **permissions** (also called scopes).

- **Delegated permissions** — the app acts *as the signed-in user* (e.g. read *my* mail).
- **Application permissions** — the app acts *as itself*, often across the whole organization (e.g. read *all* mailboxes). These need **admin consent**.
- `offline_access` lets the app get refresh tokens and keep access **without the user present**.

### 3. Consent phishing (illicit consent grant)
An attacker registers an app with a trustworthy-looking name ("Document Viewer"), then sends a link. The user signs in to the **real** Microsoft page and grants consent. The attacker's app now reads mail or files through the API.

> Resetting the user's password does **not** remove the app's access. The consent must be revoked.

## why

Cloud app security needs its own tooling because:

- **Shadow IT** — employees use apps IT never approved, storing company data in them.
- **API access bypasses the user interface** — an OAuth app reading mail leaves no browser session to notice.
- **Consent survives password changes and MFA** — it's one of the most persistent footholds in Microsoft 365.
- **Third-party apps** may be over-privileged or abandoned, or turn malicious later.

## name

- **Cloud access security broker** — a *broker* that sits between users and *cloud* services to enforce security.
- **OAuth** — **Open Authorization**: an open standard for granting access without sharing passwords.
- **Consent** — the user agreeing to give the app permissions.
- **Shadow IT** — IT used in the *shadows*, outside the IT department's knowledge.

## problem

Defender for Cloud Apps helps answer:

1. **Which cloud apps are people using, and are they risky?**
2. **Which OAuth apps can read our mail, files or directory — and who granted that?**
3. **Is an app behaving unusually** (sudden spike in data access, access to sensitive files)?
4. **Did a user grant consent to a malicious app?**
5. **What data did the app access, and how do we cut it off?**

## analogy

A house-sitting service:

- **Your password** — your own house key.
- **OAuth consent** — giving a house-sitting company a separate key that opens only certain rooms. You never give them your own key.
- **Application permissions** — a key that opens *every* house on the street (needs the landlord's approval: admin consent).
- **Consent phishing** — a fake house-sitting company with a convincing logo. You hand them a key yourself.
- **Changing your own lock (password reset)** doesn't help — they have their *own* key. You must take that key back (revoke consent).

## how

### Step 1: Spot the risky app
Signals that an OAuth app is risky:
- **High-privilege permissions** (mail, files or directory access for everyone).
- **Unverified publisher**, recently registered, or registered in an external tenant.
- Consent by **one or a few users** shortly after a phishing email.
- **Sudden activity spikes** — many mail reads or file downloads via API.
- App governance **risk score** or alerts.

### Step 2: Investigate
1. **Who consented, when, to which permissions?** — Entra audit log: "Consent to application".
2. **What is the app?** — publisher, owner tenant, reply URLs, creation date, permissions (app governance / `OAuthAppInfo`).
3. **What did it do?** — `CloudAppEvents` and Microsoft Graph activity logs for that app ID.
4. **How did it arrive?** — phishing emails with a consent link to the users who consented.

### Step 3: Contain
| Action | Effect |
|---|---|
| **Revoke the consent / remove permissions** | The app's existing tokens can no longer be renewed for that access |
| **Disable the app (service principal)** in Entra ID or via app governance | Stops all sign-ins by the app in your tenant |
| **Revoke sessions** of affected users | In case the attacker also has their sessions |
| **Report / block** the app | App governance can disable apps automatically with policies |

### Step 4: Prevent
- **Restrict user consent** (for example: allow only verified publishers with low-risk permissions).
- Enable the **admin consent workflow** so users can request approval instead.
- **App governance policies** to alert on or disable apps with high privileges, unverified publishers or unusual usage.
- Regular review of apps with high privileges.

## realWorld

App governance shows 300 OAuth apps in a tenant. Most are well-known productivity tools with verified publishers. The SOC reviews the **20 apps with high privilege**: 4 are abandoned trials that still hold `Mail.Read` for dozens of users, and one has **application** permission to read all files. The owners are contacted, unused apps disabled, and user consent restricted to verified publishers with low-risk permissions.

## securityExample

Alert from app governance: *app with suspicious OAuth activity — high-volume mail access*.

1. **Consent:** three finance users consented to "SecureDoc Viewer" yesterday, granting `Mail.Read`, `Files.Read.All` and `offline_access`. Unverified publisher; app registered 6 days ago in an external tenant.
2. **Arrival:** each user received an email "You have a secure document waiting" with a link to the consent page.
3. **Activity:** via Microsoft Graph, the app read 4,200 messages and downloaded 120 files in two hours.

Response: disable the app's service principal, revoke the users' grants, revoke their sessions, find and remove the phishing emails from all mailboxes, determine which sensitive data was accessed (possible notification obligations), restrict user consent, and add an app governance policy for unverified high-privilege apps.

## normal

- Well-known apps from **verified publishers** with permissions matching their purpose.
- Admin consent granted through a **reviewed** process.
- App activity that is steady and matches how many people use the app.
- Shadow IT discovery showing mostly sanctioned apps.

## suspicious

- Consent to an **unverified, newly registered** app with mail, files or directory permissions.
- Consent shortly after a **phishing email** containing a Microsoft sign-in or consent link.
- `offline_access` plus broad read permissions on a little-known app.
- An app suddenly reading **thousands of messages or files**.
- New **application permissions** or credentials added to an existing app.
- Users uploading company data to **unsanctioned** storage apps.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | 200 users consented to a verified scheduling app with calendar permission |
| **Suspicious** | 3 users consented to an unverified "document viewer" with Mail.Read and offline_access |
| **Confirmed malicious** | The app read 4,200 messages via API within two hours of consent |

## abuse

Defensive view of cloud app attacks:

| Technique (MITRE ATT&CK) | In plain words | Defense |
|---|---|---|
| Steal Application Access Token | Tricking users into granting tokens to a malicious app (consent phishing) | Restrict user consent; admin consent workflow; app governance |
| Account Manipulation: Additional Cloud Credentials | Adding secrets or certificates to an existing app to use it | Alert on credential changes to apps; review owners |
| Email Collection | Reading mail through the API | Monitor high-volume mail access by apps |
| Data from Cloud Storage | Bulk file downloads via API | Activity anomaly detection; session controls |

## evidence

- **Consent and app changes** in the Entra audit log (consent granted, app credentials added, permissions changed).
- **App metadata and risk** in app governance.
- **Cloud app activity** — mail access, file downloads, sharing — from connected apps.
- **Graph API activity** — which app called which API, how often.
- **Discovery data** — which cloud apps are used, by whom, how much data moved.

## where

| Evidence | Where |
|---|---|
| Consent grants, app credential changes | `AuditLogs` (Entra ID) |
| OAuth app inventory, permissions, risk | `OAuthAppInfo` (app governance must be on) |
| Activity in Microsoft 365 and connected apps | `CloudAppEvents` |
| API calls by the app | `MicrosoftGraphActivityLogs` (when enabled) |
| Service principal sign-ins | `AADServicePrincipalSignInLogs` |
| Alerts | Defender portal; `AlertInfo` (`ServiceSource` Microsoft Defender for Cloud Apps / app governance) |

## analyst

For any risky-app case:

1. **Who consented** and **to what permissions**?
2. **Is the app legitimate?** Publisher, tenant, age, purpose.
3. **What did it access** — mail, files, directory — and how much?
4. **Contain:** disable the app, revoke grants, revoke user sessions, remove the phishing lure.
5. **Prevent:** consent settings, admin consent workflow, app governance policies.

## microsoft

- **Microsoft Defender for Cloud Apps** — cloud discovery, app connectors, Conditional Access app control, policies, anomaly detection.
- **App governance** — OAuth app inventory, risk, usage insights and policies; data in `OAuthAppInfo`.
- **Microsoft Entra ID** — enterprise apps and consent settings, admin consent workflow, publisher verification.
- **Microsoft Defender XDR** — app governance and Defender for Cloud Apps alerts in incidents; `CloudAppEvents` in Advanced Hunting.

## explainBack

Q: Why doesn't a password reset remove a malicious OAuth app's access?
A: The app was given its own token and permissions through consent. It never needed the user's password, so changing it doesn't affect the app — you have to revoke the consent or disable the app.

Q: What's the difference between delegated and application permissions?
A: Delegated permissions let the app act as the signed-in user, limited to what that user can access. Application permissions let the app act on its own, often across the whole organization, so they need admin consent and are far more dangerous if abused.

Q: How does consent phishing fool careful users?
A: The user signs in on the real Microsoft page — the URL and padlock look right. The trap is the permission request for an attacker-controlled app with a trustworthy name, which the user approves themselves.
