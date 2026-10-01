## bridge

So far your investigations have focused on attackers: phishing, malware, stolen identities. But some of the most damaging incidents are about **data** — sensitive files emailed outside the company, a departing employee downloading customer lists, or an attacker reading mailboxes. **Microsoft Purview** is Microsoft's data security and compliance family. For a SOC analyst, four parts matter most: **data loss prevention (DLP)** alerts, **insider risk management** alerts, the **audit log**, and **content search**.

**Chain:** Sensitive data (labels, sensitive info types) → DLP policies detect risky sharing → alerts in the Defender portal → insider risk signals for user behavior → audit log shows who did what → content search finds and removes copies → coordinate with HR, legal and privacy

## what

### 1. Data loss prevention (DLP)
**DLP** policies detect and optionally block sensitive information leaving where it should be. They look for **sensitive information types** (credit card numbers, passport numbers, health data) or **sensitivity labels**, across locations such as:
- Exchange email, SharePoint and OneDrive, Teams chats;
- **endpoints** (copy to USB, upload to a website, print);
- and more.

Actions include **notifying** the user (policy tips), **blocking** with or without override, and **alerting** the security team. DLP alerts appear in the **Microsoft Defender portal**, where they can join incidents with other alerts.

### 2. Insider risk management
**Insider risk management** correlates signals about **user behavior** — for example a resignation date from HR combined with unusual downloads — to find risky activity by people *inside* the organization. Alerts become **cases** handled with HR and legal. User names are **pseudonymized** by default to protect privacy. Insider risk alerts can also be viewed in the Defender portal when access is provisioned.

### 3. The unified audit log (Microsoft Purview Audit)
Records thousands of user and admin activities across Microsoft 365: sign-ins to services, mailbox actions, file access, sharing, admin changes.

| | Audit (Standard) | Audit (Premium) |
|---|---|---|
| Retention | **180 days** | **1 year** by default for Entra ID, Exchange, OneDrive and SharePoint records; up to **10 years** with an add-on license |
| Retention policies | — | ✓ custom audit retention policies |
| Intelligent insights | — | ✓ e.g. `MailItemsAccessed` details, search activity |

### 4. Content search (eDiscovery)
**Content search** finds messages and documents across mailboxes, SharePoint, OneDrive and Teams using conditions (sender, subject, dates, keywords). SOC teams use it to **find every copy** of a phishing email or a leaked document — and, with the right permissions, to **purge** emails.

> Content search uses **Keyword Query Language** (also abbreviated KQL) — a different language from the Kusto Query Language you use in Sentinel.

## why

Data incidents need Purview because:

- Attack tools focus on devices and identities; **the data itself** needs its own policies and evidence.
- Not every data incident is an attack — a well-meaning employee emailing a spreadsheet of salaries is still a breach.
- **Regulations** (privacy, health, finance) may require knowing exactly what data was exposed and to whom.
- **Insider** cases are sensitive: privacy, employment law and HR processes must be followed.

## name

- **Purview** — "the range of vision": a view across all your data.
- **Data loss prevention** — *preventing* sensitive data being *lost* (leaked).
- **Insider risk** — *risk* from people *inside* the organization, whether malicious or careless.
- **eDiscovery** — *electronic discovery*: the legal process of finding electronic information for cases.
- **Audit** — from Latin *audire*, "to hear": an official record of what happened.

## problem

Purview helps an analyst answer:

1. **Did sensitive data leave, and how?** — DLP alerts and endpoint DLP events.
2. **Is this user's behavior risky?** — insider risk signals over time.
3. **Who accessed or changed what in Microsoft 365?** — audit log (e.g. inbox rules, mailbox access, file sharing).
4. **Where are all copies of this email or file?** — content search.
5. **What exactly was exposed, for compliance reporting?** — audit plus content search.

## analogy

A bank:

- **DLP** — a guard at the exit who checks bags for documents stamped "Confidential".
- **Insider risk management** — a supervisor who notices that an employee who just resigned is suddenly photocopying customer files at night.
- **Audit log** — the visitor book and door-access records: who went where, when.
- **Content search** — searching every filing cabinet in the building for copies of a specific letter.
- **Pseudonymization** — the supervisor reports "Employee 47" until there's a real reason to reveal the name.

## how

### Step 1: Triage a DLP alert
1. **What policy and data?** — which sensitive info type or label, how many items or matches.
2. **Who and where?** — user, location (email, OneDrive sharing, USB copy, upload), destination (external domain, personal storage).
3. **Was it blocked?** — policy action: blocked, overridden by the user (with justification), or only audited.
4. **Intent and context** — a one-off mistake, a business process, or part of a pattern? Check other alerts for the same user.

### Step 2: Use the audit log
Common SOC searches:
| Question | Activities to search |
|---|---|
| Did someone create a forwarding or hiding inbox rule? | `New-InboxRule`, `Set-InboxRule`, `UpdateInboxRules` |
| Was a mailbox read by someone else or an app? | `MailItemsAccessed` (Audit Premium) |
| Were files shared externally or downloaded in bulk? | `SharingSet`, `AnonymousLinkCreated`, `FileDownloaded` |
| Who changed admin settings? | Admin activities in Exchange, SharePoint, Entra ID |

In Advanced Hunting, many of these activities also appear in `CloudAppEvents` (when Defender for Cloud Apps is connected to Microsoft 365).

