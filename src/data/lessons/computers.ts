import type { Lesson } from '../types'
import { res } from '../resources'

/** Computer Fundamentals: hardware, OS, files, client/server, VMs and cloud. Teaching text lives in ./text/<id>.md */
export const computerLessons: Lesson[] = [
  {
    id: 'comp-hardware-os',
    moduleId: 'computers',
    title: 'How a computer works: CPU, memory, storage and the operating system',
    summary: 'The four core parts of every computer — and why each one matters in a security investigation.',
    mode: 'soc', minutes: 35, levels: ['beginner', 'understand', 'recognize'], skills: ['computers'],
    sections: {},
    diagram: {
      title: 'What happens when you open a program',
      steps: [
        { label: 'Double-click', detail: 'You ask the operating system to start a program.' },
        { label: 'Read from storage', detail: 'The OS reads the program file from the disk (long-term, keeps data without power).' },
        { label: 'Load into RAM', detail: 'The instructions are copied into memory (fast, wiped at power-off). A process is created.' },
        { label: 'CPU executes', detail: 'The CPU runs the instructions, billions of steps per second.' },
        { label: 'System call', detail: 'To open a file or use the network, the program asks the kernel.' },
        { label: 'Kernel decides', detail: 'The kernel checks permissions and does the work — or refuses.' },
      ],
    },
    kql: [
      { title: 'Which operating systems are running in the company?', table: 'DeviceInfo', query: 'DeviceInfo\n| summarize arg_max(Timestamp, *) by DeviceId   // latest record per device\n| summarize Devices = count() by OSPlatform, OSVersion\n| sort by Devices desc', explain: 'An inventory of operating systems. Old or unsupported versions stand out — they miss security updates and are easier to attack.' },
      { title: 'Processes by privilege (integrity) level', table: 'DeviceProcessEvents', query: 'DeviceProcessEvents\n| where Timestamp > ago(1d)\n| summarize Processes = count(), Devices = dcount(DeviceId) by ProcessIntegrityLevel\n| sort by Processes desc', explain: 'Windows gives each process an integrity level (for example Low, Medium, High, System). Most user programs run at Medium; High and System mean more power — the same idea as kernel vs user privilege, seen from the evidence.' },
    ],
    mitre: [
      { id: 'T1496', name: 'Resource Hijacking', tactic: 'Impact', note: 'Using a victim\'s CPU for the attacker\'s benefit, such as cryptocurrency mining.' },
      { id: 'T1068', name: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation', note: 'Using an OS or driver vulnerability to gain higher (kernel or admin) control — why updates matter.' },
      { id: 'T1014', name: 'Rootkit', tactic: 'Stealth', note: 'Malicious code at kernel level that hides activity from the OS and tools.' },
      { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', note: 'Ransomware encrypting files on storage.' },
    ],
    sc200: { note: 'SC-200 assumes you understand what an endpoint is made of. Device inventory, OS versions and exposure appear in Defender for Endpoint, and you must know which table holds device details.', objectives: ['ir-mde', 'hunt-table'] },
    lab: {
      title: 'Look inside your own computer',
      environment: 'Your own Windows PC (read-only, safe)',
      steps: [
        'Open Task Manager (Ctrl+Shift+Esc) → Performance tab. Note your CPU model and number of cores, total memory (RAM), and your disk type (SSD or HDD).',
        'Open the Processes tab and sort by CPU. Which program uses the most right now? Sort by Memory — which uses the most RAM?',
        'Press Windows key, type "winver" and press Enter. Write down your Windows version.',
        'Optional: search "BitLocker" in the Start menu to see whether your disk is encrypted.',
      ],
      reflect: ['If a program you didn\'t recognize used 90% CPU all night, what would you check first?', 'Why would switching the computer off destroy some evidence but not all of it?'],
    },
    quiz: [
      { id: 'q-hw-1', prompt: 'Which part of a computer is volatile — loses its contents when the power is turned off?', options: ['Storage (SSD/HDD)', 'RAM (memory)', 'The file system', 'BitLocker'], answer: [1], explanation: 'RAM is fast short-term memory that is wiped at power-off. Storage keeps data without power.', concept: 'Volatile memory', skill: 'computers', kind: 'knowledge' },
      { id: 'q-hw-2', prompt: 'Why might a responder isolate a compromised computer instead of turning it off?', options: ['Turning it off is against company policy', 'Powering off wipes RAM, which may hold evidence, and stops remote investigation', 'Isolation is faster to type', 'Turning it off deletes the hard drive'], answer: [1], explanation: 'Memory evidence disappears at power-off, and the security tools can no longer collect data. Isolation contains the device while keeping it running.', concept: 'Evidence in memory', skill: 'ir', kind: 'scenario' },
      { id: 'q-hw-3', prompt: 'An unknown, unsigned process uses 95% CPU all night on a laptop. What is a likely explanation to investigate?', options: ['The keyboard is broken', 'A hidden cryptocurrency miner (resource hijacking)', 'The file system is full', 'DNS is misconfigured'], answer: [1], explanation: 'Unexplained sustained CPU use by an unknown process is a classic sign of mining malware — though you still confirm with evidence.', concept: 'Resource hijacking', skill: 'computers', kind: 'scenario' },
      { id: 'q-hw-4', prompt: 'What runs in kernel mode?', options: ['Web browsers', 'The core of the operating system and drivers', 'Office documents', 'Email attachments'], answer: [1], explanation: 'The kernel and drivers have full privileges. Normal applications run in user mode and must ask the kernel through system calls.', concept: 'Kernel mode', skill: 'computers', kind: 'knowledge' },
      { id: 'q-hw-5', prompt: 'Why does a program reading the memory of lsass.exe raise a serious alert?', options: ['lsass.exe is a game', 'lsass.exe handles sign-ins, so its memory can contain credential material', 'Reading memory is always slow', 'lsass.exe is unsigned'], answer: [1], explanation: 'Credential-stealing tools target the memory of the process that handles sign-ins. It\'s rarely needed by legitimate software.', concept: 'Credentials in memory', skill: 'windows', kind: 'knowledge' },
    ],
    interview: ['iv-hardware-security'],
    mistakes: ['Thinking RAM and storage are the same thing.', 'Switching off a compromised computer by reflex.', 'Ignoring OS updates as "IT\'s problem" — missing patches are security risks.', 'Assuming high CPU always means malware (check the process first).'],
    tip: 'When you open any endpoint alert, ask the four-part question: what was running (CPU/RAM), what changed on disk (storage), did anything touch the kernel, and is the OS up to date?',
    think: { prompt: 'A user reports that their files suddenly have strange extensions and won\'t open. Which part of the computer is affected, and what is your first action?', answer: 'Storage — this looks like ransomware encrypting files. Isolate the device immediately to stop it reaching shared drives on servers, keep it powered on for evidence, and check file servers for the same mass changes.' },
    takeaways: ['CPU computes, RAM holds what is running (volatile), storage keeps data long-term, the OS manages them.', 'Kernel mode has full control; user mode must ask the kernel.', 'Each part leaves different evidence and is misused differently.', 'Prefer isolation over power-off to preserve memory evidence.'],
    connect: ['cpu', 'ram', 'storage', 'operating-system', 'kernel', 'user-space', 'process', 'endpoint'],
    resources: res('messerSec', 'mde', 'mdeDevice'),
  },

  {
    id: 'comp-files-systems',
    moduleId: 'computers',
    title: 'Files, file systems, servers, virtual machines and cloud',
    summary: 'How data is stored and found, how computers serve each other, and what VMs and the cloud change for security.',
    mode: 'soc', minutes: 40, levels: ['beginner', 'understand', 'recognize'], skills: ['computers'],
    sections: {},
    diagram: {
      title: 'From a file on disk to a service in the cloud',
      steps: [
        { label: 'File', detail: 'Content + metadata: name, path, size, owner, permissions, timestamps.' },
        { label: 'File system', detail: 'NTFS, ext4 or APFS organizes files into folders and records their metadata.' },
        { label: 'Server', detail: 'A computer that provides files or services to clients.' },
        { label: 'Virtual machine', detail: 'Servers usually run as VMs on a hypervisor.' },
        { label: 'Cloud', detail: 'Rented VMs (IaaS), platforms (PaaS) or finished software (SaaS).' },
        { label: 'Evidence', detail: 'File events, connection and logon events, cloud activity logs.' },
      ],
    },
    kql: [
      { title: 'Programs saved into download and temp folders', table: 'DeviceFileEvents', query: 'DeviceFileEvents\n| where Timestamp > ago(7d)\n| where ActionType == "FileCreated"\n| where FileName endswith ".exe" or FileName endswith ".dll" or FileName endswith ".scr"\n| where FolderPath has_any (@"\\Downloads\\", @"\\Temp\\", @"\\AppData\\")\n| project Timestamp, DeviceName, FileName, FolderPath, FileOriginUrl, SHA1', explain: 'Executable files landing in user-writable folders, with where they were downloaded from. Most are legitimate installers — use the origin URL and SHA1 to decide.' },
      { title: 'Possible mass file renaming (ransomware shape)', table: 'DeviceFileEvents', query: 'DeviceFileEvents\n| where Timestamp > ago(1d)\n| where ActionType == "FileRenamed"\n| summarize Renamed = count() by DeviceName, InitiatingProcessFileName, bin(Timestamp, 5m)\n| where Renamed > 500\n| sort by Renamed desc', explain: 'Hundreds of renames by one process in five minutes is unusual. Backup and sync tools can do this too, so check the process before deciding.' },
      { title: 'Who changed virtual machines in Azure?', table: 'AzureActivity', query: 'AzureActivity\n| where TimeGenerated > ago(7d)\n| where OperationNameValue startswith "MICROSOFT.COMPUTE/VIRTUALMACHINES/"\n| project TimeGenerated, OperationNameValue, ActivityStatusValue, Caller, CallerIpAddress, ResourceGroup', explain: 'The Azure activity log records control-plane actions such as creating, starting or deleting VMs. Unexpected VM creation can mean a stolen cloud account (for example, for crypto mining).' },
    ],
    mitre: [
      { id: 'T1036.008', name: 'Masquerading: Masquerade File Type', tactic: 'Stealth', note: 'Disguising a file\'s real type, e.g. a program named like a PDF.' },
      { id: 'T1070.006', name: 'Indicator Removal: Timestomp', tactic: 'Stealth', note: 'Changing file timestamps to hide when a file was really created.' },
      { id: 'T1497', name: 'Virtualization/Sandbox Evasion', tactic: 'Stealth, Discovery', note: 'Malware checking whether it runs in a VM sandbox to avoid analysis.' },
      { id: 'T1078.004', name: 'Valid Accounts: Cloud Accounts', tactic: 'Stealth, Persistence, Privilege Escalation, Initial Access', note: 'Using stolen cloud credentials to access or create cloud resources.' },
    ],
    sc200: { note: 'SC-200 covers Azure activity log collection, Defender for Cloud workload alerts and file evidence in Defender for Endpoint — all built on these concepts.', objectives: ['ingest-azure-activity', 'ir-mdc', 'ir-mde-evidence', 'hunt-table'] },
    lab: {
      title: 'Read a file\'s metadata and your own connections',
      environment: 'Your own Windows PC (read-only, safe)',
      steps: [
        'In File Explorer, choose View → Show → File name extensions. Look at your Downloads folder — are any extensions surprising?',
        'Right-click a downloaded file → Properties. Note the Created, Modified and Accessed dates. On the Security tab, note which accounts have permissions.',
        'Open a command prompt and run `certutil -hashfile <file> SHA1` on one file to see its fingerprint.',
        'Think of three services your computer uses as a client today (e.g. email, a website, a shared folder) and name the server side of each.',
      ],
      reflect: ['Why does Windows hiding extensions help attackers?', 'Which of your three services run in the cloud, and who is responsible for your account\'s security there?'],
    },
    quiz: [
      { id: 'q-fs-1', prompt: 'A file is shown as "invoice.pdf" but its full name is "invoice.pdf.exe". What is it really?', options: ['A PDF document', 'A program (executable)', 'A folder', 'A shortcut to a PDF'], answer: [1], explanation: 'The last extension decides the type. The extra ".pdf" is a disguise (masquerading), especially when Windows hides known extensions.', concept: 'File extensions', skill: 'computers', kind: 'scenario' },
      { id: 'q-fs-2', prompt: 'In the client/server model, which is the server?', options: ['The laptop asking for a web page', 'The computer providing the web page', 'The network cable', 'The user'], answer: [1], explanation: 'Clients request; servers provide. The same computer can be a client for one service and a server for another.', concept: 'Client/server', skill: 'computers', kind: 'knowledge' },
      { id: 'q-fs-3', prompt: 'What does a hypervisor do?', options: ['Encrypts email', 'Runs and shares one physical machine between several virtual machines', 'Checks passwords', 'Stores DNS records'], answer: [1], explanation: 'The hypervisor divides the physical CPU, memory and storage between VMs, each with its own operating system.', concept: 'Virtual machines', skill: 'computers', kind: 'knowledge' },
      { id: 'q-fs-4', prompt: 'In every cloud model (IaaS, PaaS, SaaS), what remains the customer\'s responsibility?', options: ['The physical data center', 'Accounts, access and data', 'Patching the provider\'s servers', 'Nothing'], answer: [1], explanation: 'Identities, access and data always stay with the customer — which is why cloud security relies so much on identity monitoring.', concept: 'Shared responsibility', skill: 'computers', kind: 'knowledge' },
      { id: 'q-fs-5', prompt: 'Which Sentinel table records someone creating or deleting a virtual machine in Azure?', options: ['SigninLogs', 'AzureActivity', 'DeviceFileEvents', 'Syslog'], answer: [1], explanation: 'Control-plane actions on Azure resources are in the Azure activity log, collected into the AzureActivity table.', concept: 'Azure activity log', skill: 'sentinel', kind: 'knowledge', objectives: ['ingest-azure-activity'] },
    ],
    interview: ['iv-cloud-shared-responsibility'],
    mistakes: ['Trusting a file\'s name or icon instead of its real type and hash.', 'Forgetting that servers hold shared data — a single compromised server affects many users.', 'Assuming the cloud provider is responsible for your accounts.', 'Not converting file timestamps to UTC when comparing with logs.'],
    tip: 'For any file in an alert, write down five facts: path, origin, timestamp (UTC), hash, and whether it ran. Those five facts drive almost every next step.',
    think: { prompt: 'Azure activity logs show 20 large VMs created at 02:00 in a region your company never uses, by an account that signed in from a new country. What is going on, and what do you do?', answer: 'Likely a compromised cloud account used to create expensive VMs — often for crypto mining. Disable or contain the account (revoke sessions, reset credentials), stop and investigate the VMs (snapshot them for evidence before deleting), check what else the account changed, and review how it was compromised.' },
    takeaways: ['A file = content + metadata (path, permissions, timestamps).', 'Extensions can lie; hashes identify real content.', 'Servers provide shared services and are high-value targets.', 'VMs run on hypervisors; snapshots and sandboxes help defenders.', 'IaaS/PaaS/SaaS — but accounts, access and data are always yours.'],
    connect: ['file-system', 'sha256', 'client-server', 'virtual-machine', 'cloud-computing', 'devicefileevents', 'sentinel'],
    resources: res('mde', 'sentinelConnectors', 'messerNet'),
  },
]
