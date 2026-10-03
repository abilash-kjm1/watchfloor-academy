## bridge

You know how cloud computing works (infrastructure, platform and software as a service — IaaS, PaaS and SaaS) and the shared responsibility model. You've investigated endpoints with Defender for Endpoint and Azure control-plane activity with the `AzureActivity` table. **Microsoft Defender for Cloud** brings those together for cloud **workloads** — virtual machines, [[storage-account|storage accounts]], databases, [[key-vault|key vaults]], containers and the cloud [[azure-resource-manager|management plane]] itself — and raises **security alerts** when they are attacked.

This lesson shows what those alerts look like and how an analyst responds with *cloud-native* actions.

**Chain:** Cloud resources (VMs, storage, key vaults, containers, Azure Resource Manager) → Defender plans watch them → security alerts with MITRE mapping → correlated into incidents → appear in the Defender portal and Sentinel → investigate with activity logs → respond in the cloud (rotate keys, restrict access, isolate)

## what

### 1. Defender for Cloud
**Microsoft Defender for Cloud** has two halves:
- **Posture management** (cloud security posture management, CSPM) — finds misconfigurations and gives recommendations and a secure score. *Before* an attack.
- **Workload protection** (cloud workload protection, CWP) — **Defender plans** that detect threats against running resources and raise **security alerts**. *During* an attack.

It covers Azure, Amazon Web Services (AWS), Google Cloud and on-premises servers.

### 2. Defender plans that raise alerts (examples)
| Plan | Protects | Example alert themes |
|---|---|---|
| **Defender for Servers** | VMs and servers (includes Defender for Endpoint) | Malware, suspicious processes, brute force against management ports |
| **Defender for Storage** | Blob storage and files | Malware uploaded, access from a suspicious IP, unusual data extraction |
| **Defender for Key Vault** | Key vaults (secrets, keys, certificates) | Unusual secret access, access from a suspicious location |
| **Defender for Resource Manager** | The Azure management plane | Suspicious management operations, use of known attack toolkits against Azure |
| **Defender for Containers** | Kubernetes clusters and images | Suspicious container behavior, exposed dashboards |
| **Defender for Databases** | Azure SQL and other databases | SQL injection attempts, unusual logins |

### 3. Alert severity
| Severity | Meaning |
|---|---|
| **High** | High confidence the resource is compromised — look now |
| **Medium** | Probably suspicious; often anomaly-based |
| **Low** | Might be benign or a blocked attack |
| **Informational** | Usually only meaningful together with other alerts |

Alerts are kept in Defender for Cloud for **90 days**, even if the resource is deleted. Related alerts are correlated into **incidents**.

## why

Cloud workloads need their own detections because:

- Many attacks never touch a laptop: a stolen **storage key**, a leaked **key vault secret**, or a compromised **cloud admin account** works entirely through cloud APIs.
- Cloud resources change constantly; misconfigurations (public storage, open management ports) appear daily.
- Under shared responsibility, **you** own your data, identities and configuration — the provider won't investigate your storage account for you.

Defender for Cloud gives the SOC alerts **with cloud context** (which [[subscription|subscription]], resource, identity and operation), so responders can act in the cloud quickly.

## name

- **Defender for Cloud** — formerly **Azure Security Center** and **Azure Defender**; older documents and some log fields still use those names.
- **Workload** — anything that does work in the cloud: a VM, a database, a function, a container.
- **Posture** — like body posture: how well you are *set up* before anything hits you.

## problem

Defender for Cloud alerts help answer:

1. **Is a cloud resource under attack right now?**
2. **Which identity, IP and operation were involved?**
3. **Was data accessed or exfiltrated** (storage, key vault, database)?
4. **What else did that identity do** in the subscription?
5. **What misconfiguration made it possible** — and is it fixed?

## analogy

A storage warehouse company:

- **Posture management** — the inspector who walks round before opening and notes unlocked doors and broken cameras.
- **Workload protection** — the guards and alarms on each storage unit, watching for someone forcing a lock *right now*.
- **Key vault** — the box holding every unit's master keys; any unusual opening is serious.
- **Resource Manager** — the head office where unit rentals are created and deleted; someone quietly creating 50 new units at 3 a.m. is suspicious even if no lock is forced.

## how

### Step 1: Read the alert
Every alert includes:
- **Affected resource** — subscription, resource group, resource.
- **Detected by** — which Defender plan.
- **Description and MITRE tactics.**
- **Related entities** — IPs, accounts, files, hosts.
- **Remediation steps** and a **Take action** section (mitigation, prevention, trigger automation, suppression).

### Step 2: Investigate with cloud evidence
1. **Identity:** which user, service principal or managed identity performed the operation? Check its sign-ins.
2. **Control plane:** what did that identity do in Azure? (`AzureActivity`)
3. **Data plane:** what was read or written in storage or key vault? (resource diagnostic logs, if enabled)
4. **Workload:** for VMs, use Defender for Endpoint's device timeline.

### Step 3: Respond with cloud-native actions
| Situation | Response |
|---|---|
| Leaked storage account key | **Rotate the keys**; prefer Entra ID authentication or short-lived shared access signatures |
| Suspicious key vault access | Review and **rotate the secrets** accessed; tighten access policies or role assignments; restrict network access |
| Compromised cloud admin | Disable or contain the identity, **revoke sessions**, review role assignments it changed |
| Compromised VM | **Isolate** via Defender for Endpoint; restrict its network security group; snapshot disks for forensics |
| Exposed management port | Close it; use just-in-time VM access |

### Step 4: Fix the posture
Link the alert to the **recommendation** that would have prevented it (for example "storage accounts should restrict network access") and track it to closure.

