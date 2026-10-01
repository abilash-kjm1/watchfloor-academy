## bridge

In the SOC lessons you met indicators of compromise (IOCs), indicators of attack (IOAs) and tactics, techniques and procedures (TTPs). **Threat intelligence** is where many of those come from: knowledge about attackers — who they are, what they want, how they operate and what traces they leave — collected and shared so defenders can act **before** or **while** being attacked.

This lesson explains the kinds of intelligence, why some indicators are almost worthless after a few days, how intelligence is shared in a standard format, and how it gets into Microsoft Sentinel and Defender.

**Chain:** Raw data about attacks → analysis → intelligence (strategic to technical) → shared as STIX over TAXII → indicators in Sentinel → matched against your logs → alerts and hunts → feedback

## what

### 1. Threat intelligence
**[[threat-intel|Threat intelligence]]** is **evidence-based knowledge** about threats that helps someone make a decision. Data becomes intelligence only when it is **relevant, analyzed and actionable**.

A list of 10,000 IP addresses with no context is **data**. "This group targets logistics companies, signs in with sprayed passwords from these hosting providers, and then creates inbox rules" is **intelligence**.

### 2. Four levels of intelligence
| Level | Audience | Question it answers | Example |
|---|---|---|---|
| **Strategic** | Executives | Who is likely to target us, and why? | "Ransomware groups are targeting our sector this year" |
| **Operational** | Security managers, incident response (IR) leads | What campaign is coming, and when? | "A phishing campaign impersonating our payroll provider is active" |
| **Tactical** | Detection engineers, hunters | How do they operate? | "They use encoded PowerShell launched from Office documents" (TTPs) |
| **Technical** | SOC tools | What exact traces do they leave? | Hashes, domains, IP addresses, URLs (IOCs) |

### 3. Indicators need context
A good indicator comes with:
- **Type and value** — e.g. domain `invoice-portal-login[.]com`.
- **Confidence** — how sure is the source (0–100)?
- **Validity** — when it became valid and **when it expires**.
- **Context** — which campaign, malware or actor; what it was used for.
- **Sharing rules** — the **Traffic Light Protocol (TLP)**: `TLP:CLEAR` (public), `TLP:GREEN` (community), `TLP:AMBER` (your organization and clients), `TLP:RED` (named recipients only).

### 4. The Pyramid of Pain
The **[[pyramid-of-pain|Pyramid of Pain]]** ranks indicators by how much pain it causes an attacker when you detect them:

| Level (bottom → top) | Attacker effort to change |
|---|---|
| Hash values | Trivial — recompile the file |
| IP addresses | Easy — rent a new server |
| Domain names | Simple — register a new domain |
| Network and host artifacts | Annoying — change tooling details |
| Tools | Challenging — find or build new tools |
| **TTPs** | **Tough** — change how they operate |

Detecting **behavior (TTPs)** hurts attackers most; hashes and IPs are useful but short-lived.

### 5. STIX and TAXII
- **STIX (Structured Threat Information Expression)** — a standard **format**, built on JSON (JavaScript Object Notation), for describing threat intelligence: indicators, malware, threat actors, attack patterns and the relationships between them.
- **TAXII (Trusted Automated Exchange of Intelligence Information)** — a standard **protocol** for sharing STIX over HTTPS: a server offers *collections* that clients poll or receive.

> STIX is the language; TAXII is the postal service.

## why

Threat intelligence exists because **no single organization sees enough attacks** to know everything coming its way. Sharing lets one victim's experience protect thousands of others.

It also helps defenders **prioritize**: there are far more vulnerabilities and alerts than people to handle them. Knowing which actors target your sector, and which techniques they actually use, tells you where to focus detections, hunts and patches.

Standards like STIX and TAXII exist so that intelligence from many sources can flow **automatically** into security tools, instead of analysts copying indicators from PDFs.

## name

