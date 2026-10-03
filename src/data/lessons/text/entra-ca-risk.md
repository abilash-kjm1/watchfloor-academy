## bridge

In **Entra ID sign-in and audit logs** you learned to read what happened at sign-in. This lesson covers the three Entra features that decide **whether** a sign-in is allowed and **how risky** it looks: **MFA**, **Conditional Access** and **Identity Protection** — and how an analyst investigates and fixes a compromised account.

**Chain:** Sign-in → Conditional Access decision (allow / require MFA / block) → Identity Protection risk → risky user or sign-in → investigation → remediation

## what

### MFA — multi-factor authentication
Signing in with **two or more different kinds of proof**:
- something you **know** (a password),
- something you **have** (a phone with the Authenticator app, a security key),
- something you **are** (a fingerprint or face).

### Conditional Access
Entra ID's **policy engine**. Each policy is an **if → then** rule:

> **If** a user wants to access an app **under these conditions**, **then** they must do something (or are blocked).

Example: *If anyone signs in to the Azure portal, then require MFA.*

### Identity Protection
Entra ID's **risk engine**. It looks for signs that a sign-in or a whole account may be compromised and gives each a **risk level** (low, medium, high).

- **Sign-in risk** — the chance that *this particular sign-in* wasn't made by the real user.
- **User risk** — the chance that *the account itself* is compromised (for example, its password appeared in a data breach).

## why

- **Passwords alone fail**: they get guessed, reused and phished. MFA means a stolen password alone isn't enough.
- **One rule doesn't fit everyone**: an admin signing in from an unknown country needs more checks than a receptionist on the office network. Conditional Access applies the right check to the right situation.
- **Humans can't watch every sign-in**: Identity Protection scores millions of sign-ins automatically and flags the ones worth a look — or blocks them through Conditional Access.

## name

- **Multi-factor** — more than one *factor* (kind of proof).
- **Conditional Access** — access granted *on conditions*.
- **Identity Protection** — protects *identities* (accounts).
- **Risky user / risky sign-in** — Microsoft's names for the two kinds of risk.

## problem

Together these features solve three problems:

1. **Stolen passwords** — MFA blocks most attempts that only have the password.
2. **Inconsistent security** — Conditional Access enforces the same rules everywhere, automatically.
3. **Finding the needle** — Identity Protection points analysts at the few risky sign-ins among millions.

## analogy

An airport:

- **MFA** — showing your passport *and* your boarding pass.
- **Conditional Access** — the rules: *if* you're flying international, *then* go through passport control; *if* you're on a watch list, you don't board.
- **Identity Protection** — the officer who notices that the same passport was used in two countries an hour apart, and flags it.

## how

### Step 1: How Conditional Access decides

Microsoft describes Conditional Access as **signals → decision → enforcement**.

**Signals** it can check:
- **User, group or agent** — who is signing in.
- **IP location** — named office networks, countries.
- **Device** — platform, and whether it is managed/compliant.
- **Application** — which app is being accessed.
- **Real-time risk** — from Identity Protection.

**Decisions** it can make:
- **Block access** — the strictest.
- **Grant access** — optionally requiring: MFA, a specific authentication strength, a compliant device, a hybrid-joined device, an approved app, a password change, or accepting terms of use.

> **Important timing fact:** Conditional Access is evaluated **after the first factor** (the password) succeeds. So a blocked sign-in in the logs still means the password was correct.

### Step 2: Report-only mode
Policies can run in **report-only** mode: they record what they *would* have done, without enforcing it. Admins use this to test policies safely.

### Step 3: How Identity Protection scores risk

Some detections run **in real time** (during sign-in), others **offline** (later, after analysis). Common ones:

| Detection | Kind | What it means |
|---|---|---|
| Anonymous IP address | Sign-in, real-time | Sign-in from Tor or an anonymizing VPN |
| Unfamiliar sign-in properties | Sign-in, real-time | IP, location, device or browser unusual for this user |
| Atypical travel | Sign-in, offline | Two sign-ins too far apart for the time between them |
| Password spray | Sign-in | Microsoft saw a spray attack **and** it correctly guessed this user's password |
| Malicious IP address | Sign-in, offline | IP known for attacks or high failure rates |
| Leaked credentials | User, offline | The user's real password was found in a breach dump |
| Attacker in the Middle | User, offline | The session was linked to a malicious reverse proxy (a fake sign-in page that relays to the real one) |
| User reported suspicious activity | User, offline | The user **denied** an MFA prompt and reported it |

### Step 4: Risk-based policies
Conditional Access can use risk directly, for example:
- *If sign-in risk is medium or high → require MFA.*
- *If user risk is high → require a secure password change.*

### Step 5: Licensing (exam-relevant)
- **Conditional Access** requires **Entra ID P1**.
- **Identity Protection** risk details and **risk-based** Conditional Access require **Entra ID P2**. Without P2, premium detections appear only as "Additional risk detected".

## realWorld

A company's baseline policies:

