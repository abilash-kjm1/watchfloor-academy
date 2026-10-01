## bridge

In the hunting lesson you searched **tables**: rows of events, stacked and filtered. Some questions are about **relationships** instead: *if this account is compromised, what can it reach? Is there a path from this laptop to the domain admins? Who can read this key vault?* Tables make those questions painful. **Graphs** — nodes connected by edges — answer them naturally.

This lesson covers the **hunting graph** in Defender advanced hunting, **blast radius** analysis in incidents, **Microsoft Sentinel graph** that powers them, and how to query the **exposure graph** with KQL.

**Chain:** Assets and identities (nodes) + relationships (edges: member of, can authenticate as, has permissions to) → exposure graph → hunting graph scenarios and blast radius → KQL make-graph / graph-match → prioritize containment of what matters most

## what

### 1. Graphs: nodes and edges
- A **node** is an entity: a user, device, group, virtual machine, storage account, key vault, IP address.
- An **edge** is a relationship between two nodes, with a direction and a label — for example *member of*, *can authenticate as*, *has permissions to*, *routes traffic to*.
- A **path** is a chain of edges from one node to another.

### 2. The enterprise exposure graph
**Microsoft Security Exposure Management** builds an **exposure graph** from Defender for Endpoint, Defender for Identity, Defender for Cloud, Entra ID and other sources. In advanced hunting it appears as two tables:
- **`ExposureGraphNodes`** — entities and their properties (e.g. critical, exposed to the internet, vulnerable).
- **`ExposureGraphEdges`** — relationships between them.

### 3. Hunting graph
The **hunting graph** in Defender **advanced hunting** renders threat scenarios as interactive graphs. You pick a **predefined scenario**, enter inputs, filter, and run it. Examples:
- **Attack paths to critical asset**
- **Paths between two entities**
- **Access to key vaults**
- **Users with access to sensitive data**
- **Paths to domain admins**
- **Kerberoast paths to critical assets**

### 4. Blast radius
**Blast radius analysis** in the Defender **incident graph** shows what a compromised entity could reach **next** — the possible future impact — alongside what has already happened in the incident.

### 5. Microsoft Sentinel graph
**Microsoft Sentinel graph** is the graph analytics capability that powers these experiences — the hunting graph and blast radius in Defender, and data risk graphs in Microsoft Purview. It is enabled through **Microsoft Sentinel data lake** onboarding. Sentinel also supports **custom graphs** (preview), authored in notebooks and queried with Graph Query Language (GQL).

> Graph features change quickly and have licensing and onboarding prerequisites. Always check the current Microsoft Learn pages.

## why

Graphs exist in security because **attackers think in paths**:

- An attacker rarely goes straight to the target. They go laptop → cached admin credentials → server → domain admin.
- Defenders traditionally think in **lists** (alerts, assets, vulnerabilities). A list can't show that a low-value laptop is two hops from the payroll database.
- During an incident, knowing the **blast radius** tells you what to contain **first**.
- Before an incident, **choke points** (nodes on many paths) show where one fix removes many risks.

## name

- **Graph** — in mathematics, a set of nodes connected by edges (not a chart).
- **Blast radius** — from explosions: how far the damage can spread from the point of impact.
- **Choke point** — a narrow place everything must pass through; controlling it controls many paths.
- **Attack path** — the route an attacker could take through relationships to reach a target.

## problem

Graph hunting answers questions that are hard with tables:

1. **If this account is compromised, what can it reach?** (blast radius)
2. **Is there any path from a normal user to Domain Admins or a critical key vault?**
3. **Which identities can access this sensitive storage account?**
4. **Which single node, if fixed, breaks the most attack paths?** (choke points)
5. **How should we prioritize containment** during a live incident?

## analogy

An airport route map:

- **Nodes** — airports. **Edges** — direct flights.
- A **table** lists every flight separately; you can't easily see that a small regional airport connects to the capital in two hops.
- The **graph** shows it instantly.
- **Blast radius** — if a contagious traveller boards at the regional airport, which cities could they reach today?
- **Choke point** — the one hub airport most routes pass through; screening there protects many destinations.

## how

### Step 1: Use a predefined scenario
1. In the Defender portal: **Investigation & response → Hunting → Advanced hunting**, then open the **hunting graph**.
2. Choose **Search with predefined scenarios** — for example *Paths to domain admins*.
3. Enter inputs if required (e.g. a target key vault), apply filters (e.g. **show only the shortest paths**), and **run** it.
4. Select nodes and edges to see details; expand from interesting nodes.

### Step 2: Use blast radius during an incident
1. Open the incident's **graph**.
2. Expand the **blast radius** from a compromised user or device.
3. Note **critical assets** within reach — they set the order of containment.

### Step 3: Query the exposure graph with KQL
Two KQL operators turn tables into a graph:
- **`make-graph`** builds a graph from an edges table and a nodes table.
- **`graph-match`** finds patterns of nodes and edges, like `(User)-[edge]->(Target)`.

