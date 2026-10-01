## bridge

You've learned how accounts sign in (**Entra ID**) and how names become addresses (**DNS**). Most account compromises start with an **email** that tricks someone. This lesson explains how email actually travels, why it's easy to fake a sender, and how three DNS-based checks — **SPF, DKIM and DMARC** — help receivers spot fakes.

**Chain:** Email sent → travels between mail servers → receiver checks SPF/DKIM/DMARC → verdict → delivered, junked or blocked → evidence for investigation

## what

### Phishing
**Phishing** is a deceptive message designed to make someone click a link, open an attachment, reveal a password, or send money. Most phishing arrives by email.

### Business Email Compromise (BEC)
**BEC** is fraud that impersonates — or actually uses — a trusted business email account (a CEO, a supplier) to trick staff into paying money or sending sensitive data. BEC often contains **no link or attachment at all** — just a convincing request.

### Email spoofing
**Spoofing** means forging the sender address so an email appears to come from someone else.

### The three email authentication checks

**SPF — Sender Policy Framework**
- The domain owner publishes a DNS record listing **which mail servers may send** email for the domain.

**DKIM — DomainKeys Identified Mail**
- The sending server adds a **digital signature** to each email. The receiver checks it using a public key published in DNS. If the message was altered, or wasn't signed by the domain, the check fails.

**DMARC — Domain-based Message Authentication, Reporting and Conformance**
- The domain owner publishes a **policy** saying what receivers should do when a message fails: nothing (`p=none`), send to junk (`p=quarantine`), or reject (`p=reject`).
- DMARC also checks **alignment**: the domain the reader sees must match the domain that passed SPF or DKIM.

## why

Email was designed in the early 1980s, when the internet was a small trusted network. The original protocol (SMTP) **doesn't check that a sender is who they claim to be** — anyone can write any "From" address.

As email became the main business tool, criminals used this weakness for spam, fraud and phishing. SPF, DKIM and DMARC were added later as DNS-based checks, so receivers can verify that a message really came from the domain it claims.

## name

- **Phishing** — a play on "fishing": throwing out bait and waiting for someone to bite.
- **Spoofing** — an old word for a hoax or trick.
- **Sender Policy Framework** — a framework for publishing *which senders* a domain allows.
- **DomainKeys Identified Mail** — mail *identified* by a domain's cryptographic *keys*.
- **DMARC** — ties SPF and DKIM together, adds a policy, and sends *reports* back to the domain owner.

## problem

These checks solve two problems:

1. **Exact-domain spoofing** — someone sending as `ceo@contoso.com` from a server Contoso never authorized. SPF/DKIM fail; DMARC tells the receiver to junk or reject it.
2. **Visibility for domain owners** — DMARC reports show who is sending email using your domain.

> What they **don't** solve: look-alike domains such as `contoso-helpdesk.example` or `c0ntoso.com`. The attacker owns those domains and can set up SPF, DKIM and DMARC perfectly. A message can **pass all three checks and still be phishing**.

## analogy

A letter sent through the post:

- The **envelope** (with a return address) is what the post office uses — that's the **MAIL FROM** address.
- The **letterhead** inside is what the reader sees — that's the **From:** header. Anyone can print any letterhead.
- **SPF** is a list, published by the company, of which post offices are allowed to send its letters.
- **DKIM** is a wax seal pressed with the company's ring — if the seal is broken or missing, the letter may have been tampered with.
- **DMARC** is the company's instruction to every mailroom: "If our seal or post office doesn't check out, *bin it*."

## how

### Step 1: The anatomy of an email

**Headers** — information about the message:

| Header / field | What it is | Can it be faked? |
|---|---|---|
| **From:** | The sender shown to the reader | Yes — anyone can type any From address |
| **Display name** | The friendly name next to the address (e.g. "IT Support") | Yes — very easily |
| **Reply-To:** | Where replies go — can differ from From | Yes — a classic BEC trick |
| **MAIL FROM** (envelope sender / Return-Path) | The address mail servers use behind the scenes; SPF checks this domain | Yes, but SPF can catch it |
| **Received:** lines | One line added by each mail server the message passed through | Only the lines added by *your own* servers are trustworthy |
| **Authentication-Results** | The receiving server's verdicts for SPF, DKIM and DMARC | Added by the receiver — trustworthy if added by your system |

**Body** — the message itself, which may contain **links** and **attachments**.

### Step 2: How the checks run when a message arrives

1. The receiving mail server notes which IP address delivered the message.
2. **SPF:** it looks up the SPF record of the MAIL FROM domain — is that IP on the list?
3. **DKIM:** it verifies the signature using the public key in the signing domain's DNS.
4. **DMARC:** it checks whether SPF or DKIM passed **and** aligns with the From: domain, then applies the domain's policy.
5. Microsoft 365 also calculates **composite authentication (compauth)** — its own overall verdict combining these checks with other signals.

### Step 3: What each record looks like (examples)

```
SPF   (TXT on contoso.com):           v=spf1 include:spf.protection.outlook.com -all
DMARC (TXT on _dmarc.contoso.com):    v=DMARC1; p=reject; rua=mailto:dmarc@contoso.com
DKIM  (TXT on selector1._domainkey…): v=DKIM1; k=rsa; p=<public key>
```

### Step 4: Common phishing types

