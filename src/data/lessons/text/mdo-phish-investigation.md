## bridge

In **Phishing and email authentication** you learned how to read a suspicious email. In **Defender XDR** you learned how alerts from different products join one incident. This lesson puts them together: using **Microsoft Defender for Office 365** to find every copy of a phishing email, see who clicked, clean it up, and check whether anyone's account or computer was affected.

**Chain:** Phishing email → delivered / clicked → Defender for Office 365 evidence → scope (recipients, clicks) → remediation (remove, block) → check identity and endpoint

## what

### Microsoft Defender for Office 365 (MDO)
Microsoft's protection for email and collaboration (Outlook, Teams, SharePoint, OneDrive), on top of the built-in **Exchange Online Protection (EOP)**.

There are two plans:

| Plan | Adds |
|---|---|
| **Plan 1** | Safe Links, Safe Attachments, anti-phishing impersonation protection, **Real-time detections** |
| **Plan 2** | Everything in Plan 1, plus **Threat Explorer**, campaigns, automated investigation and response (AIR) and attack simulation training |

### The tools you will use

**Safe Links**
- Checks a link **when it's clicked**, not just when the email arrives — a link can be harmless at delivery and turned malicious later.

**Safe Attachments**
- Opens attachments in a protected test environment (a **sandbox**) to see what they do before delivery.

**Threat Explorer / Real-time detections**
- The investigation screen for email. Real-time detections (Plan 1) shows detections at delivery time; Threat Explorer (Plan 2) also shows post-delivery activity, more views and more actions.

**Zero-hour auto purge (ZAP)**
- Automatically removes a message **after** delivery if it's later found to be phishing or malware.

**User reported messages**
- When users press "Report phishing", the message appears for analysts on the **Submissions** page.

## why

Email filters catch most phishing, but not all:

- Attackers test their messages against filters.
- Links can be **switched to malicious after delivery**.
- New look-alike domains have **no bad reputation yet**.

So the SOC needs tools to **find** every copy of a bad message, see **who interacted** with it, **remove** it everywhere at once, and **check the consequences**.

## name

- **Safe Links / Safe Attachments** — making links and attachments *safe*.
- **Explorer** — you *explore* all email in the organization.
- **Zero-hour auto purge** — automatically *purges* messages found bad after the "zero hour" of delivery.
- **Campaign** — many related phishing emails sent as one coordinated attack.

## problem

A single phishing email might be sent to 400 people. Without these tools an analyst would have to:

- Search each mailbox by hand.
- Guess who clicked.
- Ask each user to delete it.

MDO answers **who got it, who clicked, and what to remove** in minutes.

## analogy

A contaminated food recall:

- **Explorer** is the distributor's records showing every shop that received the batch.
- **Click data** shows which customers actually bought and opened it.
- **Remediation** is pulling the batch from every shelf at once.
- **ZAP** is the automatic recall that happens when a lab later finds the batch was bad.

## how

### Step 1: Start from the alert or the report

You might start from:
- an **alert** such as "A potentially malicious URL click was detected",
- a **user report** in Submissions,
- or a **hunting** query.

### Step 2: Look at the message
Open the **email entity page** (in the Defender portal) to see:
- headers and authentication results (SPF/DKIM/DMARC, compauth),
- URLs and their verdicts,
- attachments and detonation results,
- delivery location and any later actions (like ZAP).

### Step 3: Find every copy (scope)
In **Threat Explorer**, filter by sender, sender domain, subject, URL domain or attachment hash to list **all recipients** and **where it landed** (inbox, junk, quarantine).

### Step 4: Find who clicked
Use the **URL clicks** view or the `UrlClickEvents` table:
- **ClickAllowed** — the user reached the site.
- **ClickBlocked** — Safe Links stopped them.
- `IsClickedThrough` — the user clicked **through** a warning page.

### Step 5: Remediate the email
From Explorer, select the messages and **Take action**:
- **Move to junk**, **Move to deleted items**, **Soft delete** (recoverable) or **Hard delete** (permanent).
- Remediation needs the **Search and Purge** role.
- Actions are tracked in the **Action center**.

### Step 6: Block the source
Add the sender, domain, URL or file to the **Tenant Allow/Block List**, so new copies are blocked.

### Step 7: Check the consequences
For every user who **clicked**:
- **Identity** — new sign-ins from unusual IPs right after the click? (Entra sign-in logs)
- **Endpoint** — did a browser or Office app start anything unusual? (Defender for Endpoint)

### Message trace (for delivery questions)
**Message trace** (in the Exchange admin center) answers "was this message delivered, and where did it go?" — useful for delivery questions, but it doesn't show threat verdicts like Explorer does.