### Step 5: Where alerts flow
- **Defender portal** — Defender for Cloud alerts appear in the unified alert and incident queues and correlate with other Defender alerts.
- **Microsoft Sentinel** — through the Defender XDR connector or the Defender for Cloud connector (`SecurityAlert` table).
- **Continuous export** — to a Log Analytics workspace or Event Hubs for other SIEMs.

## realWorld

A company enables Defender for Servers, Storage, Key Vault and Resource Manager. In the first month the SOC sees:
- **Low** alerts for brute-force attempts against an internet-exposed Remote Desktop Protocol (RDP) port → posture fix: close the port, use just-in-time access.
- A **medium** storage alert: access from a Tor exit node to a blob container → turns out to be a developer testing privacy tools; documented and tuned.
- A **high** key vault alert: secrets read by an application identity from an unusual IP → investigation shows the app's client secret had leaked; secrets rotated.

## securityExample

High-severity alert: *unusual access to a key vault — many secrets listed and read by an identity from a new IP address.*

1. **Identity:** a service principal for the billing app, normally used only from the app's Azure IP range.
2. **Sign-ins:** the service principal authenticated from an unfamiliar hosting provider an hour earlier, using a **client secret**.
3. **Activity:** it listed and read 40 secrets, including the database connection string.
4. **Root cause:** the client secret had been committed to a code repository.

Response: disable the service principal's credentials and issue new ones (certificate or managed identity preferred); **rotate every secret it read**; check the database for access from the attacker's IP; remove the secret from the repository history; restrict the key vault to private networks.

## normal

- Low-severity alerts for internet scanning of exposed services (a sign to fix posture, rarely a compromise).
- Key vault access by the expected app identities, from expected networks.
- Management operations by known admins and deployment pipelines.
- Storage access patterns matching the application's behavior.

## suspicious

- **Secrets, keys or storage data accessed** by an identity from a new IP, country or hosting provider.
- **Bulk reads or listing** of secrets or blobs.
- Management operations that **disable logging**, change network rules to "allow all", or create many resources.
- **Malware uploaded** to storage.
- Containers running **unexpected processes** or reaching unexpected destinations.
- Management actions by identities that **never** used the management plane before.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | The billing app reads its 3 secrets from its usual Azure IP every hour |
| **Suspicious** | The same app identity lists all 40 secrets from a new hosting provider |
| **Confirmed malicious** | That IP then connects to the production database with the stolen connection string |

## abuse

Defensive view of common cloud workload attacks:

| Attack (MITRE ATT&CK) | Plain description | Defense |
|---|---|---|
| Unsecured Credentials (secrets in code or config) | Keys and secrets found in repositories or files | Secret scanning; managed identities; Key Vault |
| Valid Accounts: Cloud Accounts | Stolen cloud identities used for access | MFA, Conditional Access, Defender for Resource Manager alerts |
| Data from Cloud Storage | Reading or exporting storage data | Private networking; Entra-based access; Defender for Storage |
| Resource Hijacking | Creating VMs or containers for crypto mining | Activity log alerts; quotas; Defender for Resource Manager |
| Impair Defenses | Disabling diagnostic settings or security tools | Alerts on logging changes; Azure Policy |

## evidence

- **Security alerts and incidents** from Defender plans.
- **Azure activity log** — management-plane operations (who created, changed, deleted what).
- **Resource diagnostic logs** — data-plane access (storage reads, key vault operations) when enabled.
- **Sign-in logs** for users and service principals.
- **Endpoint telemetry** for servers via Defender for Endpoint.

## where

| Evidence | Where |
|---|---|
| Defender for Cloud alerts | Defender portal; `SecurityAlert` (Sentinel); `AlertInfo` / `AlertEvidence` (Advanced Hunting, `ServiceSource` = Microsoft Defender for Cloud) |
| Management operations | `AzureActivity` |
| Service principal sign-ins | `AADServicePrincipalSignInLogs` |
| Key vault and storage data access | Resource diagnostic logs sent to a workspace (e.g. `AzureDiagnostics`) |
| VM process and network activity | `DeviceProcessEvents`, `DeviceNetworkEvents` |

## analyst

For every Defender for Cloud alert:

1. **Resource:** what is it, how critical, who owns it?
2. **Identity:** which identity acted, and has it signed in from unusual places?
3. **Scope:** what else did that identity touch (activity log, data-plane logs)?
4. **Contain in the cloud:** rotate keys and secrets, revoke or disable identities, restrict network access, isolate VMs.
5. **Prevent:** fix the posture recommendation behind it.

## microsoft

- **Microsoft Defender for Cloud** — CSPM (recommendations, secure score, attack paths) and Defender plans (Servers, Storage, Key Vault, Resource Manager, Containers, Databases, App Service and more).
- **Microsoft Defender XDR** — Defender for Cloud alerts and incidents in the unified Defender portal.
- **Microsoft Sentinel** — `SecurityAlert` via connectors, plus `AzureActivity` and diagnostic logs for investigation.
- **Workflow automation and continuous export** — trigger Logic Apps on alerts; stream alerts to workspaces or Event Hubs.

## explainBack

Q: What's the difference between Defender for Cloud's posture management and its workload protection?
A: Posture management looks for weaknesses before an attack — misconfigurations and missing protections, with recommendations. Workload protection watches running resources and raises alerts when they are actually attacked.

Q: A storage account key leaked. Why isn't resetting a user's password enough?
A: The key isn't tied to a user's password — whoever has it can access the storage account directly. You must rotate the key itself, and ideally move to identity-based access so keys aren't needed.

Q: Why check the Azure activity log during a cloud alert?
A: It shows what the identity did in the management plane — creating resources, changing network rules, disabling logging — which tells you the scope of the compromise beyond the single alert.