1. Require MFA for **all users**.
2. Require a **compliant device** for administrators.
3. **Block legacy authentication** (old protocols that can't do MFA).
4. If **sign-in risk** is medium or high → require MFA.
5. If **user risk** is high → require a secure password change.

## securityExample

An analyst reviews a **risky user** in Identity Protection:

1. Detection: **Unfamiliar sign-in properties** (high), then **Atypical travel**.
2. Sign-in log: success from a new country, MFA satisfied by **phone approval** at 03:10.
3. The user says they were asleep and didn't approve anything.
4. Audit log: a **new authentication method** (a second phone) was registered 5 minutes later.

Conclusion: the attacker had the password and the user mistakenly approved an MFA prompt (or the prompt was approved via a relayed sign-in), then registered their own MFA method to stay in.

## normal

- Most sign-ins pass Conditional Access with MFA satisfied.
- Occasional "unfamiliar sign-in properties" from real travel or a new phone.
- Low-risk detections that clear when the user completes MFA.

## suspicious

- **Several MFA prompts denied** by the user, then one approved — repeated prompting to wear the user down.
- **User reported suspicious activity** detections.
- **High user risk** (leaked credentials, attacker in the middle).
- **New MFA methods** registered right after a risky sign-in.
- Sign-ins that **only succeed** through legacy protocols or from excluded locations (gaps in policy).

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | "Unfamiliar sign-in properties" (low) on a new laptop; user confirms, MFA satisfied |
| **Suspicious** | "Atypical travel" plus single-factor success via an app excluded from MFA |
| **Confirmed malicious** | "Attacker in the Middle" detection, followed by a new MFA method and an inbox rule forwarding mail externally |

## abuse

Defensive view — weaknesses attackers look for:

- **Gaps in policies** — users, apps or locations excluded from MFA.
- **Legacy protocols** that cannot do MFA.
- **MFA fatigue** — sending prompt after prompt until the user approves one.
- **Fake sign-in pages that relay to the real one** ([[aitm|adversary-in-the-middle]]), capturing the session after MFA.

> Defenses: phishing-resistant MFA (security keys, passkeys), blocking legacy authentication, number matching in the Authenticator app, and reviewing policy exclusions.

## evidence

- Sign-in log fields: `ConditionalAccessStatus`, `ConditionalAccessPolicies` (which policies applied and their result), `AuthenticationRequirement`, `AuthenticationDetails`, `RiskLevelDuringSignIn`, `RiskState`.
- **Risk detections** — one record per detection.
- **Risky users / risky sign-ins** reports in Entra.
- **Audit log** — MFA method changes, policy changes, password resets.

## where

| Evidence | Where |
|---|---|
| Risky users, risky sign-ins, risk detections | Entra admin center → ID Protection |
| Risk detections in Sentinel | `AADUserRiskEvents` table (and `AADRiskyUsers`) |
| Policy results per sign-in | `SigninLogs` → `ConditionalAccessPolicies` |
| Policy changes | `AuditLogs` |

## analyst

### Investigating a risky user
1. Open the user in **Risky users** and read every **detection** and its time.
2. Compare with the **sign-in log**: IP, country, device, app, MFA result.
3. Ask the user (through a trusted channel) whether it was them.
4. Check the **audit log** for MFA method changes, app consents and role changes after the risky event.

### Remediating a confirmed compromise
1. **Revoke sessions** — invalidates existing tokens so the attacker is signed out.
2. **Reset the password** securely.
3. **Remove** any MFA methods, app consents or inbox rules the attacker added.
4. Mark the user **Confirm user compromised** (raises their risk to high, so risk-based policies apply) — or **Dismiss** / **Confirm safe** when it was a false alarm.
5. **Hunt** for the same IP or pattern on other accounts.

> Reset and revocation belong together: a password reset alone doesn't end a session that's already open.

## microsoft

- **Entra admin center** — Conditional Access, ID Protection (risky users, risky sign-ins, detections).
- **Microsoft Sentinel** — `SigninLogs`, `AADUserRiskEvents`, `AuditLogs` via the Entra ID connector.
- **Defender XDR** — Identity Protection alerts join unified incidents; automatic attack disruption can disable compromised users.
- **SC-200** — "Investigate and remediate compromised identities that are identified by Microsoft Entra ID".

> **Stable concept vs current UI:** signals/decisions/enforcement and risk types are stable; detection names and menu locations evolve — check the current "What are risk detections?" page.

## explainBack

Q: Explain Conditional Access as an if-then rule with your own example.
A: If someone tries to open the payroll app from outside the office network, then they must use MFA from a company-managed device — otherwise they're blocked.

Q: What's the difference between sign-in risk and user risk?
A: Sign-in risk is about one sign-in — was this attempt really the user? User risk is about the account as a whole — for example, its password has been found in a breach, so the account may be compromised regardless of any single sign-in.

Q: Why must you revoke sessions as well as reset the password?
A: The attacker may already hold a valid session token. Resetting the password stops new sign-ins with the old password but doesn't end the existing session; revoking sessions forces everyone to sign in again.
