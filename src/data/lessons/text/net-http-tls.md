## bridge

You know how a computer finds a server (DNS) and connects to it (IP address, TCP port). Most of that traffic today is **web traffic** — HTTP, and especially **HTTPS**, the encrypted version. Attackers use the web too: phishing pages, malware downloads, and command-and-control traffic disguised as normal browsing.

This lesson explains what HTTP and HTTPS are, what encryption hides — and, just as important for defenders, **what it doesn't hide**.

**Chain:** User clicks a link → DNS lookup → TCP connection to port 443 → TLS handshake (server name visible) → encrypted HTTP request → response → proxy/firewall/endpoint logs → analyst investigates the destination, process and pattern

## what

### 1. HTTP
**HTTP (Hypertext Transfer Protocol)** is how browsers and apps request things from web servers. A request has:
- a **method** — `GET` (fetch something) or `POST` (send something);
- a **URL** — which server and which page or resource;
- **headers** — extra information such as the browser's **User-Agent**;
- and the server replies with a **status code**: 200 OK, 301/302 redirect, 403 forbidden, 404 not found, 500 server error.

### 2. HTTPS and TLS
**HTTPS** is HTTP inside an encrypted tunnel created by **TLS (Transport Layer Security)**, usually on **TCP port 443**. TLS gives:
- **Confidentiality** — others on the network can't read the content.
- **Integrity** — content can't be changed in transit unnoticed.
- **Server authentication** — a **certificate** proves the server owns the name you asked for.

### 3. What encryption hides — and what it doesn't
| Hidden by TLS | Still visible to defenders |
|---|---|
| Page content, form data, passwords | **Destination IP** and **port** |
| The full URL path (e.g. `/invoice/download.php`) | The **server name** in the TLS handshake — **SNI (Server Name Indication)** — in most traffic today |
| Cookies and headers | **DNS lookups** for that name (unless DNS is also encrypted) |
| | **Timing, size and frequency** of connections |
| | The **process** that made the connection (on the endpoint) |

## why

**Why HTTPS everywhere?** Without encryption, anyone on the same network (public Wi-Fi, an ISP) could read passwords and change pages. TLS made the web safe for banking, email and work.

**Why do attackers like it?** Because the same encryption hides their phishing pages and malware traffic from network inspection, and port 443 is almost never blocked. So defenders rely more on **metadata** (names, destinations, patterns) and **endpoint** evidence.

## name

- **Hypertext Transfer Protocol** — the *protocol* for *transferring hypertext* (pages with links).
- **HTTPS** — HTTP **S**ecure.
- **TLS** — **Transport Layer Security** (the successor of SSL, which is why people still say "SSL certificate").
- **SNI** — **Server Name Indication**: the client *indicates* which *server name* it wants, so one IP can host many sites.

## problem

Understanding web traffic lets an analyst answer:

1. **Which site did the user actually reach?** — DNS, SNI, proxy logs.
2. **Was something downloaded?** — proxy logs and endpoint file events.
3. **Which program made the connection?** — browser, or something else?
4. **Is this regular "check-in" traffic?** — same destination, steady interval, small requests: possible command and control.
5. **Was the certificate or domain suspicious?** — newly registered, look-alike name, free certificate on a brand-new domain.

## analogy

Sending a parcel through the post in a locked box:

- **TLS** is the locked box: the postal workers can't see what's inside.
- But they can still see the **address on the label** (SNI and destination IP), **how heavy** the box is (size), and **how often** you send one (frequency).
- **The certificate** is the recipient's ID card, checked by a trusted office (the certificate authority) — it proves the address is really theirs, not that they're honest.

## how

### Step 1: A user opens a website
1. The browser asks DNS for `portal.contoso-docs.com` → gets an IP.
2. It opens a TCP connection to that IP on port **443**.
3. **TLS handshake:** the browser sends a *ClientHello* that includes the **SNI** `portal.contoso-docs.com`; the server sends its **certificate**; they agree on keys.
4. Encrypted HTTP: `GET /login` … response `200 OK`.
5. Logs: the DNS server records the lookup; a **proxy** or **firewall** records the destination (and SNI or URL, depending on the device); the **endpoint** records which process connected.

### Step 2: TLS inspection
Some organizations decrypt traffic at a proxy (**TLS inspection**) to see full URLs and content, using a company-trusted certificate on managed devices. It adds visibility but also privacy and compatibility concerns — and some traffic (banking, health) is usually excluded.

