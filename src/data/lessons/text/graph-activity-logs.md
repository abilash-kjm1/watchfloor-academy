## bridge

In the identity and cloud-app lessons you saw that attackers with a stolen **token** — from token theft or a malicious OAuth app — don't need the Outlook or SharePoint user interface. They call **Microsoft Graph**, the API (application programming interface) behind Microsoft 365 and Entra ID, directly. Sign-in logs show the token being issued; **Microsoft Graph activity logs** show what was done with it, request by request.

**Chain:** Token issued (sign-in logs) → app or user calls Microsoft Graph → every request recorded (who, which app, which URI, result) → sent to a Log Analytics workspace via Entra diagnostic settings → `MicrosoftGraphActivityLogs` in Sentinel → hunt for enumeration, bulk data access and unusual apps

## what

### 1. Microsoft Graph
**Microsoft Graph** is the single API endpoint (`https://graph.microsoft.com`) for Microsoft 365 and Entra ID data: users, groups, mail, files, Teams, devices, directory roles. Microsoft's own apps, third-party apps, scripts and attackers all use it.

### 2. Microsoft Graph activity logs
**Microsoft Graph activity logs** record **HTTP requests** made to Microsoft Graph for resources in your tenant. Each record includes:

| Field | Meaning |
|---|---|
| `TimeGenerated` | When the request was received |
| `UserId` / `ServicePrincipalId` | Who made the request (a user, or an app acting as itself) |
| `AppId` | Which application made the call |
| `IPAddress`, `UserAgent` | Where the request came from and with what client |
| `RequestMethod`, `RequestUri` | What was asked for (e.g. `GET /v1.0/users`) |
| `ResponseStatusCode` | The result (200 success, 403 forbidden, 429 throttled…) |
| `Scopes` / `Roles` | Permissions in the token (delegated scopes or application roles) |
| `SignInActivityId`, `SessionId`, `UniqueTokenId` | Links back to the sign-in and token |

### 3. How to collect them
Graph activity logs are **not** collected by default. An administrator enables them in **Microsoft Entra ID → Diagnostic settings**, choosing the `MicrosoftGraphActivityLogs` category and a destination: a **Log Analytics workspace** (for Sentinel), a storage account or Event Hubs. This requires a Microsoft Entra ID P1 or P2 license, and the data is billed by volume like any other ingested log.

## why

Graph activity logs exist because **API access is invisible elsewhere**:

- Sign-in logs say *a token was issued to app X*; they don't say *app X then read 5,000 messages*.
- Attackers increasingly use tokens and APIs directly — after token theft, consent phishing or compromise of an app's credentials.
- Reconnaissance through Graph (listing all users, groups, roles and applications) is fast and quiet.
- Investigators need to know **exactly what** was accessed to scope the incident.

## name

- **Graph** — Microsoft 365 data is modeled as a *graph*: users connected to mail, files, groups, devices.
- **API** — **application programming interface**: the way programs request data from a service.
- **URI** — *Uniform Resource Identifier*: the address of the resource requested, like `/users/{id}/messages`.
- **Status code** — the three-digit HTTP result: 2xx success, 4xx client error, 5xx server error.

## problem

Graph activity logs help answer:

1. **What did this app or token actually do?**
2. **Is someone enumerating our directory** (all users, groups, roles, applications)?
3. **Is an app reading mail or files in bulk?**
4. **Are requests coming from unexpected IPs or user agents** for a known app?
5. **Did requests fail with 403** — an attacker probing what they're allowed to do?

## analogy

A library:

- **Sign-in logs** — the record of who received a library card today.
- **Graph activity logs** — the record of every book each card holder took off the shelf, and every shelf they tried to open but weren't allowed to.
- **Enumeration** — someone photographing the whole catalog.
- **403 errors** — someone repeatedly trying the locked rare-books room.

## how

### Step 1: Link a sign-in to its API activity
1. Find the suspicious sign-in in `SigninLogs` (or the service principal sign-in).
2. Use the session or sign-in identifiers to find matching Graph requests.
3. Read the `RequestUri` values to see what was accessed.

### Step 2: Recognize patterns
| Pattern in RequestUri | Possible meaning |
|---|---|
| Many calls to `/users`, `/groups`, `/directoryRoles`, `/applications` | Directory reconnaissance |
| Many calls to `/messages` or `/mailFolders` | Mail collection |
| Many calls to `/drive` or `/sites` items | File collection |
| `POST` to `/applications/.../addPassword` | Adding a secret to an app (persistence) |
| `POST` to `/me/mailFolders/inbox/messageRules` | Creating an inbox rule through the API |

### Step 3: Combine with other evidence
- **AuditLogs** — directory *changes* (Graph logs show the request; audit logs show the change).
- **CloudAppEvents** — Microsoft 365 activities.
- **OAuthAppInfo** — the app's permissions and risk.

