## bridge

In the Entra ID lessons you learned how sign-ins are logged and how Conditional Access decides who gets in. This lesson looks at the same sign-ins **from the defender's side of an attack**: what different password attacks look like in the logs, what multifactor authentication (MFA) does and does not stop, and why stolen **sessions and tokens** have become as important as stolen passwords.

**Chain:** Password attacks (guessing, spraying, stuffing) → MFA stops most of them → attackers target MFA and sessions instead → tokens and cookies → sign-in logs and risk detections → revoke, reset, harden

## what

### 1. Three kinds of password attack
| Attack | Pattern | Shape in the logs |
|---|---|---|
| **[[brute-force|Brute force]]** | Many passwords against **one** account | Many failures for one user, often ending in a lockout |
| **[[password-spraying|Password spraying]]** | One or two common passwords against **many** accounts | One source, many users, few attempts each — avoids lockouts |
| **Credential stuffing** | Username/password pairs **leaked from other websites** | Many users, many sources, a surprising success rate |

### 2. Multifactor authentication and its limits
MFA requires two or more of: something you **know** (password), something you **have** (phone, security key), something you **are** (fingerprint, face).

MFA blocks the vast majority of password attacks — a stolen password alone is not enough. But attackers adapt:
- **MFA fatigue** ("push bombing") — sending approval prompts again and again until a tired user taps *Approve*. **Number matching** (typing a number shown on screen) defeats this.
- **[[aitm|Adversary-in-the-middle (AiTM) phishing]]** — a fake sign-in page relays everything to the real one, then **steals the session cookie** issued *after* MFA.
- **SIM swapping** — taking over a phone number to receive text-message codes.

**Phishing-resistant MFA** — FIDO2 security keys, passkeys, Windows Hello for Business, certificate-based authentication — is tied to the real website, so a fake page can't use it.

### 3. Sessions and tokens
After you sign in, you don't type your password for every click. Instead you receive:
- an **access token** — a short-lived pass (typically about an hour) that apps accept;
- a **refresh token** — used quietly to get new access tokens for much longer;
- in browsers, a **session cookie**;
- on Windows devices joined to Entra ID, a **Primary Refresh Token (PRT)** that gives single sign-on to Microsoft services.

> Whoever holds a valid token **is treated as you** — without your password and without MFA. That is why token theft matters.

### 4. Legacy authentication
Old protocols (POP3, IMAP4, older Exchange ActiveSync clients, authenticated SMTP — Simple Mail Transfer Protocol) send a username and password with every request and **cannot do MFA**. Attackers favor them for spraying. Microsoft has disabled basic authentication for most Exchange Online protocols, and Conditional Access can block legacy authentication entirely.

## why

Identity attacks are so common because **identity is the new perimeter**:

- Cloud apps are reachable from anywhere, so the login page *is* the front door.
- Passwords are reused, guessable and frequently leaked.
- MFA was the answer — so attackers moved to tricking users into approving MFA, or stealing what is issued **after** MFA (sessions and tokens).

Defenders need to recognize each pattern because the **response differs**: a spray needs blocking and checking for successes; a stolen token needs **session revocation**, because a password reset alone may not end it.

## name

- **Brute force** — trying every possibility by force rather than cleverness.
- **Spraying** — spreading a few passwords thinly across many accounts, like spraying paint.
- **Credential stuffing** — stuffing stolen credentials into another site's login form.
- **Token** — like an arcade token: a small object that stands in for payment (here, for your identity).
- **Adversary-in-the-middle** — the attacker sits *in the middle* between you and the real site.

## problem

These ideas let an analyst answer:

1. **Which attack is this?** — The shape of failures tells you (one user vs many, one source vs many).
2. **Did any attempt succeed?** — The most important question after any password attack.
3. **Was MFA actually required and passed?** — Or was the sign-in single-factor?
4. **Could a session have been stolen?** — Successful sign-in with MFA, but from an unusual place right after a phishing click.
5. **What must be revoked?** — Password, sessions, MFA methods, app consents.

