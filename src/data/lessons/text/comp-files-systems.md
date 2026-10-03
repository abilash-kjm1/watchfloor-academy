## bridge

In **How a computer works** you learned that storage keeps data long-term. That data is organized into **files**, inside a **file system**. Computers also work together: some act as **clients**, some as **servers**, many run as **virtual machines**, and more and more live in the **cloud**.

This lesson covers all five ideas, with the security relevance of each.

**Chain:** Storage → files and file system → computers talking as client and server → virtual machines → cloud → where each leaves evidence

## what

### 1. File
**Simple:** a named container of data on storage — a document, a photo, a program.

**Technical:** a file has **content** (the data) and **metadata** (information about it): name, size, location (path), owner, permissions and timestamps.

**Why security cares:** malware arrives as files, ransomware encrypts files, and stolen data leaves as files.

### 2. File system
**Simple:** the **filing system** the OS uses to organize files into folders and find them again.

**Technical:** common file systems are **NTFS** (New Technology File System, used by Windows), **ext4** (fourth extended file system, used by most Linux systems) and **APFS** (Apple File System, used by macOS). The file system stores each file's metadata, including:
- **Path** — e.g. `C:\Users\alex\Downloads\invoice.pdf`
- **Permissions** — who may read, change or run it
- **Timestamps** — when it was created, modified and accessed

**Why security cares:** paths, permissions and timestamps are core evidence — *where* a file landed, *who* could change it, and *when*.

### 3. Client and server
**Simple:**
- A **client** asks for something.
- A **server** provides it.

**Technical:** the same computer can be a client for one service and a server for another. Examples:
- Your laptop's browser (client) asks a web server for a page.
- Your laptop (client) opens a shared folder on a **file server**.
- Your laptop (client) asks a **domain controller** (server) to check your password.

**Why security cares:** servers hold **shared, valuable data and services**, so they are high-value targets. A compromised server affects everyone who uses it.

### 4. Virtual machine (VM)
**Simple:** a **computer simulated in software**, running inside a real computer.

**Technical:** a program called a **hypervisor** shares one physical machine's CPU, memory and storage between several virtual machines. Each VM has its own operating system and acts like a separate computer.