- **Intelligence** — from military and government use: information that has been analyzed to support decisions.
- **Indicator** — something that *indicates* (points to) malicious activity.
- **Pyramid of Pain** — named by security researcher David Bianco in 2013 for the pain each level causes adversaries.
- **Traffic Light Protocol** — red, amber, green, like traffic lights, plus clear for unrestricted.
- **STIX / TAXII** — acronyms describing what each does: a *structured expression* of threat information, and a *trusted automated exchange* of it. Both are now maintained by the standards body OASIS.

## problem

Threat intelligence lets an analyst answer:

1. **Has this indicator been seen before, and in what context?** — enrichment during triage.
2. **Are we affected by this new campaign?** — search your logs for its indicators and behaviors.
3. **Which detections should we build next?** — tactical intelligence about TTPs used against your sector.
4. **Is this alert worth waking someone up for?** — a match on a high-confidence, current indicator linked to ransomware is more urgent than a low-confidence old IP.

## analogy

A neighborhood watch:

- **Technical intelligence** — the license plate of a car seen at a burglary. Useful, but the burglar can switch cars.
- **Tactical intelligence** — "they knock to check nobody's home, then enter through back windows." Much harder for them to change.
- **Operational** — "a gang is working the east side of town this week."
- **Strategic** — "burglaries rise every December; homes with cameras are targeted less."
- **Pyramid of Pain** — changing car is easy for a burglar; changing *how they burgle* is hard.
- **STIX/TAXII** — a standard report form and a shared group chat that every watch member's app understands.

## how

### Step 1: The intelligence lifecycle
1. **Direction** — decide what you need to know ("Which groups target healthcare in our country?").
2. **Collection** — gather from feeds, vendor reports, government advisories, your own incidents.
3. **Processing** — normalize formats, remove duplicates, add confidence and expiry.
4. **Analysis** — connect the dots; decide what it means for *you*.
5. **Dissemination** — deliver to the right people and tools (reports for leaders, indicators for the SIEM).
6. **Feedback** — did it help? Which feeds produced true positives, which only noise?

### Step 2: Indicator lifecycle in a SOC
1. **Ingest** an indicator with confidence and expiry.
2. **Match** it against logs (sign-ins, DNS, network, email, files).
3. **Triage** matches — context matters: a match on an IP shared by a big cloud provider may mean nothing.
4. **Expire or revoke** stale indicators so they stop producing false positives.

### Step 3: Enrichment during triage
When an alert contains an IP, domain or hash, the analyst asks:
- Is it in our threat intelligence? With what confidence and context?
- When was the domain registered? Who hosts the IP?
- Has anyone else in our organization contacted it?
- Is it related to a known campaign or actor?

### Step 4: Getting intelligence into Sentinel
| Method | Use it for |
|---|---|
| **Threat Intelligence – TAXII** data connector | Feeds from TAXII 2.x servers (sharing communities, vendors) |
| **Threat Intelligence Upload API** — an application programming interface (API) | Platforms that push STIX objects to Sentinel |
| **Microsoft Defender Threat Intelligence** connector | Microsoft's own indicators |
| **Manual** creation | One-off indicators from your own investigations |

Indicators are stored in the **`ThreatIntelIndicators`** table (other STIX objects in `ThreatIntelObjects`). **Threat intelligence analytics rules** match them against your logs and create alerts.

## realWorld

A government agency publishes an advisory about an active ransomware group, including tactics and a STIX file of indicators. The SOC:

1. Ingests the indicators into Sentinel with a 90-day expiry.
2. Runs searches over the last 30 days of DNS, network and sign-in logs.
3. Reads the TTP section and checks that detections exist for each technique — writing two new analytics rules where they don't.
4. Briefs IT that the group exploits a specific VPN vulnerability, so patching is prioritized.

## securityExample

A threat intelligence analytics rule raises an alert: a user's sign-in came from an IP listed in an indicator.

The analyst checks the indicator first:
- **Confidence 30**, created **14 months ago**, no campaign context, from a free feed.
- The IP now belongs to a large cloud provider and is shared by thousands of customers.

Then the sign-in itself: MFA passed, compliant device, the user's normal working pattern. Verdict: **benign** — and the indicator is **revoked** so it stops generating noise. Feedback goes to the TI team: this feed's old IP indicators produce false positives.

