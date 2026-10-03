## bridge

You now know that every action on a computer is done by a **process** running as an **account**. Many processes also talk to other computers.

This lesson explains how that conversation works — addresses, ports and protocols — so you can read the network evidence that appears in almost every investigation.

**Chain so far:** Program → Process → *Network connection* → IP address + port → Network evidence

## what

### First, three everyday networking words

**Network**
- Devices connected so they can send data to each other.

**Packet**
- Data sent over a network is cut into small pieces called **packets**. Each packet carries a "from" address and a "to" address, like an envelope.

**Protocol**
- An agreed set of rules for how two devices talk — like a shared language. HTTPS, DNS and email all have their own protocols.

Now the four building blocks of every network connection.

### 1. IP address
An **[[ip-address|IP address]]** identifies a **device** on a network.
- IPv4 example: `10.10.20.14`
- IPv6 example: `2001:db8::1`

### 2. Port
A **[[port|port]]** identifies a specific **service** (program) on that device.
- Example: port `443` is used for secure websites (HTTPS).

### 3. TCP
**[[tcp|TCP]]** is a way of sending data that is **reliable and ordered**.
- It sets up a connection first, and checks that every piece arrives.

### 4. UDP
**[[udp|UDP]]** is a way of sending data that is **fast but unchecked**.
- It sends messages without setting up a connection, and doesn't confirm they arrived.

> Simple rule: the **IP address** gets data to the right *machine*. The **port** gets it to the right *program* on that machine.

## why

- **IP addresses** exist because many devices share one network, and each needs a unique address.
- **Ports** exist because each device runs many services at once (web, email, file sharing).
- **TCP** exists because many applications need every byte delivered correctly and in order — web pages, email, files.
- **UDP** exists because some applications prefer **speed** over guaranteed delivery — DNS lookups, voice calls, video.

## name

- **Port** — like a harbor with many docks. One city (IP address) has many docks (ports).
- **TCP** — *Transmission Control Protocol*: it **controls** the transmission to make it reliable.
- **UDP** — *User Datagram Protocol*: a **datagram** is a self-contained message.

## problem

Most network logs are made of five values:

| Value | Example |
|---|---|
| Source IP | `10.10.20.14` |
| Source port | `52344` |
| Destination IP | `13.107.4.50` |
| Destination port | `443` |
| Protocol | TCP |

If you understand these five values, you can answer:

- **Which device** talked to **which device**?
- **Which service** was used?
- **Did it work?**

## how

### The layers of networking (TCP/IP model)

Networking is easier to understand as **four layers**, each doing one job. Every layer creates its own evidence.

| Layer | Job | Examples | Evidence it creates |
|---|---|---|---|
| **Application** | What the program wants to do | HTTPS, DNS, email (SMTP), RDP | Web proxy logs, DNS logs, email logs |
| **Transport** | Reliable or fast delivery, using ports | TCP, UDP | Port numbers and connection states in firewall logs |
| **Internet** | Addressing and routing between networks | IP addresses | Source and destination IPs in almost every log |
| **Link** | Moving data on the local network | Ethernet, Wi-Fi, MAC addresses | Switch and wireless logs (rarely used in SOC work) |

> You may also hear about the **OSI model**, which splits the same ideas into 7 layers. The 4-layer TCP/IP model above is enough for SOC work.

### Devices that move and filter traffic

- **Switch** — connects devices inside one local network.
- **Router** — connects different networks together and decides where packets go next.
- **Firewall** — allows or blocks traffic based on rules (for example, "block incoming RDP from the internet") and logs what it allowed or blocked.

### IPv4 and private addresses

- An IPv4 address is four numbers from 0 to 255, e.g. `192.168.1.10`.
- Some ranges are **private** — used inside organizations and never routed on the internet:

| Private range | Size |
|---|---|
| `10.0.0.0` – `10.255.255.255` | Large networks |
| `172.16.0.0` – `172.31.255.255` | Medium networks |
| `192.168.0.0` – `192.168.255.255` | Home / small networks |

- **[[nat|NAT]]** (Network Address Translation) lets many private devices share **one public IP** when they go to the internet.

### IPv6
- IPv6 addresses are much longer (128 bits) and written in hexadecimal, e.g. `2001:db8::1`.

### Subnets
- A **[[subnet|subnet]]** is a block of addresses, written like `10.10.20.0/24`.
- Each IPv4 address is made of 32 **bits** (ones and zeros), shown as four numbers of 8 bits each.
- `/24` means the first 24 bits (the first three numbers) identify the network — so this subnet holds `10.10.20.0` to `10.10.20.255`.

### Documentation addresses used in this course

Examples in this course use addresses like `203.0.113.77`, `198.51.100.23` and `192.0.2.10`. These ranges are **reserved for documentation** (by the internet standard RFC 5737), so they never belong to a real company or attacker. They are **not** private addresses.

### The TCP three-way handshake

Before TCP sends data, it sets up a connection in three steps:

1. **SYN** — the client says: *"I want to connect."*
2. **SYN-ACK** — the server replies: *"OK, I acknowledge."*
3. **ACK** — the client confirms: *"Acknowledged."*

Then data flows. At the end:

- **FIN** — closes the connection politely.
- **RST** — aborts it immediately.