Start simple: list node and edge labels, then match a one-hop pattern, then extend to multi-hop paths (`[path*1..3]`).

### Step 4: Turn findings into action
| Finding | Action |
|---|---|
| Path from many users to Domain Admins through one group | Remove or restrict that group membership (choke point) |
| Critical key vault reachable by a broadly used identity | Tighten role assignments; use managed identities |
| Compromised device can reach payroll servers | Isolate it first; reset credentials cached on it |

## realWorld

A SOC lead runs *Paths to domain admins* monthly. This month it shows 400 users with a three-hop path: they're all in a helpdesk group that has local admin rights on a server where a domain admin regularly signs in. Removing the domain admin's habit of signing in to that server (and using a privileged access workstation instead) removes all 400 paths at once — a single choke-point fix.

## securityExample

An incident shows a compromised laptop, `LAPTOP-31`, belonging to a developer.

1. **Blast radius:** from `LAPTOP-31`, the graph shows the developer can authenticate to a build server, which holds a managed identity with access to the **production key vault**.
2. **Containment order:** isolate `LAPTOP-31`; revoke the developer's sessions; temporarily remove the build server identity's key vault access; rotate secrets in the key vault.
3. **Hunting:** run *Access to key vaults* to find other identities with paths to the same vault — two more are unnecessary and are removed.

Without the graph, the team might have cleaned the laptop and missed the path to production secrets.

## normal

- Admin paths that go through **controlled** privileged access workstations and groups.
- Critical assets reachable only by a **small, known** set of identities.
- Graph scenarios showing paths that match the documented access design.

## suspicious

- **Many paths** from ordinary users to Domain Admins or other critical assets.
- Critical assets reachable from **internet-exposed or vulnerable** devices.
- **Service accounts** or guests with paths to sensitive data.
- A compromised entity in an incident whose blast radius includes **crown-jewel** assets.
- New edges appearing (e.g. a new role assignment) that suddenly create a path to a critical asset.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | Only the 3 identity admins have a path to Domain Admins |
| **Suspicious** | 400 helpdesk users have a 3-hop path to Domain Admins |
| **Confirmed malicious** | A compromised helpdesk account follows that exact path in an active incident |

## abuse

Defensive view — attackers exploit relationships:

| Technique (MITRE ATT&CK) | Relationship abused | Graph helps by… |
|---|---|---|
| Lateral Movement (e.g. Remote Services) | Credentials or sessions on reachable machines | Showing which machines a compromised identity can reach |
| Valid Accounts | Group memberships and role assignments | Revealing indirect paths to privileged groups |
| Steal or Forge Kerberos Tickets: Kerberoasting | Weak service accounts with access to critical assets | *Kerberoast paths to critical assets* scenario |
| Data from Cloud Storage | Identities with access to sensitive storage | *Users with access to sensitive data* scenario |

## evidence

Graphs are built from evidence you already know, connected:
- **Identity relationships** — group memberships, role assignments (Entra ID, Active Directory).
- **Device relationships** — who signs in where, which credentials are present (Defender for Endpoint, Defender for Identity).
- **Cloud relationships** — permissions and network routes to cloud resources (Defender for Cloud).
- **Incident entities** — compromised users, devices and their surroundings.

## where

| Need | Where |
|---|---|
| Interactive graph scenarios | Defender portal → Advanced hunting → **Hunting graph** |
| Blast radius during incidents | Defender incident **graph** |
| Graph data for KQL | `ExposureGraphNodes`, `ExposureGraphEdges` |
| Attack paths and choke points (posture) | Microsoft Security Exposure Management |
| Custom graphs | Microsoft Sentinel graph (data lake) |

## analyst

Use graphs at two moments:

1. **During an incident** — check the blast radius of every compromised entity; contain the paths to critical assets first.
2. **During hunting or posture reviews** — run path scenarios to critical assets, find choke points, and hand concrete fixes to identity and cloud teams.

Always confirm graph findings with the underlying evidence (sign-ins, role assignments) before acting.

## microsoft

- **Hunting graph** in Defender advanced hunting — predefined scenarios, filters, interactive exploration.
- **Blast radius** in the Defender incident graph.
- **Microsoft Sentinel graph** — the graph platform behind these experiences, enabled with Sentinel data lake; custom graphs (preview).
- **Microsoft Security Exposure Management** — the enterprise exposure graph (`ExposureGraphNodes`, `ExposureGraphEdges`), attack paths and choke points.

## explainBack

Q: Why can a graph answer "what can this account reach?" more easily than tables?
A: Reach is about chains of relationships — the account is in a group, the group is admin on a server, the server holds another identity's credentials. A graph follows those links directly; with tables you'd have to join many tables several times.

Q: What is blast radius and why does it matter in an incident?
A: It's the set of assets a compromised entity could reach next. It tells you what's at risk and which paths to cut first, so containment focuses on protecting critical assets.

Q: What is a choke point, and why do defenders love them?
A: A node that appears in many attack paths. Fixing that one node — removing a group membership or a risky sign-in habit — removes many paths at once.