## realWorld

A user reports a suspicious invoice email:

1. Submissions shows the report; the email entity page shows a link to a recently registered domain.
2. Explorer finds **37 recipients**; 30 in inboxes, 7 in junk.
3. URL clicks: **3 users** clicked — 2 blocked by Safe Links, 1 allowed.
4. The analyst **soft deletes** all 37 copies and blocks the domain.
5. The one user whose click was allowed is checked: a sign-in from an unfamiliar IP 4 minutes later → the identity response from the Entra lesson begins (revoke sessions, reset password).

## securityExample

ZAP removes a message 20 minutes after delivery when its URL is re-classified as phishing. The analyst still checks `UrlClickEvents`: two users clicked during those 20 minutes. ZAP removed the email, but **it can't undo a click** — those two users need an identity check.

## normal

- Most phishing is blocked or junked before delivery.
- Safe Links blocks most clicks on known-bad URLs.
- ZAP quietly cleans up a few messages each day.
- User reports often turn out to be legitimate marketing (useful for tuning, not alarming).

## suspicious

- Phishing **delivered to inboxes** rather than junk.
- **ClickAllowed** on a URL later found malicious.
- **Click-through** past a Safe Links warning.
- Many recipients in the **finance or executive** groups.
- A **sign-in from a new IP** shortly after a click.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A phishing email junked for 50 users, nobody clicked |
| **Suspicious** | Delivered to 12 inboxes, 2 clicks allowed |
| **Confirmed malicious** | One clicker then signed in from a hosting-provider IP and created a mail-forwarding rule |

## abuse

Defensive view of how attackers try to get past email defenses:

- **Delayed weaponization** — a harmless link at delivery that turns malicious later (why Safe Links checks at click time).
- **Links to trusted services** (file-sharing sites) hosting the real phishing page.
- **QR codes** in images to move the click to a phone.
- **Compromised supplier accounts** that pass authentication.

## evidence

| Evidence | What it tells you |
|---|---|
| Delivery records | Who got it, where it landed, which policy acted |
| URL and attachment records | What was inside |
| Click records | Who clicked, allowed or blocked |
| Post-delivery actions | ZAP, manual remediation |
| User submissions | Who reported it |

## where

| Evidence | Advanced Hunting table |
|---|---|
| Delivery and verdicts | `EmailEvents` |
| URLs | `EmailUrlInfo` |
| Attachments | `EmailAttachmentInfo` |
| Clicks | `UrlClickEvents` |
| ZAP and manual remediation after delivery | `EmailPostDeliveryEvents` (ActionType: *Manual remediation*, *Phish ZAP*, *Malware ZAP*) |

All of these join on **`NetworkMessageId`**.

## analyst

A phishing response checklist:

1. **Confirm** it's malicious (headers, domain age, URL/attachment verdicts).
2. **Scope**: all recipients, delivery locations.
3. **Clicks**: allowed, blocked, clicked-through.
4. **Remediate**: remove from all mailboxes (soft delete is recoverable).
5. **Block**: sender, domain, URL, file.
6. **Consequences**: identity and endpoint checks for every clicker.
7. **Document** and **feed back**: tune policies, thank the reporter.

## microsoft

- **Defender for Office 365** — Safe Links, Safe Attachments, anti-phishing, Explorer/Real-time detections, AIR, campaigns.
- **Defender XDR** — email alerts join incidents with identity and endpoint alerts; automatic attack disruption can act on compromised accounts in BEC and adversary-in-the-middle attacks.
- **Sentinel** — the Defender XDR connector can stream the email tables for longer retention.
- **SC-200** — "Investigate and remediate threats by using Microsoft Defender for Office 365, including automatic attack disruption".

> **Stable concept vs current UI:** the investigate → scope → remediate → check-consequences flow is stable; Explorer views and button names change — check Microsoft's docs.

## explainBack

Q: Why does Safe Links check a link when it's clicked rather than only when the email arrives?
A: An attacker can send a link that's harmless at delivery and switch it to a malicious page later. Checking at click time catches that switch.

Q: ZAP removed a phishing email from everyone's inbox. Is the incident over?
A: Not necessarily. ZAP can't undo what happened before it acted. Anyone who clicked the link or opened the attachment in the meantime still needs checking for suspicious sign-ins or activity on their computer.

Q: Which column links the email tables together, and why does that matter?
A: NetworkMessageId — it's the unique ID of each message, so you can go from the delivery record to its links, attachments, clicks and later clean-up actions.
