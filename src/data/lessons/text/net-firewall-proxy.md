## bridge

Endpoint sensors show what happens **inside** a device. But some devices have no sensor â€” printers, cameras, unmanaged laptops, servers you don't control â€” and some attacks are best seen **at the edge**, where traffic enters and leaves the network. That's where **firewalls** and **proxies** sit, and their logs are among the most valuable a SOC collects.

**Chain:** Device sends traffic â†’ firewall allows or blocks it (and may translate addresses) â†’ proxy handles web requests (URL, user, category) â†’ logs sent via syslog/CEF â†’ Sentinel `CommonSecurityLog` â†’ analyst correlates with endpoint and identity data

## what

### 1. Firewall
A **firewall** decides which network connections are **allowed** or **denied**, based on rules: source, destination, port, protocol (and in next-generation firewalls, application and user). Each decision can be logged:
- time, **source IP/port**, **destination IP/port**, protocol;
- **action** â€” allow, deny, drop;
- bytes sent and received;
- the rule that matched.

### 2. Proxy
A **web proxy** sits between users and the internet for web traffic. Because it handles each request, its logs usually include:
- the **user** (if authenticated);
- the **URL or host name**;
- the **category** (news, social media, malware, newly registeredâ€¦);
- **status code**, bytes, and whether it was **blocked**.

### 3. NAT â€” why the IP isn't always the device
**NAT (network address translation)** lets many internal devices share one public IP address. Outside logs show only the public IP; the firewall's NAT records are needed to find which **internal** device it was. Many internal devices, one external IP â€” a classic investigation trap.

### 4. CEF and syslog
Most firewalls and proxies send logs over **syslog**, often in **Common Event Format (CEF)** â€” a standard layout with named fields. In Sentinel, CEF logs land in **`CommonSecurityLog`**.

## why

**Why firewalls?** To enforce *which* traffic is allowed at all â€” the network equivalent of locked doors.

**Why proxies?** To control and log web use centrally â€” block malicious categories, see URLs, attribute traffic to users.

**Why their logs matter to a SOC:** they are **outside the endpoint**. An attacker on a laptop can clear local logs or disable an agent, but cannot edit what the firewall already recorded. And they cover devices with **no sensor** at all.

## name

- **Firewall** â€” from buildings: a wall that stops a fire spreading between sections.
- **Proxy** â€” someone acting *on behalf of* another; the proxy makes web requests on behalf of users.
- **NAT** â€” network address *translation*: internal addresses are *translated* to a public one.
- **CEF** â€” Common Event Format: a *common format* for security *events*.

## problem

Firewall and proxy logs let an analyst answer:

1. **Did this device talk to that IP â€” and was it allowed?**
2. **How much data left the network, and to where?**
3. **Which user browsed to this site?** (proxy)
4. **Was the connection blocked, or did it get through?**
5. **What did devices without endpoint protection do?**

## analogy

A building's security desk and post room:

- The **firewall** is the desk at the entrance: it checks every person against the list, lets them in or turns them away, and writes it in the log.
- The **proxy** is the post room: all outgoing letters go through it; it notes who sent what to whom and refuses parcels to banned addresses.
- **NAT** is the company's single return address: outsiders see "Contoso HQ", and only the post room knows which desk sent each letter.

## how

### Step 1: Reading a firewall log line (CEF)
A firewall log in `CommonSecurityLog` has fields like:
| Field | Meaning |
|---|---|
| `DeviceVendor`, `DeviceProduct` | Which firewall produced it |
| `SourceIP`, `DestinationIP`, `DestinationPort` | Who talked to whom, on which port |
| `Protocol` | TCP, UDPâ€¦ |
| `DeviceAction` | Allow, deny, drop (vendor wording varies) |
| `SentBytes`, `ReceivedBytes` | Volume in each direction |
| `RequestURL` | For proxies/web filters: the requested URL |

### Step 2: Allowed vs blocked
- **Blocked** connections show the control working â€” but repeated blocks from one internal device can mean malware trying to reach its server.
- **Allowed** connections to bad destinations are the urgent ones.

### Step 3: Correlate with the endpoint
Firewall logs show the **IP**; endpoint data shows the **process** and **user**. Join them on internal IP and time â€” after resolving NAT if needed.

### Step 4: Getting the logs into Sentinel
Firewall/proxy â†’ syslog (CEF) â†’ a Linux log forwarder running the **Azure Monitor Agent (AMA)** â†’ **CEF via AMA** data connector â†’ `CommonSecurityLog`.