### Step 3: Patterns that matter more than content
- **Beaconing**: small requests to the same destination at regular intervals.
- **Rare destinations**: a domain only one device in the company talks to.
- **New domains**: registered days ago, with a fresh certificate.
- **Odd clients**: a non-browser process making HTTPS requests to a site normally visited by browsers.

## realWorld

A typical office laptop makes thousands of HTTPS connections a day: Microsoft 365, update services, the browser, chat. Almost all go to well-known domains used by many devices, from known processes like browsers and Office apps.

## securityExample

Defender for Endpoint shows `rundll32.exe` connecting to `cdn-update-svc.net` on port 443 every 60 seconds.

- **Encrypted** — content unknown.
- But: **rundll32** shouldn't be browsing; the domain was **registered 3 days ago**; only **one device** contacts it; requests are tiny and **perfectly regular**.

The analyst doesn't need to decrypt anything: the metadata and the process tell the story — likely command and control. Block the domain, isolate the device, find how rundll32 was launched.

## normal

- Browsers and Office apps connecting to well-known domains used by many devices.
- Update services checking in regularly — signed processes, known vendor domains.
- Certificates from established certificate authorities for long-standing domains.

## suspicious

- **Non-browser processes** (rundll32, PowerShell, unknown executables) making HTTPS connections.
- **Regular, small** connections to one rare destination (beaconing).
- **Newly registered** domains, look-alike names, IP addresses used directly instead of names.
- **Large uploads** to unusual destinations (possible [[exfiltration|exfiltration]]).
- Direct connections that **bypass the company proxy**.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | Edge connecting to outlook.office.com all day on 500 laptops |
| **Suspicious** | PowerShell connecting to a domain registered yesterday |
| **Malicious** | That connection repeats every 60 seconds and the device later uploads 2 GB to it |

## abuse

Defensive view of web-based attacker techniques:

| Technique (MITRE ATT&CK) | Plain description | What defenders watch |
|---|---|---|
| Application Layer Protocol: Web Protocols (T1071.001) | Command and control over HTTP/HTTPS | Process + destination + regularity |
| Encrypted Channel (T1573) | Hiding traffic in encryption | Metadata, SNI, endpoint process |
| Exfiltration Over Web Service (T1567) | Uploading data to cloud/web services | Upload volume, unusual destinations |
| Phishing: Spearphishing Link (T1566.002) | Links to fake sites | URL clicks, new domains, certificates |

## evidence

- **DNS logs** — names looked up.
- **Proxy logs** — URL or host, user, bytes, status, category.
- **Firewall logs** — IPs, ports, bytes, allow/deny.
- **Endpoint network events** — process, remote IP, port, and often the remote host name.
- **Email/URL click data** — which links users clicked.

## where

| Evidence | Where |
|---|---|
| Endpoint connections with process | `DeviceNetworkEvents` (`RemoteUrl`, `RemoteIP`, `RemotePort`, `InitiatingProcessFileName`) |
| Proxy / firewall logs | `CommonSecurityLog` (CEF), vendor tables |
| URL clicks from email | `UrlClickEvents` |
| DNS lookups | `DnsEvents`, ASIM DNS tables |

## analyst

For any suspicious web connection:

1. **Which process** made it, on which device, as which user?
2. **Which destination** — name, IP, age of the domain, reputation?
3. **What pattern** — once, or regularly? How much data each way?
4. **What happened before** — a click, a download, a new process?
5. **Who else** talks to the same destination?

## microsoft

- **Microsoft Defender for Endpoint** — network events per process; **network protection** and **web content filtering** block malicious or unwanted sites; custom URL/domain indicators.
- **Microsoft Defender for Office 365 Safe Links** — checks URLs at click time.
- **Microsoft Defender for Cloud Apps** — visibility into cloud app use and uploads.
- **Microsoft Sentinel** — proxy and firewall logs via CEF (`CommonSecurityLog`), correlated with endpoint and identity data.

## explainBack

Q: If HTTPS is encrypted, how can a SOC still tell that traffic is suspicious?
A: Encryption hides the content, not the metadata. Analysts can still see the destination IP and usually the server name, the DNS lookup, timing and size patterns, and — on the endpoint — which program made the connection.

Q: What does a valid HTTPS certificate prove?
A: Only that the server controls that domain name. A brand-new phishing domain can have a perfectly valid certificate; it doesn't mean the site is trustworthy.

Q: Why is rundll32.exe making regular HTTPS connections a red flag?
A: rundll32 is a Windows helper for loading DLLs, not a browser. Regular small connections from it to a rare destination look like malware checking in, even without seeing the content.
