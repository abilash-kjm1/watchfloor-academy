## bridge

You've learned about a SIEM (**Sentinel**) that collects records from everywhere. Microsoft also has **Defender XDR**, which watches computers, email, identities and cloud apps directly and automatically links related alerts. This lesson explains how the two fit together.

**Chain:** Endpoint + email + identity + cloud signals → *XDR correlation* → unified incident → evidence → response

## what

Two terms to separate clearly:

### EDR — Endpoint Detection and Response
**[[edr|EDR]]** watches **endpoints** (laptops, desktops, servers) in depth.
- It records what happens on the device, detects threats, and lets you respond (e.g. isolate the device).
- Example: **Microsoft Defender for Endpoint**.

### XDR — Extended Detection and Response
**[[xdr|XDR]]** connects detections across **several areas** at once:
- **Endpoints**
- **Email**
- **Identities** (user accounts)
- **Cloud apps**

It groups related alerts into **one incident** and lets you respond across all of them from one place.

### Microsoft Defender XDR
**[[defender-xdr|Microsoft Defender XDR]]** combines these products in the **Microsoft Defender portal**:

- Defender for **Endpoint** — devices
- Defender for **Office 365** — email and collaboration
- Defender for **Identity** — on-premises Active Directory ("on-premises" means running on the company's own servers rather than in the cloud)
- Defender for **Cloud Apps** — SaaS applications
- …and more.

### SIEM vs EDR vs XDR vs SOAR

These four terms are easy to mix up:

| Tool type | Main job | Microsoft example |
|---|---|---|
| **SIEM** — Security Information and Event Management | Collect and search records from **everything**; correlate; detect | Microsoft Sentinel |
| **EDR** — Endpoint Detection and Response | Deep recording and response on **computers** | Defender for Endpoint |
| **XDR** — Extended Detection and Response | Connect detections across **endpoints, email, identity and cloud apps** | Microsoft Defender XDR |
| **SOAR** — Security Orchestration, Automation and Response | **Automate** response steps | Sentinel automation rules and playbooks |

### The Microsoft Defender family

```
Microsoft Defender XDR  (one portal, unified incidents)
 ├── Defender for Endpoint     → computers
 ├── Defender for Office 365   → email and Teams
 ├── Defender for Identity     → on-premises Active Directory
 ├── Defender for Cloud Apps   → SaaS apps (cloud software like Salesforce or Box)
 └── other Microsoft signals   → e.g. Entra ID Protection, Defender for Cloud
```

## why

EDR gave deep visibility **on devices**. But attacks rarely stay on one device:

1. They often **start in email**.
2. They **use stolen identities**.
3. They **reach into cloud apps**.

With separate consoles, analysts had to **stitch these signals together by hand**.

> XDR exists to do that stitching **automatically** — and to respond across all areas in one place.

## name

- **Detection and Response** — not just *finding* threats, but *acting* on them.
- **Extended** — beyond the endpoint (which is what EDR covers) to other areas.

## problem

**Without XDR:**

- A phishing alert appears in the **email** console.
- A suspicious sign-in appears in the **identity** console.
- A process alert appears in the **endpoint** console.

They look like **three small problems**, handled by **three people**.

**With XDR:**

- **One incident** shows the full chain.
- **One analyst** can respond across all of it.

## how

1. Each product raises **alerts** with evidence.
2. Defender XDR's **correlation engine** groups alerts that share entities, timing and attack patterns into **incidents**.
3. The incident page shows:
  - **Attack story** — the alerts in order, with a graph.
  - **Assets** — devices, users, mailboxes, apps.
  - **Evidence and response** — files, processes, IPs, and the actions taken.
  - **Investigations** — automated investigation results.

### Device groups
- Devices can be organized into **device groups** (e.g. servers, executives' laptops, standard workstations).
- Each group can have its own **automation level** — from "remediate threats automatically" to "require approval for any action" — and its own analyst permissions.

### Automated investigation and response (AIR)
- Examines evidence automatically.
- Can fix issues (e.g. quarantine files, remove emails), depending on the **automation level** you configured.

### Automatic attack disruption
- Uses **high-confidence** signals to contain an attack **while it is happening**.
- For example: contain a device or disable a compromised user, to stop the attack spreading.

### Advanced Hunting
- KQL queries over roughly **30 days** of raw XDR data.

### Threat analytics
- Reports that explain current threats and **your exposure** to them.

## analogy

Separate security tools are like **separate witnesses who never talk to each other**.

XDR is the **detective** who interviews all of them and writes **one case file** with a single timeline.

## realWorld

A single Defender XDR incident might combine four alerts, all about the **same user**:

1. **Email** — a malicious URL was delivered.
2. **Identity** — a suspicious sign-in.
3. **Endpoint** — a suspicious script ran on the user's laptop.
4. **Cloud app** — an unusually large file download.

## securityExample

An analyst opens an incident and reads the attack story:

1. Email delivered
2. → User clicked the link
3. → Sign-in from a new location
4. → Alert on the user's laptop

The response options are all in the same place:

- **Remove** the email from every mailbox.
- **Revoke sessions** or **disable** the user.
- **Isolate** the laptop.

## normal

- Most incidents are **small** — one or two alerts, one user or device.
- Many are closed after **automated investigation** finds no threat, or fixes it automatically.

## suspicious

Prioritize incidents that are:

- **Multi-stage** — spanning several products and entities.
- Tagged with **attack disruption**.
- Involving **privileged accounts** or **many devices**.

## abuse

Defensive view: correlation can only connect signals that **exist**.

- Devices without the Defender sensor and mailboxes that aren't protected are **blind spots**.

> Device onboarding coverage is a real security measure.

## evidence

In Advanced Hunting:

- **`AlertInfo`** — the alerts.
- **`AlertEvidence`** — the entities and evidence attached to each alert.
- All the raw tables: `Device*`, `Email*`, `Identity*`, `CloudAppEvents`.

## where

Microsoft Defender portal:

- **Incidents & alerts**
- **Investigation & response → Hunting → Advanced hunting**
- **Action center** — history of remediation actions

## analyst

A good order for working an incident:

1. **Open the incident.**
2. **Read the attack story** — where did it start, and how do the alerts relate?
3. **Review each alert's evidence.**
4. **Check the affected assets.**
5. **Verify and scope** with Advanced Hunting.
6. **Take response actions.**
7. **Classify and document** the incident.

## microsoft

**Unified operations**
- Sentinel incidents and Defender XDR incidents appear in the **same queue**.

**SC-200 covers**
- Configuring XDR **notifications** and **alert tuning**.
- **AIR** and **attack disruption**.
- **Device groups** and **automation levels**.
- Responding to alerts from **each Defender product**.

**Microsoft Security Copilot**
- Built into the portal to **summarize incidents** and **assist investigations**.
- The current SC-200 outline includes investigating incidents with this kind of **agentic AI**.

## explainBack

Q: Explain the difference between EDR and XDR to a non-technical manager.
A: EDR is a security camera on every computer — it sees in detail what happens on that one device. XDR connects the cameras on computers with those watching email, user accounts and cloud apps, so one attack that touches all of them shows up as a single story.

Q: Why read the attack story before any single alert?
A: It shows where the attack started and how the alerts relate. Starting from one alert, you might investigate a symptom and miss the cause — for example, the phishing email that began everything.

Q: What does automatic attack disruption do?
A: When Defender is highly confident an attack is in progress, it automatically contains the affected accounts or devices to stop the attack spreading, while analysts investigate.