### Step 3: Use content search for scoping and cleanup
1. Create a search: sender address, subject, date range — or a file name.
2. Review results and counts by mailbox.
3. Export for evidence if needed; **purge** malicious emails if required (or remediate through Defender for Office 365 Explorer, which is usually faster for phishing).

### Step 4: Work with the right people
Insider risk and DLP cases often involve **HR, legal and privacy** teams. Keep evidence factual, follow the documented process, and share details only on a need-to-know basis.

## realWorld

A typical week:
- 40 DLP alerts, mostly users emailing documents containing credit card numbers to suppliers — policy tips taught them to use the secure portal; 2 were overridden with business justification.
- 1 insider risk alert: a departing engineer downloaded an unusual volume of design files — handed to HR and legal with the evidence.
- Several audit log searches during a business email compromise investigation to find inbox rules and mailbox access.

## securityExample

A DLP alert in the Defender portal: a user uploaded a file containing 900 customer records to a personal cloud storage site from a work laptop (endpoint DLP, action: audit only).

The analyst:
1. Checks the **incident**: the same user had a risky sign-in alert two days earlier from an unknown country.
2. Uses the **audit log**: the account created an inbox rule forwarding mail to an external address on the same day as the risky sign-in.
3. Concludes the **account is compromised** — this may not be the employee at all.

Response: revoke sessions, reset the password, remove the inbox rule, isolate the laptop for investigation, preserve evidence, and inform the privacy team about the possible exposure of 900 customer records. The DLP policy is changed from audit to **block** for uploads of customer data to unsanctioned sites.

## normal

- DLP **policy tips** that educate users, with occasional justified overrides.
- Sensitive data shared with **known partners** through approved channels.
- Audit records of routine admin work by known admins.
- Content searches run by authorized investigators with a ticket.

## suspicious

- **Bulk** sensitive data sent to personal email or personal cloud storage.
- DLP **overrides** with vague justifications, repeated by the same user.
- **Inbox rules** that forward externally or move mail to obscure folders.
- **MailItemsAccessed** by unusual apps or from unusual IPs.
- Unusual **downloads or USB copies** by users with a resignation date.
- **Anonymous sharing links** created for sensitive files.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A finance user emails an invoice with a bank account number to a known supplier; policy tip shown |
| **Suspicious** | 900 customer records uploaded to personal cloud storage |
| **Confirmed malicious** | The upload followed a risky sign-in and a new external forwarding rule on the same account |

## abuse

Defensive view of data-focused threats:

| Threat | Example | Defensive control |
|---|---|---|
| Exfiltration by compromised accounts | Attacker forwards or downloads mail and files | DLP, inbox-rule alerts, audit monitoring |
| Malicious insider | Departing employee takes customer data | Insider risk policies, endpoint DLP |
| Accidental exposure | Sensitive file shared with "anyone with the link" | DLP for sharing, sensitivity labels |
| Evidence destruction | Deleting mail or logs to hide activity | Audit retention (Premium), retention policies |

## evidence

- **DLP alerts and events** — policy, matched data, user, location, action, override justification.
- **Insider risk alerts and cases** — risk indicators over time.
- **Unified audit log** — user and admin activities across Microsoft 365.
- **Content search results** — every copy of a message or document.

## where

| Evidence | Where |
|---|---|
| DLP and insider risk alerts | Microsoft Defender portal incidents and alerts; `AlertInfo` / `AlertEvidence` |
| Microsoft 365 activities (inbox rules, file activity) | Purview Audit search; `CloudAppEvents` in Advanced Hunting |
| Office 365 activity in Sentinel | `OfficeActivity` (Microsoft 365 connector) |
| Copies of messages and files | Purview Content search |

## analyst

For data incidents:

1. **What data, how much, how sensitive?**
2. **Who, how, to where — and was it blocked?**
3. **Is it an attacker, a malicious insider, or a mistake?** Check identity and endpoint alerts for the same user.
4. **Scope:** audit log and content search for all related activity and copies.
5. **Involve the right teams** (privacy, legal, HR) and document facts carefully.

## microsoft

- **Microsoft Purview Data Loss Prevention** — policies for email, SharePoint, OneDrive, Teams, endpoints and more; alerts in the Defender portal.
- **Microsoft Purview Insider Risk Management** — risk indicators, policies, alerts and cases, with pseudonymization; alerts viewable in Defender when provisioned.
- **Microsoft Purview Audit** — Standard (180 days) and Premium (1 year default for core workloads, up to 10 years with add-on).
- **Microsoft Purview eDiscovery** — content search, export and purge actions.

## explainBack

Q: How is a DLP alert different from a malware alert?
A: A malware alert is about malicious software doing something. A DLP alert is about sensitive data moving somewhere it shouldn't — often caused by a person making a mistake, but sometimes by an insider or an attacker using a compromised account.

Q: Why might you need Audit (Premium) during a mailbox compromise investigation?
A: It keeps core audit records for a year instead of 180 days and provides detailed events like MailItemsAccessed, which show which messages were read — essential for knowing what the attacker saw.

Q: Why are insider risk cases handled differently from external attacks?
A: They concern employees, so privacy, employment law and HR processes apply. Names are pseudonymized by default, evidence must be factual, and details shared only with people who need them.