## analogy

A hotel:

- **Brute force** — trying every key on one room door.
- **Spraying** — trying the single most common key on every door in the hotel.
- **Credential stuffing** — using keys stolen from *another* hotel, hoping guests reused them.
- **MFA** — the door also needs your fingerprint.
- **MFA fatigue** — ringing your room phone 50 times at 3 a.m. until you say "fine, open it".
- **Session token** — the wristband you get at check-in. Steal the wristband and you walk past the front desk without a key or fingerprint.
- **Revoking sessions** — the hotel cancels every wristband for that room.

## how

### Step 1: Read the failure pattern
| Question | Brute force | Spraying | Stuffing |
|---|---|---|---|
| Users per source IP | 1 | Many | Many |
| Attempts per user | Many | 1–3 | 1–2 |
| Lockouts | Common | Rare (on purpose) | Rare |

Entra ID result codes you'll see often:

| ResultType | Meaning |
|---|---|
| `0` | Success |
| `50126` | Invalid username or password |
| `50053` | Account locked (smart lockout) or sign-in blocked |
| `50074` | Strong authentication (MFA) required — user was prompted |
| `500121` | Authentication failed during the MFA request (e.g. denied or not answered) |
| `53003` | Blocked by Conditional Access |

### Step 2: Check MFA
In `SigninLogs`, `AuthenticationRequirement` shows `singleFactorAuthentication` or `multiFactorAuthentication`. A successful **single-factor** sign-in to a sensitive app after a spray is high priority.

### Step 3: Recognize MFA fatigue
Many `500121` failures for one user within minutes, followed by a **success**, suggests the user eventually approved a prompt they didn't start.

### Step 4: Recognize possible token theft
- A successful sign-in with MFA from an **unfamiliar IP or country**, shortly after the user clicked a link in an email.
- The **same session** used from two very different locations.
- Identity Protection risk detections such as *anomalous token* or *attacker in the middle*.