| Type | What it does | Typical evidence |
|---|---|---|
| **Credential phishing** | Link to a fake sign-in page | URL in the email; a click; a sign-in from a new IP soon after |
| **Malicious attachment** | A file that runs harmful code when opened | Attachment hash; a process started by an Office app or PDF reader |
| **BEC / invoice fraud** | A request to change bank details or pay urgently | Look-alike sender or compromised real account; Reply-To pointing elsewhere |
| **Adversary-in-the-middle phishing** | A fake page that relays to the real sign-in page and steals the session after MFA | Sign-in from a hosting IP right after the click; "Attacker in the Middle" risk detection |

## realWorld

A legitimate newsletter from a marketing service:

- From: `news@contoso.com`
- SPF **pass** (the marketing service's servers are listed in Contoso's SPF record)
- DKIM **pass** (signed with Contoso's key)
- DMARC **pass**, compauth **pass** → delivered to the inbox.

## securityExample

A message arrives:

- Display name: **"Contoso IT Support"**
- From: `it-support@contoso-helpdesk.example` — a **look-alike domain** registered three days ago
- Reply-To: a free webmail address
- Subject: "Action required: your password expires today"
- A link to a page that looks like the Microsoft sign-in page
- SPF **pass**, DKIM **pass**, DMARC **pass** — the attacker owns the domain and set it up correctly

**Lesson:** passing authentication proves only that the message really came from `contoso-helpdesk.example`. It doesn't prove that domain is trustworthy. The display name, new domain, urgency, mismatched Reply-To and credential link are what make it phishing.

## normal

- Internal mail and trusted partners pass SPF, DKIM and DMARC.
- Marketing tools send on behalf of the company **because the company authorized them** in SPF/DKIM.
- Reply-To differs from From only for known systems (e.g. a ticketing tool).

## suspicious

- **Display name that doesn't match the address** ("CEO Name" from a free webmail address).
- **Look-alike domains** — swapped letters, extra words, different top-level domain.
- **Reply-To** pointing to a different, external address.
- **SPF/DKIM/DMARC fail** for a domain that normally passes.
- **Urgency and pressure** — "today", "immediately", "confidential".
- Requests to **change payment details** or **buy gift cards**.
- Links whose visible text doesn't match the real destination.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | An invoice from a known supplier's real domain, all checks pass, expected |
| **Suspicious** | An invoice from a supplier's look-alike domain asking to "update bank details" |
| **Confirmed malicious** | The look-alike domain was registered yesterday, Reply-To is a free webmail address, and the supplier confirms by phone they never sent it |

## abuse

Defensive view of how attackers exploit email:

- **Look-alike domains** that pass authentication.
- **Compromised real accounts** — messages from a genuine supplier's hacked mailbox pass every check.
- **Display-name spoofing** — relying on people reading the name, not the address.
- **Domains without DMARC enforcement** (`p=none`) — easier to spoof exactly.

> Defenses combine technology (authentication, link and attachment scanning, impersonation protection) with people (training, a "report phishing" button, verifying payment changes by phone).

## evidence

- **Message headers** — From, Reply-To, MAIL FROM, Received lines, Authentication-Results.
- **Delivery verdicts** — delivered, junked, quarantined, blocked, and why.
- **URLs and attachments** in the message.
- **Clicks** on links.
- **What happened next** — sign-ins, processes, file downloads.

## where

| Evidence | Where |
|---|---|
| Full headers | Outlook → View message details; Defender portal email entity page |
| SPF/DKIM/DMARC results | `Authentication-Results` header; `AuthenticationDetails` column in `EmailEvents` |
| Message delivery and verdicts | `EmailEvents` (Defender for Office 365) |
| Links and attachments | `EmailUrlInfo`, `EmailAttachmentInfo` |
| Clicks | `UrlClickEvents` (Safe Links) |
| Domain's published records | DNS lookup (`nslookup -type=TXT domain`) |

## analyst

Triage of a reported email:

1. **Read the headers**, not just the display name: From, Reply-To, MAIL FROM, authentication results.
2. **Check the domain**: look-alike? newly registered? reputation?
3. **Inspect links and attachments** safely — never open them on your own machine; use the security tools' detonation results.
4. **Find everyone who received it** and **who clicked or opened** it.
5. **Check what happened next** for those users — sign-ins, processes.
6. **Remove** the message from all mailboxes and **block** the sender/domain/URL if malicious.

## microsoft

- **Exchange Online Protection (EOP)** — built-in filtering for every Microsoft 365 mailbox, including SPF/DKIM/DMARC checks and composite authentication.
- **Microsoft Defender for Office 365** — adds **Safe Links** (checks links at click time), **Safe Attachments** (opens attachments in a sandbox), **anti-phishing impersonation protection**, and investigation tools (next lesson).
- **Advanced Hunting** — `EmailEvents.AuthenticationDetails` holds SPF/DKIM/DMARC/compauth verdicts as text you can parse with `parse_json()`.

## explainBack

Q: Explain SPF, DKIM and DMARC to a non-technical colleague using a letter.
A: SPF is the company's published list of post offices allowed to send its letters. DKIM is a seal pressed with the company's ring that proves the letter wasn't altered. DMARC is the company's instruction to every mailroom saying what to do with letters that fail those checks — let them through, put them aside, or bin them.

Q: An email passes SPF, DKIM and DMARC. Can it still be phishing?
A: Yes. The checks only prove the message really came from the domain it claims. If the attacker registered a look-alike domain and set it up properly, everything passes — you have to judge the domain, the content and the request.

Q: Why is the Reply-To header important in business email compromise?
A: The From address may look legitimate, but Reply-To can send your answer to the attacker's mailbox, so the conversation continues with the criminal without the victim noticing.