**Why security cares:**
- Most company servers today are VMs.
- **Snapshots** (saved copies of a VM's state) help with recovery and investigation.
- Security teams analyze suspicious files in disposable VMs called **[[sandbox|sandboxes]]** — which is why some malware checks whether it's running in a VM.

### 5. Cloud computing
**Simple:** **renting computing** (servers, storage, software) from a provider over the internet instead of owning it.

**Technical:** three common service models:

| Model | You rent… | Example |
|---|---|---|
| **IaaS** — Infrastructure as a Service | Virtual machines, networks, storage | Azure Virtual Machines |
| **PaaS** — Platform as a Service | A ready platform to run your code or database | Azure SQL Database (SQL — Structured Query Language, used by databases) |
| **SaaS** — Software as a Service | Finished software used through a browser | Microsoft 365, Salesforce |

**Why security cares:** in the cloud, **identity becomes the main door** — anyone on the internet can try to sign in — and the cloud provider's **activity logs** become key evidence.

### Cloud, continued: how Microsoft's cloud is organized
Later modules (Sentinel, Defender for Cloud) assume you know four nested containers. From biggest to smallest:

| Container | What it is | Everyday comparison |
|---|---|---|
| **[[tenant|Tenant]]** | Your organization's own Microsoft Entra ID directory: its users, groups and apps | The company itself |
| **[[subscription|Subscription]]** | A billing and management container for Azure resources (a tenant can have many) | A department's budget |
| **[[resource-group|Resource group]]** | A folder holding related resources so they're managed together | A project folder |
| **Resource** | One actual thing: a VM, a [[storage-account|storage account]], a [[key-vault|key vault]], a Log Analytics workspace | A document in the folder |

Every create, change or delete in Azure goes through one front door, **[[azure-resource-manager|Azure Resource Manager]]**, and is written to the **Azure activity log**. That's why "who created this VM at 02:00?" always has an answer.

> Example: tenant *Contoso* → subscription *Production* → resource group *rg-finance* → VM *fin-srv-01*.

## why

- **Files and file systems** exist so data can be stored, named, found and protected.
- **Client/server** exists so many people can share one service (email, files, websites) instead of everyone keeping their own copy.
- **Virtual machines** exist because one powerful physical server can safely run many separate systems, saving money and making systems easy to copy, move and restore.
- **Cloud** exists so organizations can get computing on demand, pay for what they use, and avoid running their own data centers.

## name

- **File** — from paper files in an office.
- **File system** — the *system* for organizing *files*.
- **Client / server** — a *client* is served by a *server*, like in a shop.
- **Virtual** — exists in effect, but not physically.
- **Hypervisor** — a supervisor of the operating systems' supervisors (the kernels).
- **Cloud** — old network diagrams drew the internet as a cloud shape.

## problem

These ideas let an analyst answer:

1. **Where did the file come from, and when?** (file system path and timestamps)
2. **Who could change it?** (permissions)
3. **Which servers did the account reach?** (client/server connections)
4. **Can we roll back or examine a copy?** (VM snapshots)
5. **What did someone do in our cloud [[subscription|subscription]]?** (cloud activity logs)

## analogy

A city:

- **Files** are letters and parcels; the **file system** is the postal system with addresses (paths) and postmarks (timestamps).
- **Client/server** — customers (clients) and shops (servers).
- **Virtual machines** — separate flats inside one apartment building (the physical server), managed by the building manager (the hypervisor).
- **Cloud** — renting a flat instead of building your own house. The landlord maintains the building; you're still responsible for locking your own door.

## how

### Step 1: How the file system records a file

When a file is created:
1. The OS picks space on storage.
2. The file system records the **name**, **path**, **size**, **owner**, **permissions** and **timestamps**.
3. Security tools record a **file event**, often with the file's **hash** (fingerprint) and, for downloads, **where it came from**.

### Step 2: File extensions vs real content

- The **extension** (`.pdf`, `.exe`, `.docx`) is just part of the name. Windows uses it to decide which program opens the file.
- It can be **misleading**: `invoice.pdf.exe` may show as `invoice.pdf` if extensions are hidden. Attackers rename files to look harmless.
- The **hash** identifies the real content regardless of the name.

### Step 3: Client/server in action

1. Your laptop resolves the server's name with **DNS** (Domain Name System — the internet's address book, covered in the Networking module).
2. It connects to the server's **IP address** and **port** (e.g. 445 for file sharing).
3. The server checks your **identity** and **permissions**.
4. Both sides may log the connection and the sign-in.

### Step 4: The shared responsibility model (cloud)

| Who is responsible for… | On-premises | IaaS | PaaS | SaaS |
|---|---|---|---|---|
| Physical data center | You | Provider | Provider | Provider |
| Operating system patches | You | **You** | Provider | Provider |
| Applications | You | You | You (your code) | Provider |
| **Accounts, access and data** | You | **You** | **You** | **You** |

> Whatever the model, **identities, access and data are always the customer's responsibility** — which is why so much cloud security work is identity work.

## realWorld

A normal day in the logs:

- Laptops (clients) open files on the finance **file server** (a VM in Azure).
- Users sign in to **SaaS** apps (Microsoft 365) through Entra ID.
- An administrator creates a new **VM** in Azure, and the action appears in the **Azure activity log**.

## securityExample

A file event shows `invoice.pdf.exe` created in `C:\Users\alex\Downloads`, downloaded from a website first seen today.

What the analyst reads from the file system:
- **Path** — Downloads → came from the internet.
- **Name** — double extension → pretending to be a PDF.
- **Timestamp** — 2 minutes after the user clicked a link in an email.
- **Hash** — search all devices for the same file.

Then, because the file ran, they check what it connected to (client/server) and whether it changed anything on file servers.

## normal

- Office documents saved in users' Documents and on file servers.
- Installers in `C:\Program Files`, Windows files in `C:\Windows`.
- Clients connecting to the company's known servers.
- VMs and cloud resources created by the IT team with change tickets.

