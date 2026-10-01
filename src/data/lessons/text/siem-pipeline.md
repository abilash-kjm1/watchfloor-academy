## bridge

You now know how to read individual logs. But a company has thousands of computers, each with its own logs. A **SIEM** brings them all together so you can search, connect and detect across everything at once.

**Chain:** Telemetry → logs from many sources → *SIEM* (collect, normalize, store) → query → detection → alert → incident

## what

A **[[siem|SIEM]]** (Security Information and Event Management) is a platform that does five jobs:

1. **Collects** security data from many systems into one place.
2. **Makes it searchable.**
3. **Correlates** it — connects related events from different sources.
4. **Detects** suspicious patterns using rules.
5. **Raises alerts and incidents** for analysts.

> Example: **Microsoft Sentinel** is a SIEM.

## why

An organization has **thousands of systems**, each producing its own logs.

Investigating each system separately is:

- **Slow** — you'd log into dozens of consoles.
- **Often impossible** — logs get overwritten, or you don't have access.
- **Blind to the big picture** — attacks usually span many systems.

A SIEM puts all of that data in one place so analysts can **search, correlate and detect across everything at once**.

## name

SIEM is a merger of two older product types:

- **SIM** — Security *Information* Management: long-term storage and reporting.
- **SEM** — Security *Event* Management: real-time monitoring and alerting.

**SIM + SEM = SIEM.** The term was popularized by the analyst firm Gartner in 2005.

## problem

A SIEM solves five problems:

### Visibility
One search covers every source.

### Correlation
Connect a failed sign-in in one log to a program starting in another.

### Retention
Logs are kept centrally — even if the original machine is wiped.

### Detection at scale
Rules run continuously across all data.

### Compliance
An auditable history of what happened.

## how

### The SIEM pipeline

Data moves through these stages, in order:

1. **Collection** — data is gathered.
  - **Agents** — small programs installed on computers that send their logs (e.g. the Azure Monitor Agent).
  - **APIs** — ways for one program to request data from another over the network (e.g. pulling sign-in logs from a cloud service).
  - **Syslog forwarders** — servers that receive logs from network devices and pass them on.
  - **Built-in connectors** — ready-made integrations for common products.
2. **Ingestion** — data is accepted into the platform.
3. **Parsing** — raw text is split into named fields.
4. **[[normalization|Normalization]]** — different vendors' field names are mapped to one common set.
  - Microsoft's version is called **ASIM**.
5. **Storage** — data is saved in tables, with a chosen retention period and cost tier.
6. **Query** — analysts search it with a query language (KQL in Sentinel).
7. **Detection** — rules and analytics run against the data.
8. **Alert** — a rule match creates an alert with the entities involved.
9. **Incident** — related alerts are grouped for investigation. Automation can run here.

## analogy

A SIEM is like an **airport control tower**:

- Every runway, gate and radar **reports in** → *collection*.
- Controllers see everything **on one screen** → *search*.
- They notice when two planes are heading for the same spot → *correlation*.
- They raise an alarm → *alert*.
- Recordings are kept for later investigations → *retention*.

## realWorld

A company connects these sources to Microsoft Sentinel:

- Entra ID sign-in logs
- Defender XDR
- Windows servers (through the Azure Monitor Agent)
- Linux servers (Syslog through the agent)
- Firewalls (CEF through the agent)
- Azure activity logs

Then:

- **Scheduled rules** run every 5–60 minutes.
- **Near-real-time rules** run about every minute for the most urgent patterns.

## securityExample

**Correlation in action.**

Two signals that mean little alone:

1. **Identity logs:** a user signs in from a new country.
2. **Endpoint logs:** minutes later, that user's laptop starts unusual programs.

A SIEM rule that **joins both sources by user** turns them into **one high-confidence alert**.

## normal

Signs of a healthy SIEM:

- Every data source sends data at its **expected volume**.
- Each rule has a **known accuracy**.
- Every incident has a clear **owner**.
- Costs are **predictable**.

## suspicious

Warning signs:

- A connector has **silently stopped**.
- A sudden **ingestion spike** — could be an attack creating noise, or a misconfiguration.
- A rule that **hasn't fired in months** — the query may be broken, or the data missing.
- **Retention shorter** than the time investigations usually need.

## abuse

Defensive view: attackers benefit from **gaps**:

- Sources the SOC **doesn't collect**.
- **Short retention** that deletes evidence before anyone looks.
- **Noisy rules** that bury real alerts.

> Much of SIEM engineering is about closing these gaps.

## evidence

A SIEM holds:

- The data from **every connected source**.
- Its **own records**: alerts, incidents, analyst comments.
- **Audit records** of who searched for what.

## where

In Microsoft Sentinel:

| Data | Where |
|---|---|
| Source data | Tables in the Log Analytics workspace (and the Sentinel data lake for long-term storage) |
| Alerts | `SecurityAlert` |
| Incidents | `SecurityIncident` |
| Platform health | `SentinelHealth` |

## analyst

As an analyst, you use the SIEM to:

- **Search across sources** during triage.
- **Build timelines.**
- **Pivot** from one entity to related activity.
- **Verify** whether an alert's claim is true.
- **Report** broken or noisy rules to the engineering team.

## microsoft

**Microsoft Sentinel** is Microsoft's cloud-native SIEM (and SOAR).

- It is now used mainly from the **Microsoft Defender portal**, alongside Defender XDR.

Storage tiers:

| Tier | Best for |
|---|---|
| **Analytics tier** | Fast queries and detection rules on recent data |
| **Sentinel data lake** | Low-cost, long-term storage; queried with KQL jobs and notebooks |

> Managing retention across these tiers is an SC-200 objective.

## explainBack

Q: Explain why a SIEM exists without using the word "centralize".
A: Every computer keeps its own records, and attacks usually touch many computers. Logging into each one separately is slow, and the records may get deleted. A SIEM copies all the records into one searchable place, so an analyst can follow an attack across every system with one search.

Q: What does "correlation" mean in a SIEM?
A: Connecting related records from different sources — for example, linking a risky sign-in to unusual activity on the same user's laptop — so two weak signals become one strong alert.

Q: A rule hasn't fired in six months. Is that good news?
A: Not necessarily. The data it needs might have stopped arriving, or the query might be broken. Test it before trusting the silence.
