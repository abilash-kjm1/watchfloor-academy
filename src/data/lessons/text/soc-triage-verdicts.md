## bridge

You now know what alerts, incidents and indicators are. This lesson teaches the first thing an analyst does with every alert: **triage** — deciding quickly and defensibly whether it is real and how urgent it is.

**Chain:** Alert → read & identify entities → context & baseline → corroborate → verdict → act & document

## what

**[[triage|Triage]]** is the quick first look at an alert. It answers three questions:

1. **Is this real?**
2. **How urgent is it?**
3. **What happens next?**

The result of triage is a **verdict**. There are four possible verdicts:

### True positive (TP)
The rule fired, and the activity **really is malicious**.
- Example: a sign-in alert that turns out to be a stolen password being used.

### Benign true positive (BTP)
The rule fired **correctly** — the pattern really happened — but the activity is **authorized**.
- Example: an approved security test or a scheduled IT script.

### False positive (FP)
The rule fired, but it was **wrong**. Nothing matching its intent happened.
- Example: a "malware" alert on a harmless file because of a flawed rule.

### Needs investigation
There isn't enough evidence yet to decide. Escalate it.

> The difference between a **false positive** and a **benign true positive** matters: a false positive means *fix the rule*; a benign true positive means *the rule worked — document the approved activity*.

## why

SOCs receive more alerts than they can investigate deeply.

Triage exists to spend analyst time **where the risk is highest**.

Mistakes in triage are costly in both directions:

- A wrong **"false positive"** hides a real attack.
- A wrong **"true positive"** wastes hours and disrupts users.

## name

- **Triage** — from the French *trier*, "to sort". It was first used for sorting wounded soldiers by urgency.
- **Positive** — the rule said *"yes, I found something"*.
- **True / false** — whether the rule was *right*.

## problem

Without a structured triage method, analysts tend to fall into one of two traps:

- **Investigate everything deeply** → the queue explodes.
- **Close things on gut feeling** → attacks slip through.

Triage gives a decision that is **consistent**, **fast** and **written down**.

## how

### A practical triage routine

Aim for minutes, not hours.

1. **Read the alert**
  - What was this rule designed to catch?
2. **Identify the entities**
  - Which user, device, IP address, file or mailbox is involved?
3. **Check the context**
  - Is the user an administrator?
  - Is the device a server or a laptop?
  - Is this activity **normal for this user** (their *baseline*)?
4. **Look for corroboration**
  - Are there other alerts on the same entities?
  - What happened just before and after?
5. **Decide the verdict**
  - True positive, benign true positive, false positive, or needs investigation.
6. **Act and document**
  - Escalate, contain, or close — and **always write down why**.

### Severity vs priority

These two words sound similar but mean different things.

**[[severity|Severity]]** — how serious the activity is *in general*.
- Set by the rule.
- Example: ransomware behavior is always high severity.

**[[priority|Priority]]** — how urgently *you* should act, given business context.
- Set by the analyst.
- Example: the same medium-severity alert is higher priority on a **domain controller** or the **CEO's laptop** than on a test machine.

## analogy

A smoke detector goes off.

- **True positive** — there is a fire.
- **Benign true positive** — someone is making toast in a room where smoke is allowed.
- **False positive** — steam from a shower set it off.

Triage is **checking the room** before calling the fire brigade — and noting which rooms set it off falsely, so the detector can be moved (*tuning*).

## realWorld

An alert called *"Suspicious PowerShell command line"* fires on **40 devices** at 04:00.

The analyst checks:

1. **Parent process** — it's the company's software deployment agent.
2. **Script location** — the usual, managed folder.
3. **IT team** — confirms a scheduled inventory job.

**Verdict:** benign true positive.

**Recommendation:** a tuning exclusion limited to *that parent process and that script path* — **not** to all PowerShell.

## securityExample

An alert called *"Sign-in from unfamiliar location"* fires for a finance employee.

What triage finds:

- A **country** they have never signed in from.
- Only **30 minutes** after a sign-in from their home city.
- From a device that is **not company-managed**.
- The session **opened their mailbox**.
- **No travel** is recorded.

Several independent signals point the same way.

**Verdict:** likely true positive.

**Next steps:** escalate, revoke the user's sessions, reset their credentials.

## normal

Usually explainable:

- Administrators running scripts during business hours from managed devices.
- Users signing in from their usual locations and devices.
- Approved security scanners producing scan-like traffic from known IPs.

## suspicious

### Normal → suspicious → malicious

| | Example |
|---|---|
| **Normal** | A sign-in from a new country while the user is on a recorded business trip |
| **Suspicious** | A sign-in from a new country with no travel record |
| **Confirmed malicious** | That sign-in used an unmanaged device, then created a mailbox rule forwarding all email outside the company, and the user confirms they didn't do it |


Raise your attention when you see:

- Activity that is rare **for this specific user or device** — not just rare in general.
- **Several weak signals** on the same entity within a short time.
- Activity at **unusual hours** with **no business reason**.
- Alerts on **high-value assets** — domain controllers, executives, finance systems.

## abuse

Defensive view: attackers deliberately copy activity that analysts usually close as harmless.

- Using **built-in admin tools**.
- Signing in through **common cloud services**.
- Acting during **busy hours**.

> "It looks like admin activity" must be **verified** — ask the admin, check change records. Never just assume.

## evidence

Triage relies on:

- The alert's **evidence list**.
- The **user** and **device** pages.
- **Recent sign-ins** for the user.
- **Process trees** on the device.
- **Previous incidents** involving the same entity.

## where

**Microsoft Defender portal**
- Incident and alert pages
- User and device pages
- Advanced Hunting

**Microsoft Sentinel**
- Incident entities
- Investigation graph
- The underlying KQL results

## analyst

Write a short verdict note **every time**. Use these five lines:

1. **What fired, and why** it was designed to fire.
2. **What you checked.**
3. **What you found.**
4. **Verdict and reasoning.**
5. **Next action** — escalate, tune or close.

> This makes your work auditable, and it tells detection engineers which rules need tuning.

## microsoft

**Classifying incidents**
- When closing a Defender XDR or Sentinel incident, you choose a classification: *true positive*, *informational / expected activity*, or *false positive*.
- These classifications feed reporting and tuning.

**Reducing noise**
- **Sentinel automation rules** can suppress or auto-close known harmless patterns.
- **Defender XDR alert tuning** (suppression) rules can hide or resolve alerts that match specific conditions.

## explainBack

Q: Explain the difference between a false positive and a benign true positive using a smoke alarm.
A: A false positive is steam from the shower setting off the alarm — the alarm got it wrong. A benign true positive is someone making toast in a room where cooking is allowed — there really was smoke, but it was expected and harmless.

Q: Why should a tuning exclusion be as narrow as possible?
A: A broad exclusion, like ignoring all PowerShell, would also hide real attacks that use PowerShell. Excluding only the specific approved script and parent program removes the noise without creating a blind spot.

Q: What's the difference between severity and priority?
A: Severity is how bad the activity is in general and is set by the rule. Priority is how urgently you should act given the situation — the same alert matters more on a domain controller than on a test machine.
