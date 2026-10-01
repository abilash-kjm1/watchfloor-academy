## bridge

In **IP addresses, ports, TCP and UDP** you learned that computers talk using IP addresses. But people type **names**, not numbers.

This lesson explains how names become addresses — and why that lookup step is one of a defender's best sources of evidence, because attackers' programs need to look up names too.

**Chain:** Process → *DNS lookup* (name → IP) → Network connection → DNS + network evidence → search for known-bad names

## what

The **[[dns|Domain Name System (DNS)]]** turns human-friendly names into IP addresses.

- You type: `www.contoso.com`
- DNS answers: `13.107.4.50`
- Your computer then connects to that IP address.

Two roles to know:

- **Resolver** — the DNS server your device asks first (usually a company DNS server or your internet provider).
- **Authoritative server** — the server that holds the official answer for a domain.

## why

- **Humans** remember names, not numbers.
- **IP addresses change.** DNS lets a service move to a new IP without anyone updating their bookmarks.
- **Scale.** One name can point to many servers, spreading the load.

## name

- **Domain** — a named area of the internet, like `contoso.com`.
- **Name System** — a system for looking those names up.

DNS replaced a single text file (`HOSTS.TXT`) that early internet computers had to copy around by hand.

## problem

For defenders, DNS solves a **visibility** problem.

- Before a device connects to almost anything by name, it **asks DNS first**.
- So DNS logs show **which domains** devices tried to reach.
- This works **even when the connection itself is encrypted** (HTTPS).

## how

### The lookup, step by step

1. An app needs the address for `portal.contoso.com`.
2. The computer checks its **local cache** (recent answers it remembers).
3. If it isn't cached, it asks the **resolver**.
4. The resolver finds the answer by asking, in order:
  - the **root** servers
  - the **`.com`** servers
  - **contoso.com's** authoritative servers
5. The answer comes back and is **cached** for a set time, called the **TTL** (time to live).
6. The app connects to the returned IP address.

### Common record types

| Record | What it holds | Example |
|---|---|---|
| **A** | An IPv4 address | `portal.contoso.com → 13.107.4.50` |
| **AAAA** | An IPv6 address | `→ 2001:db8::50` |
| **CNAME** | An alias pointing to another name | `www → portal.contoso.com` |
| **MX** | The mail server for a domain | `contoso.com → mail.contoso.com` |
| **TXT** | Text, such as email security policies (SPF — a record listing which servers may send email for the domain) | `v=spf1 include:…` |

## analogy

DNS is like the **contacts list on your phone**:

- You tap "Pizza Place" — you don't memorize its number.
- If someone looks up a business that **opened yesterday** with a name **suspiciously similar to your bank**, that's worth noticing — even **before** they call it.

## realWorld

A normal corporate laptop looks up names like these **hundreds of times a day**:

- `outlook.office365.com`
- `teams.microsoft.com`
- `contoso.sharepoint.com`

This is completely normal.

## securityExample

Minutes after a batch of emails arrives, DNS logs show **three laptops** looking up:

> `contoso-helpdesk.example` — a name imitating the company.

What happens next:

1. The domain becomes an **IOC** (Indicator of Compromise — a known-bad clue you can search for; you will study IOCs properly in Module 1).
2. Search for **every device** that looked it up.
3. Check which of those devices **actually connected** to it.
4. Check **which program** on each device made the connection.

## normal

- Large numbers of lookups for well-known **cloud and update** domains.
- Lookups for **internal** company names.
- Mostly **A, AAAA and CNAME** records.
- A **small number** of failed lookups (people mistype addresses).

## suspicious

- **Newly registered** or **look-alike** domains.
- **Long, random-looking** subdomains, or huge numbers of lookups to one domain.
  - This can mean data is being hidden inside DNS requests (*DNS tunneling*).
- **Many failed lookups** (NXDOMAIN) from one device.
  - This can mean malware trying many generated domain names.
- Devices using **outside DNS servers directly**, skipping the company's resolver.
- **TXT lookups from ordinary workstations** at unusual rates.

## abuse

Defensive view:

- DNS is **almost always allowed** through firewalls.
- So attackers use it to **find their servers**, and sometimes to **hide data** inside DNS requests.

Defenders respond with:

- DNS **logging**
- **Reputation** filtering
- **Alerting** on the suspicious patterns above

## evidence

A DNS log usually contains:

- The **name** looked up
- The **record type** (A, AAAA, TXT…)
- The **response code** (success, NXDOMAIN…)
- The **IP addresses** returned
- The **device** that asked
- The **time**

Some endpoint tools also record **which program** made the lookup.

## where

| Source | Where it appears |
|---|---|
| Windows DNS server logs | Microsoft Sentinel — the **Windows DNS Events via AMA** connector (AMA = Azure Monitor Agent, the program that sends logs to Sentinel) writes the normalized table `ASimDnsActivityLogs` (older setups used `DnsEvents`) |
| Endpoint connections | Defender for Endpoint `DeviceNetworkEvents` (`RemoteUrl`) |
| Domain controller DNS activity | Defender for Identity (`IdentityQueryEvents`) |
| Web filtering | Firewalls and secure web gateways with DNS filtering |

## analyst

When you have a suspicious domain, answer these five questions:

1. **Who looked it up?** — DNS logs.
2. **Who actually connected?** — network events.
3. **Which program connected?** — endpoint telemetry.
4. **When did it first appear** in our environment?
5. **How old is the domain, and what is its reputation?**

> A lookup **is not** a compromise. Confirm with connections and process evidence.

## microsoft

- **Microsoft Sentinel** offers DNS connectors and **ASIM** (Advanced Security Information Model) parsers, so DNS logs from different products can be searched the same way.
- **Defender for Endpoint network protection** can block connections to malicious domains.

## explainBack

Q: Explain DNS without using the word "DNS".
A: When a program needs to reach a website by name, it first asks a lookup service, "what's the number for this name?" The service answers with an IP address, and the program connects to that address. It works like the contacts list on your phone.

Q: Why are DNS logs useful even when the website traffic itself is encrypted?
A: The lookup happens before the encrypted connection and is usually recorded by the company's DNS server. So you can see which names a computer tried to reach, even if you can't see the content of the connection.

Q: 300 devices looked up a suspicious domain. Are 300 devices compromised?
A: Not necessarily. A lookup isn't a connection, and the domain might be shared infrastructure or triggered by a link preview or security scanner. Check which devices actually connected, and which program made the connection.
