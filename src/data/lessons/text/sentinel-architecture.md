## bridge

You understand what a **SIEM** does and how to query its tables with **KQL**. **Microsoft Sentinel** is Microsoft's SIEM. This lesson shows how its parts map onto everything you've learned: data in, tables, rules, incidents and automation.

**Chain:** Data sources → connectors → workspace tables → KQL analytics rules → alerts → incidents → automation

## what

**[[sentinel|Microsoft Sentinel]]** is Microsoft's cloud-based security platform. It does two jobs:

- **SIEM** — collects security data, searches it, and detects threats.
- **SOAR** — automates the response to those threats.

In practice, Sentinel:

1. **Stores** security data in a **[[log-analytics|Log Analytics workspace]]** (and the Sentinel data lake).
2. **Runs detection rules** written in KQL.
3. **Creates incidents** for analysts.
4. **Automates** response with automation rules and playbooks.

## why

Traditional SIEMs ran on the company's own servers. That meant:

- **Buying hardware** and storage up front.
- **Running out of capacity** as data grew.
- Building **custom connectors** for every source.

As data moved to the cloud and volumes exploded, Microsoft built Sentinel **on Azure**, so that:

- Capacity **grows on demand**.
- It has **built-in connectors** to Microsoft 365, Entra ID, Defender and Azure — plus many third-party sources.

## name

- A **sentinel** is a guard who keeps watch.
- It was first called **"Azure Sentinel"**, and renamed **"Microsoft Sentinel"** in 2021 to reflect that it covers multi-cloud and on-premises systems too.

## problem

Sentinel solves four problems:

### Centralization
One place for all security data.

### Scale
The cloud grows with your data.

### Integration
Built-in connectors and ready-made **content hub** solutions.

### Response
Automation built directly into incident handling.

## how

Sentinel is made of these building blocks. Learn them one at a time.

### 1. Workspace
- The **Log Analytics workspace** is where the data lives.
- Sentinel is *switched on* for a workspace.

### 2. Data connectors
**[[data-connector|Connectors]]** bring data in. There are four main kinds:

- **Service-to-service** — for Microsoft services such as Entra ID, Microsoft 365, Defender XDR.
- **Agent-based** — the **[[ama|Azure Monitor Agent (AMA)]]** installed on Windows or Linux machines, controlled by **[[dcr|data collection rules (DCRs)]]**.
- **Syslog / CEF via AMA** — network devices send logs to a Linux "forwarder" machine that runs AMA.
- **API / custom** — for sources with no built-in connector.

### 3. Content hub
- Ready-made **solutions** that bundle connectors, detection rules, dashboards, hunting queries and playbooks for a product.

### 4. Tables
Data is stored in tables, for example:

- `SigninLogs` — Entra ID sign-ins
- `SecurityEvent` — Windows Security log
- `Syslog` — Linux
- `CommonSecurityLog` — network devices (CEF)
- `AzureActivity` — Azure changes
- Custom tables ending in `_CL`

### 5. Storage tiers

| Tier | What it's for |
|---|---|
| **Analytics tier** | Recent data. Fast queries. Detection rules run here. |
| **Sentinel data lake** | Lower cost, long retention. Queried with KQL jobs and notebooks. Results can be copied back to the analytics tier. |

- **Summary rules** regularly aggregate high-volume data into smaller tables that are cheaper to query.

### 6. Analytics (detection rules)
- **Scheduled** rules, **near-real-time (NRT)** rules, **threat intelligence** matching, and **anomaly / machine-learning** detections.

### 7. Incidents
- Alerts are grouped into incidents, with entities and an investigation graph.

### 8. Automation
- **Automation rules** — simple triage actions on incidents.
- **Playbooks** — workflows built with **Azure Logic Apps**, Microsoft's drag-and-drop service for connecting apps and automating multi-step tasks.

### 9. Workbooks
- Dashboards built from KQL queries.

### How the pieces fit together

```
Data sources (Entra ID, Windows, Linux, firewalls, Defender…)
        ↓  connectors / Azure Monitor Agent + data collection rules
Log Analytics workspace  →  tables (SigninLogs, SecurityEvent, …)
        ↓  KQL
Analytics rules  →  alerts  →  incidents
        ↓
Automation rules and playbooks  →  response
```

### 10. Roles
- **Microsoft Sentinel Reader** — view only.
- **Microsoft Sentinel Responder** — manage incidents.
- **Microsoft Sentinel Contributor** — also create and edit rules, workbooks and other content.
- Plus specialized roles such as **Automation Contributor** and **Playbook Operator**.

> Least privilege applies to the SOC team too.

### Where you use it