## normal

- Indicators arriving daily from configured feeds, with confidence scores and expiry dates.
- Occasional matches on **low-confidence** indicators that turn out benign after enrichment.
- Analysts enriching IPs, domains and hashes as part of every triage.
- Old indicators expiring automatically.

## suspicious

- A match on a **high-confidence, recent** indicator linked to a known campaign.
- **Several different indicators** from the same campaign matching in your environment (domain, then hash, then IP).
- A match where the **behavior also fits** the campaign's known TTPs.
- Your organization's name, domains or employees appearing in an intelligence report.
- Indicators that **never expire** — a quality problem that will cause false positives.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A 2-year-old low-confidence IP indicator matches a sign-in from a shared cloud IP |
| **Suspicious** | A laptop resolves a domain listed 2 days ago in a ransomware advisory |
| **Confirmed malicious** | The same laptop then downloads a file whose hash matches the advisory and creates a scheduled task described in its TTPs |

## abuse

Defensive notes on how intelligence goes wrong:

| Problem | Effect | Defense |
|---|---|---|
| Stale indicators | Floods of false positives; analysts stop trusting TI alerts | Expiry dates; regular revocation |
| Shared infrastructure | Blocking a cloud provider IP breaks legitimate services | Check ownership and context before blocking |
| Attackers rotating infrastructure | Hash and IP indicators go stale within days | Prioritize TTP-based detections |
| Unverified sharing | Wrong indicators spread between organizations | Confidence scores; trusted sources; TLP |

## evidence

Threat intelligence itself creates records:
- **Indicator records** — type, value, confidence, validity, source, tags.
- **Match alerts** — which log record matched which indicator.
- **Enrichment results** — what the analyst found about an entity.
- **Feedback** — which indicators led to true positives.

## where

| Evidence | Where |
|---|---|
| Indicators (STIX) | `ThreatIntelIndicators` in Sentinel |
| Other STIX objects (actors, malware, relationships) | `ThreatIntelObjects` |
| TI match alerts | `SecurityAlert`, Sentinel incidents |
| Logs to match against | `SigninLogs`, `DeviceNetworkEvents`, `DnsEvents`, `EmailUrlInfo`, `DeviceFileEvents` |
| Campaign and actor reports | Defender XDR **Threat analytics**, Microsoft Defender Threat Intelligence |

## analyst

When an alert mentions an indicator:

1. **Judge the indicator:** source, confidence, age, context.
2. **Judge the match:** is the entity shared infrastructure? Does the activity look normal for that user or device?
3. **Look for corroboration:** other indicators or TTPs from the same campaign.
4. **Decide and feed back:** confirm, close as benign, or revoke the indicator — and tell the TI owner.

For new reports: search indicators across your retention period, then check that **detections exist for the TTPs** — that protection lasts longer than any indicator list.

## microsoft

- **Microsoft Sentinel threat intelligence** — TAXII and Upload API connectors, the threat intelligence management page, `ThreatIntelIndicators` and `ThreatIntelObjects` tables, and threat intelligence analytics rules.
- **Microsoft Defender Threat Intelligence** — Microsoft's intelligence on infrastructure, actors and indicators.
- **Defender XDR threat analytics** — reports on active threats, with your exposure and related incidents.
- **Defender for Endpoint custom indicators** — allow or block files, IPs, URLs and certificates across devices.

## explainBack

Q: What makes something intelligence rather than just data?
A: It has been analyzed and put in context so it helps someone make a decision. A bare list of IPs is data; knowing which actor uses them, how, against whom and how confident we are makes it intelligence.

Q: Explain the Pyramid of Pain with a car thief.
A: Blocking the car's license plate (a hash or IP) barely slows them — they swap plates. Knowing they always break in through the rear window at night (their technique) forces them to change how they steal, which is much harder.

Q: Why should indicators expire?
A: Attackers abandon infrastructure, and IPs and domains get reused by innocent owners. Old indicators then match legitimate activity, creating false positives that waste time and erode trust in real alerts.