## realWorld

A mid-size company's firewall logs millions of allowed connections a day â€” mostly web traffic to well-known services â€” plus thousands of blocked inbound scans from the internet against its public IPs. The proxy blocks a few hundred requests to malicious or uncategorized sites daily, mostly from ads and typos.

## securityExample

The proxy shows a user's laptop was **blocked** 40 times in an hour trying to reach a site categorized as "newly registered". The user isn't browsing at all â€” it's 03:00.

Firewall logs show an **allowed** connection from the same laptop at 03:05 to an IP address directly (no proxy) on port 8443, sending 900 MB out.

Two sources, one story: something on the laptop tried the proxy, got blocked, then went around it and exfiltrated data. The analyst isolates the laptop, blocks the IP, and asks the network team why direct outbound 8443 was allowed.

## normal

- Huge volumes of allowed web traffic to well-known services.
- Blocked inbound scans from the internet.
- Occasional proxy blocks for ads, typos and uncategorized sites.
- Large uploads to approved cloud services (backup, file sharing).

## suspicious

- **Repeated blocks** from one internal device to the same destination.
- **Allowed** connections to newly registered or rare destinations.
- **Direct-to-IP** traffic that bypasses the proxy.
- **Large outbound** transfers, especially at night.
- Internal devices connecting to **many internal hosts** on admin ports (scanning, lateral movement).
- A firewall that **stops sending logs**.

### Normal â†’ suspicious â†’ malicious

| | Example |
|---|---|
| **Normal** | 2 GB upload to the company's approved backup service every night |
| **Suspicious** | 40 proxy blocks from one laptop to a newly registered domain at 03:00 |
| **Malicious** | The same laptop then sends 900 MB directly to an unknown IP on port 8443 |

## abuse

Defensive view:

| Technique (MITRE ATT&CK) | What firewall/proxy logs show |
|---|---|
| Exfiltration Over C2 Channel (T1041) / Over Web Service (T1567) | Unusual outbound volume and destinations |
| Non-Standard Port (T1571) | Allowed traffic on unusual ports |
| Proxy bypass / direct connections | Traffic not going through the proxy |
| Network Service Discovery (T1046) | One internal host touching many hosts/ports |

## evidence

- **Firewall logs** â€” allow/deny decisions, IPs, ports, bytes, rules.
- **NAT logs** â€” mapping of internal to public addresses.
- **Proxy logs** â€” users, URLs, categories, blocks.
- **VPN logs** â€” remote user to internal IP mapping.

## where

| Evidence | Where |
|---|---|
| Firewall and proxy logs in CEF | `CommonSecurityLog` (CEF via AMA) |
| Other syslog appliances | `Syslog` |
| Endpoint view of the same connection | `DeviceNetworkEvents` |
| Azure network logs | Azure Firewall / network security group logs in the workspace |

## analyst

For any network-level alert:

1. **Allowed or blocked?** Blocked shows intent; allowed shows exposure.
2. **Which internal device?** Resolve NAT, Dynamic Host Configuration Protocol (DHCP) leases and VPN sessions to the real host.
3. **Which process and user?** Correlate with endpoint and identity data.
4. **How much data, where, when?**
5. **Did it bypass controls?** Why was that path allowed?

## microsoft

- **Microsoft Sentinel** â€” CEF via AMA and Syslog via AMA connectors; `CommonSecurityLog` and `Syslog` tables; ASIM network session parsers to query many firewall brands the same way.
- **Azure Firewall** and **network security groups** â€” Azure's own firewall logs.
- **Microsoft Defender for Endpoint** â€” network protection and the endpoint view of connections.
- **Microsoft Defender for Cloud Apps** â€” cloud discovery can analyze firewall/proxy logs to find shadow IT.

## explainBack

Q: Why are firewall logs valuable even when you have endpoint protection?
A: They live outside the endpoint, so an attacker on the device can't erase them, and they also cover devices that have no endpoint sensor at all.

Q: What problem does NAT create for investigations?
A: Many internal devices share one public IP, so external logs can't tell you which device it was. You need the firewall's NAT records (and DHCP/VPN logs) to map it back to the real machine.

Q: A laptop is blocked 40 times by the proxy, then makes a direct connection that's allowed. What does that tell you?
A: Something on the laptop wanted to reach that destination badly enough to try another path â€” and found one. The proxy worked; the firewall rule allowing direct traffic is a gap to close, and the laptop needs investigation.