### Step 5: Respond in the right order
1. **Revoke sessions** — invalidates the user's refresh tokens and session cookies so sessions can't be renewed. Already-issued access tokens may work until they expire (often within the hour); apps that support **Continuous Access Evaluation** stop accepting them much sooner.
2. **Reset the password** (and check it wasn't reused elsewhere).
3. **Review MFA methods** — remove any the attacker registered.
4. **Look for persistence** — inbox rules, app consents, new devices.
5. **Close the gap** — require phishing-resistant MFA, block legacy auth, use number matching.

## realWorld

A company's sign-in logs show, every week:

- Hundreds of `50126` failures from various internet IPs, spread thinly across many accounts (background spraying).
- A few lockouts from users who forgot their password after a holiday.
- Almost no legacy-protocol sign-ins, because Conditional Access blocks them.
- Occasional risky sign-in detections, most closed after the user confirms they were travelling.

## securityExample

An analyst investigates user `maria@contoso.com`:

1. 09:02 UTC — Maria clicks a link in an email that looks like a document-sharing notice.
2. 09:03 — a successful sign-in **with MFA** from an IP hosted at a cloud provider in another country.
3. 09:10 — that session creates an inbox rule moving messages containing "invoice" to an RSS folder.

Maria passed MFA herself — on a fake page that relayed it. The attacker used the **session issued after MFA**. Response: revoke all sessions, reset the password, delete the inbox rule, check for other recipients of the phishing email, and plan phishing-resistant MFA for finance staff.

## normal

- A steady background of failures (`50126`) from the internet — every public login page gets them.
- Users failing once or twice, then succeeding from their usual device and location.
- MFA prompts that users start themselves, answered once.
- Sign-ins from new locations that match travel or a new home connection, confirmed by the user.

## suspicious

- **One IP, many accounts**, one or two attempts each (spraying).
- **Any success** from an IP that produced many failures.
- **Repeated MFA denials** (`500121`) followed by an approval.
- **Single-factor** successful sign-ins to sensitive apps.
- **Legacy authentication** sign-ins (IMAP4, POP3, authenticated SMTP) where they should be blocked.
- **Successful MFA sign-in from an unusual location** right after a phishing click.
- New **MFA methods registered** right after a risky sign-in.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A user mistypes their password twice, then signs in from their laptop |
| **Suspicious** | 14 MFA denials in 6 minutes for one user, at 02:00 their time |
| **Confirmed malicious** | The 15th prompt is approved, and that session immediately registers a new authenticator app |

## abuse

Defensive summary:

| Attack | Defensive control | Detection |
|---|---|---|
| Brute force | Smart lockout; strong passwords | Many failures for one account |
| Password spraying | MFA; banned common passwords | One source, many accounts |
| Credential stuffing | MFA; leaked-credential detection | Many accounts, unusual success rate |
| MFA fatigue | Number matching; phishing-resistant MFA | Repeated MFA denials then success |
| AiTM / token theft | Phishing-resistant MFA; compliant-device requirements; token protection | Risky sign-in detections; unusual session location |
| Legacy auth | Block with Conditional Access | Sign-ins by legacy client apps |

## evidence

- **Interactive sign-in logs** — user, IP, location, app, result code, MFA requirement, Conditional Access result.
- **Non-interactive sign-in logs** — token refreshes done by apps in the background.
- **Risk detections** — Entra ID Protection's assessment of risky users and sign-ins.
- **Audit logs** — MFA method registration, password resets, session revocations.
- **On-premises** — 4625 failures and lockouts on domain controllers for hybrid accounts.

## where

| Evidence | Where |
|---|---|
| Interactive sign-ins | `SigninLogs` |
| Background token use | `AADNonInteractiveUserSignInLogs` |
| Risk detections | `AADUserRiskEvents` |
| MFA registration, resets | `AuditLogs` |
| Domain sign-in failures | `SecurityEvent` (4625), `IdentityLogonEvents` |

## analyst

For any identity alert, answer in order:

1. **Shape:** which attack pattern do the failures show?
2. **Success:** did any attempt succeed — and was it single-factor or MFA?
3. **Session:** could a session or token have been stolen (location, timing, phishing click)?
4. **Persistence:** new MFA methods, inbox rules, app consents, devices?
5. **Response:** revoke sessions first, then reset, then remove persistence, then close the gap.

## microsoft

- **Microsoft Entra ID** — sign-in and audit logs; smart lockout; MFA with number matching; passkeys and other phishing-resistant methods.
- **Conditional Access** — require MFA or phishing-resistant MFA, block legacy authentication, require compliant devices.
- **Microsoft Entra ID Protection** — user and sign-in risk detections, including token-related detections.
- **Microsoft Defender XDR** — correlates phishing emails, clicks and risky sign-ins into one incident; automatic attack disruption can contain compromised users.
- **Microsoft Sentinel** — `SigninLogs`, `AADNonInteractiveUserSignInLogs`, `AuditLogs` and `AADUserRiskEvents` via the Entra ID connector.

## explainBack

Q: How would you tell password spraying from brute force in the logs?
A: Brute force is many attempts against one account. Spraying is one or two attempts each against many accounts, usually from the same source — it's designed to stay under the lockout threshold.

Q: If MFA was passed, how can an attacker still be in the account?
A: They may have stolen the session issued after MFA — for example through a fake sign-in page that relays the login — or tricked the user into approving a prompt. Whoever holds a valid session token is treated as the user.

Q: Why revoke sessions before resetting the password?
A: A stolen refresh token or session cookie doesn't need the password, so a reset alone may not end the attacker's session. Revoking sessions invalidates those tokens so they can't be renewed; the reset then stops the attacker signing back in with the password.