### Server ports and client ports

- **Servers** listen on well-known ports (0–1023), e.g. 443 for HTTPS.
- **Clients** use a random high port, called an **ephemeral port**, e.g. 52344.

### Common ports to recognize

| Port | Protocol | Used for |
|---|---|---|
| 53 | DNS — Domain Name System | Looking up names |
| 80 | HTTP — Hypertext Transfer Protocol | Websites (unencrypted) |
| 443 | HTTPS — HTTP Secure | Websites (encrypted) |
| 25 / 587 | SMTP — Simple Mail Transfer Protocol | Sending email |
| 22 | [[ssh|SSH]] — Secure Shell | Remote Linux administration |
| 3389 | [[rdp|RDP]] — Remote Desktop Protocol | Remote Windows desktop |
| 445 | [[smb|SMB]] — Server Message Block | Windows file sharing |
| 389 / 636 | [[ldap|LDAP]] / LDAPS — Lightweight Directory Access Protocol | Looking up accounts in a directory such as Active Directory |
| 88 | Kerberos | Windows domain sign-in (named after the three-headed guard dog of Greek myth) |
| 67 / 68 | [[dhcp|DHCP]] — Dynamic Host Configuration Protocol | Getting an IP address automatically |

## analogy

- **IP address** = a building's street address.
- **Port** = the apartment number inside the building.
- **TCP** = registered mail: signed for on delivery.
- **UDP** = a postcard: fast and cheap, but nobody confirms it arrived.

## realWorld

A laptop opens a website:

1. The laptop's address is `10.10.20.14`.
2. It connects **from** port `52344` (ephemeral) **to** `13.107.4.50` on port `443` (HTTPS) using TCP.
3. The firewall writes a log with those values, whether it was **allowed**, and how much data moved each way.

## securityExample

A firewall log shows:

> One workstation connected to **60 other workstations** on port **445** (SMB) in five minutes.

Why this stands out:

- Workstations rarely need to reach **other workstations** for file sharing.
- This pattern could mean **scanning** or **an attacker moving between computers**.
- It could also be a **misconfigured inventory tool**.

> The pattern makes it worth checking. **Context** — which program, which account — decides the verdict.

## normal

- Workstations → internet on **443** (websites and cloud apps).
- Workstations → internal DNS servers on **53**.
- Workstations → file servers and domain controllers on **445, 88, 389**.
- Admin jump servers → other servers on **3389** or **22**.
- Traffic that follows **business hours**.

## suspicious

- Remote admin ports (**3389, 22**) **open to the internet**, with many failed connection attempts.
- **Workstation-to-workstation** traffic on admin protocols (SMB, RDP).
- Very **regular outbound connections** to one rare IP at fixed intervals.
  - This could be malware "checking in" ([[beaconing|beaconing]]) — or a normal updater. Check which program is doing it.
- **Large uploads** to an unfamiliar destination.
- A protocol on an **unusual port** for that protocol.

## abuse

Defensive view:

- **Exposed remote-access services** attract automated password guessing.
- **Internal protocols** like SMB and RDP are commonly used to move between machines once an attacker is inside.
- **Outbound traffic on 443** is often used to blend in with normal web browsing.

> This is why SOCs watch **who talks to whom**, not just which ports are open.

## evidence

| Source | What it tells you |
|---|---|
| Firewall / proxy logs | Allowed or denied, IPs, ports, bytes transferred |
| Endpoint network events | The same — **plus which program** made the connection |
| Cloud flow logs | Traffic inside cloud networks |
| Windows Filtering Platform events | Connections allowed/blocked by Windows Firewall |

## where

- `CommonSecurityLog` — firewalls sending logs in CEF (Common Event Format, a standard text format for security devices) to Sentinel.
- `Syslog` — Linux and network devices.
- `DeviceNetworkEvents` — Defender for Endpoint, including the program responsible.
- Azure network flow logs.

## analyst

The most important question for any connection:

> **"Which program made this connection?"**

- **Firewall logs** only show IP addresses and ports.
- **Endpoint telemetry** adds the **program** and the **user**.

Whenever you can, combine the two.

## microsoft

**Defender for Endpoint** — the `DeviceNetworkEvents` table includes:

- `RemoteIP` — the destination address
- `RemotePort` — the destination port
- `RemoteUrl` — the destination name, when known
- `InitiatingProcessFileName` — **the program that made the connection**
- `ActionType` — e.g. `ConnectionSuccess`

**Microsoft Sentinel** — ingests firewall logs through **CEF / Syslog via the Azure Monitor Agent**.

## explainBack

Q: Explain the difference between an IP address and a port using a building.
A: The IP address is the building's street address — it gets data to the right computer. The port is the apartment number — it gets the data to the right program inside that computer, such as the web server on 443.

Q: Why do analysts say "which process made this connection?" is the most important network question?
A: A firewall only sees addresses and ports. Many programs use port 443, good and bad. Knowing which program on the laptop opened the connection tells you whether it was the browser doing normal work or an unknown program that needs investigating.

Q: A workstation connects to 60 other workstations on port 445 in five minutes. Is that an attack?
A: Not necessarily — it's unusual, because workstations rarely need each other's file sharing, but an IT inventory tool could do this. Check which program and which account made the connections before deciding.