- Sentinel is now used in the **Microsoft Defender portal**, alongside Defender XDR.
- Since **July 1, 2026**, Sentinel users are redirected to the Defender portal. Managing Sentinel in the **Azure portal** is supported only until **March 31, 2027**.
- The **Log Analytics workspace** remains the data store behind Sentinel after the move.

> **Stable concept vs current UI:** the ideas in this lesson (workspace, connectors, rules, incidents, automation) are stable. Menu names and where buttons live change often — always check Microsoft's current docs.

## analogy

Sentinel is like a city's **emergency dispatch center**:

| Dispatch center | Sentinel |
|---|---|
| Phone lines from every neighborhood | Data connectors |
| Call recording archive | The workspace |
| Dispatchers listening for keywords | Analytics rules |
| Dispatched cases | Incidents |
| Standard procedures that send the right unit | Automation rules and playbooks |

## realWorld

A company sets up Sentinel like this:

1. Enables Sentinel on a workspace.
2. Installs the **Microsoft Entra ID** and **Microsoft Defender XDR** solutions from the content hub.
3. Configures **Windows Security Events via AMA**, using a DCR that collects the **"Common"** event set from servers. (DCRs can also use **XPath** — a filter language for picking exact Windows events.)
4. Deploys a **Linux log forwarder** so firewalls can send **CEF via AMA**.
5. Enables a set of **built-in analytics rules**.

## securityExample

Because Entra ID sign-in logs **and** Windows server events are both in Sentinel, one rule can say:

> *"Alert when a user with a risky sign-in then logs on to a server with Remote Desktop."*

That's impossible if the two data sources live in separate consoles.

## normal

Healthy operation looks like:

- Connectors show **healthy**.
- Data volume per table is **stable**.
- Rules **run on schedule**.
- Incidents are **assigned** and **closed with classifications**.

## suspicious

Platform-level warning signs:

- Connectors **disconnected**.
- A DCR **removed or narrowed**.
- A sudden **drop** in a table's data.
- Detection rules **disabled** by someone unexpected.
- Automation rules changed to **auto-close** incidents.

## abuse

Defensive view: someone who gains access to the security platform itself could try to **reduce visibility** — disabling rules or connectors, or auto-closing incidents.

Protect Sentinel by:

- Using **least-privilege roles**.
- Monitoring its own **audit and health** data (`SentinelAudit`, `SentinelHealth`).
- **Alerting on configuration changes.**

## evidence

Sentinel keeps records of its own activity:

| Table | Holds |
|---|---|
| `SecurityAlert` | Alerts |
| `SecurityIncident` | Incidents |
| `SentinelHealth` | Health of connectors, rules and automation |
| `SentinelAudit` | Changes to Sentinel configuration |

Azure activity logs also record changes to Sentinel resources.

## where

In the **Microsoft Defender portal**, under Microsoft Sentinel:

- Configuration
- Content hub
- Data connectors
- Analytics
- Automation
- Workbooks
- Hunting

…plus the **unified incident queue**.

## analyst

What you do depends on your role:

**As an analyst**
- Investigate incidents.
- Run KQL in Logs or Advanced Hunting.
- Use workbooks for context.
- Run hunting queries.
- Request tuning of noisy rules.

**As an engineer**
- Configure connectors and DCRs.
- Write and tune rules.
- Set retention.
- Build automation.

## microsoft

These SC-200 platform objectives are covered by this lesson:

- Specify **Sentinel roles**.
- Manage **data retention** across Analytics, Data lake and XDR tiers.
- Create **workbooks**.
- **Optimize** the platform, including SOC optimization recommendations.
- **Select data connectors** for a data source.
- Configure **Windows Security Events via AMA** with DCRs.
- Plan **Windows Event Forwarding (WEF)**.
- Configure **Syslog and CEF via AMA**.
- Collect **Azure activity logs** with Azure Policy and diagnostic settings.
- Ingest **threat indicators**.
- Create **custom log tables**.

## explainBack

Q: Explain what Microsoft Sentinel is to someone who has never heard of a SIEM.
A: It's Microsoft's cloud service that collects security records from all of a company's systems into one place, runs searches on them automatically to spot attacks, raises incidents for analysts, and can run automatic response steps.

Q: A firewall can only send logs in CEF format over syslog. How do they reach Sentinel?
A: The firewall sends them to a Linux machine running the Azure Monitor Agent (a log forwarder), which passes them to the workspace — they land in the CommonSecurityLog table.

Q: Why might a built-in Windows rule miss events collected with Windows Event Forwarding?
A: Forwarded events land in the WindowsEvent table, but many built-in rules only read the SecurityEvent table.