## suspicious

- **Executable files in Downloads, Temp or AppData**, especially unsigned.
- **Double extensions** (`.pdf.exe`) or names imitating system files.
- **Timestamps that don't make sense** — a "new" file dated years ago.
- **Mass renames or rewrites** on a file server (ransomware).
- A **workstation acting like a server** (accepting many incoming connections).
- **Cloud resources created** at odd hours, in unusual regions, by unusual accounts.

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A user saves `budget.xlsx` to the finance file server |
| **Suspicious** | `invoice.pdf.exe` appears in a user's Downloads folder |
| **Confirmed malicious** | That file ran, connected to an unknown server, and 4,000 files on the file server were then renamed with a new extension |

## abuse

Defensive view — how these building blocks are misused:

| Area | Misuse | What defenders watch |
|---|---|---|
| Files | Disguised file types and names (*Masquerading*) | Double extensions, signatures, hashes |
| File system | Changing file timestamps to hide activity (*Timestomp*); hiding data in file-system features | Timestamp inconsistencies; EDR file events |
| Servers | Encrypting shared files (*ransomware*); stealing shared data | Mass file changes; unusual access to shares |
| VMs | Malware detecting sandboxes to stay quiet (*Virtualization/Sandbox Evasion*) | Behavior across real devices, not just sandboxes |
| Cloud | Using stolen cloud accounts (*Valid Accounts: Cloud Accounts*); creating resources for mining | Sign-in logs; cloud activity logs |

## evidence

- **File events** — created, modified, renamed, deleted; path, hash, origin URL.
- **Connection and logon events** — clients reaching servers.
- **VM snapshots** — copies of a system at a point in time.
- **Cloud activity logs** — who created, changed or deleted cloud resources, from which IP.

## where

| Evidence | Where |
|---|---|
| File changes on endpoints | `DeviceFileEvents` (Defender for Endpoint) |
| Clients connecting to servers | `DeviceNetworkEvents`, `DeviceLogonEvents`, Windows `SecurityEvent` |
| Azure resource changes (VMs, storage, networks) | `AzureActivity` in Microsoft Sentinel |
| Cloud app activity (SaaS) | `CloudAppEvents` (Defender for Cloud Apps) |
| Cloud sign-ins | `SigninLogs` (Entra ID) |

## analyst

For any suspicious file:
1. **Where is it?** (path)
2. **Where did it come from?** (origin URL / email / share)
3. **When?** (timestamps, in [[utc|UTC]] — Coordinated Universal Time, the single time zone security logs use)
4. **Did it run?** (process events with the same hash)
5. **Where else is it?** (search the hash everywhere)

For servers, VMs and cloud:
- Which **clients** connected to the server, and with which **accounts**?
- Can a **snapshot** preserve the VM's state for investigation?
- What do the **cloud activity logs** show around the same time?

## microsoft

- **Defender for Endpoint** — file events with hashes and download origins.
- **Defender for Cloud** — protects cloud workloads (VMs, storage, databases) and raises alerts; investigating these alerts is an SC-200 objective.
- **Microsoft Sentinel** — collects Azure activity logs through the **Azure Activity** connector, configured at scale with **Azure Policy**.
- **Defender for Cloud Apps** — visibility into SaaS app activity.

## explainBack

Q: Explain what a file system does, using a library.
A: It's the library's catalog: it records where each book (file) is kept, its title, who may borrow it, and when it was added or changed — so books can be found again and protected.

Q: Why is `invoice.pdf.exe` suspicious even before you know what it does?
A: The real type is the last extension — .exe, a program. Putting .pdf before it is an attempt to make a program look like a harmless document, especially when Windows hides known extensions.

Q: In the cloud shared responsibility model, what does the customer always remain responsible for, and why does that matter to a SOC?
A: Their own accounts, access and data. So when cloud resources are misused, the cause is often a compromised account or wrong permissions — which is why cloud investigations lean so heavily on sign-in and activity logs.