### Step 4: Respond
Disable or revoke the app or user tokens involved, remove persistence (secrets added to apps, inbox rules), and scope accessed data from the request URIs.

## realWorld

A company enables Graph activity logs after a cloud incident. Normal traffic is dominated by Microsoft first-party apps (Teams, Outlook, SharePoint) and a few known line-of-business apps. The SOC builds a baseline per app — which URIs it calls, how often, from which IPs — so that unusual behavior stands out.

## securityExample

A user's session was stolen through adversary-in-the-middle phishing. Sign-in logs show a successful MFA sign-in from a hosting provider. Graph activity logs for that session show, within 15 minutes:

1. `GET /v1.0/users?$top=999` repeated until every user was listed — **directory enumeration**.
2. `GET /v1.0/me/messages?$search="invoice"` — **searching mail** for payment topics.
3. `POST /v1.0/me/mailFolders/inbox/messageRules` — **creating an inbox rule** to hide replies.

The investigation can now state precisely what the attacker saw and changed: the directory listing, the invoice-related emails, and the hidden rule. Response: revoke sessions, remove the rule, reset credentials, and warn finance about likely invoice fraud using the harvested information.

## normal

- Microsoft first-party apps making large volumes of routine calls.
- Known business apps calling the same endpoints from the same IP ranges every day.
- Occasional 403 responses from apps with deliberately limited permissions.
- Admin scripts calling directory endpoints during scheduled maintenance.

## suspicious

- **Enumeration** of users, groups, roles or applications by a user session or an unfamiliar app.
- **Bulk mail or file reads** by an app that normally reads little.
- Requests from **new IPs, countries or user agents** (e.g. scripting libraries) for an existing app.
- **Bursts of 403 responses** — probing permissions.
- `POST` requests that **add credentials to applications** or create inbox rules.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | The HR app reads user profiles nightly from its Azure IP range |
| **Suspicious** | A user session lists all users and directory roles from a hosting provider |
| **Confirmed malicious** | The same session searches mail for "invoice" and creates a hiding inbox rule |

## abuse

Defensive view:

| Technique (MITRE ATT&CK) | In plain words | Evidence in Graph activity logs |
|---|---|---|
| Account Discovery: Cloud Account | Listing users and roles | Many `/users`, `/directoryRoles` requests |
| Email Collection | Reading mail via API | Many `/messages` requests |
| Account Manipulation: Additional Cloud Credentials | Adding secrets to apps | `addPassword` / `addKey` requests |
| Steal Application Access Token | Using stolen tokens to call APIs | Requests linked to a suspicious sign-in or app |

## evidence

- Every Graph **request**: who, which app, from where, what URI, what result.
- **Token and session links** back to sign-ins.
- **Permissions** in the token (scopes and roles).

## where

| Evidence | Where |
|---|---|
| Graph API requests | `MicrosoftGraphActivityLogs` (after enabling Entra diagnostic settings) |
| The sign-in that issued the token | `SigninLogs`, `AADNonInteractiveUserSignInLogs`, `AADServicePrincipalSignInLogs` |
| Resulting directory changes | `AuditLogs` |
| Microsoft 365 activity and app details | `CloudAppEvents`, `OAuthAppInfo` |

## analyst

When an identity or app is suspected:

1. **Find its Graph requests** for the incident window.
2. **Summarize by URI pattern** — what categories of data were touched?
3. **Look for writes** (`POST`, `PATCH`, `DELETE`) — persistence or changes.
4. **Check IPs, user agents and status codes** against the app's normal behavior.
5. **Scope the data** for the incident report — what was read, how much.

## microsoft

- **Microsoft Graph** — the API for Microsoft 365 and Entra ID.
- **Microsoft Graph activity logs** — enabled via Microsoft Entra diagnostic settings; sent to a Log Analytics workspace, storage or Event Hubs.
- **Microsoft Sentinel** — query `MicrosoftGraphActivityLogs` alongside sign-in and audit logs.
- **Defender for Cloud Apps / app governance** — app-level context for the apps making the calls.

## explainBack

Q: Why can't sign-in logs alone tell you what an attacker did with a stolen token?
A: Sign-in logs show the token being issued and used to sign in. What the holder did next — which mail, files or directory objects they requested through the API — only appears in Graph activity logs.

Q: What would directory enumeration look like in Graph activity logs?
A: Many GET requests to endpoints like /users, /groups and /directoryRoles in a short time, often paging through results, from a session or app that doesn't normally do that.

Q: Why aren't Graph activity logs available by default in Sentinel?
A: An administrator has to enable them in Entra diagnostic settings and choose a Log Analytics workspace. They can be high-volume, so organizations decide deliberately — and pay for — the ingestion.
