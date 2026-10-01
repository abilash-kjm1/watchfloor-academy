## bridge

This is the very first lesson. You don't need any security knowledge to start — only basic computer use.

By the end of it you will know **what defenders do**, the **words** every later lesson uses, and **how each lesson is organized** so you never feel lost.

## what

### Cybersecurity, in one sentence
**Cybersecurity** is protecting computers, accounts and data from people who want to misuse them.

### Two halves of the job
- **Prevention** — making attacks harder (strong passwords, software updates, blocking dangerous websites).
- **Detection and response** — *noticing* when an attack gets through, and *stopping* it.

This course focuses on the second half. The people who do it are called **security analysts**, and they usually work in a team called a **Security Operations Center (SOC)**.

### What a SOC analyst actually does
A SOC analyst spends their day:

1. Reading **alerts** — automatic warnings that something might be wrong.
2. Deciding which alerts are **real**.
3. **Investigating** the real ones by looking at evidence.
4. Helping **stop** attacks and **fix** the damage.

> Think of a SOC analyst as a detective who works mostly with **records of what happened on computers**.

## why

Every organization will eventually be targeted. Prevention reduces the risk, but **no prevention is perfect**.

So organizations also need people who can:

- **Notice** an attack quickly.
- **Understand** what happened.
- **Act** before serious damage is done.

That is why SOC analysts exist — and why this course teaches you to **think like one**.

## name

- **Cyber** — from "cybernetics", the study of control systems; today it simply means "to do with computers and networks".
- **Security Operations Center (SOC)** — "operations center" means a team that watches something in real time and reacts. A SOC watches for security problems.

## problem

Beginners usually struggle with two problems. This lesson fixes both.

### Problem 1: too many new words
Security uses a lot of jargon and acronyms. In this course, **every term is explained the first time it appears**, and you can hover over underlined terms to see a definition.

### Problem 2: not knowing *why* something matters
Every lesson answers: **"Why would a SOC analyst care about this?"**

## analogy

Think of an office building:

- The **building** is the organization's computers.
- The **doors and locks** are prevention.
- The **security cameras** create records of what happened.
- The **security guard watching the camera screens** is the SOC analyst.
- When the guard sees someone trying every door, they **investigate** and **respond**.

Most of this course is about understanding the "camera footage" — the records computers create.

## how

### Three words people mix up: threat, vulnerability, risk

These three words appear everywhere. Learn the difference now.

**Threat — *who or what* could cause harm**
- A person or thing that could damage you.
- Example: a criminal group that sends fake emails to steal passwords.

**Vulnerability — a *weakness* that could be used**
- A gap in your defenses.
- Example: an employee account protected only by a weak password.

**Risk — the *chance and impact* of harm**
- How likely it is that a threat uses a vulnerability, and how bad that would be.
- Example: *"Because many staff have weak passwords and phishing is common, there is a high risk of a stolen account."*

| Word | Question it answers | Example |
|---|---|---|
| Threat | Who or what could hurt us? | A phishing gang |
| Vulnerability | What weakness could they use? | Weak passwords |
| Risk | How likely, and how bad? | High chance of a stolen account |

> You reduce **risk** by fixing **vulnerabilities** or by detecting **threats** quickly.

### The basic words used in every lesson

**Computer / device / endpoint**
- Any laptop, desktop, server or phone. Security teams call them **endpoints** because they are the "end points" of the network where people work.

**Server**
- A computer that provides a service to other computers, such as storing shared files or running a website.

**Network**
- Computers connected so they can send data to each other. The internet is the biggest network.

**Account**
- A username that identifies a person (or a program) on a system, usually protected by a password.

**Log**
- A written record of something that happened on a computer. Example: *"09:14 — user alex signed in."*

**Alert**
- An automatic warning created when a security rule spots something suspicious in the logs.

**Evidence**
- Any record that helps prove what happened: logs, files, network records.

### How every lesson is organized

Each lesson goes from simple to advanced in **levels**:

1. **Level 1 — the simple idea** (what and why)
2. **Level 2 — how it works**
3. **Level 3 — the security view** (normal vs suspicious)
4. **Level 4 — the SOC view** (evidence and investigation)
5. **Level 5 — Microsoft tools**
6. **Level 6 — querying the evidence** (KQL — Kusto Query Language, the language used to search security records)
7. **Level 7 — detection frameworks** (MITRE ATT&CK, the SC-200 exam)
8. **Level 8 — practice** (lab, quiz, explain-it-back)

> Early lessons show **Preview** notes on Levels 5–7. It's fine to skim those parts — they make full sense once you reach the later lessons.

## realWorld

A typical morning for a junior SOC analyst:

1. **08:00** — Open the alert queue. There are 14 new alerts.
2. **08:05** — Alert: *"Sign-in from an unusual country."* Check the user's normal sign-in places.
3. **08:15** — It turns out the user is travelling for work. Close the alert with a note.
4. **08:20** — Alert: *"Suspicious program on a laptop."* This one needs a deeper look, so escalate it to a senior analyst with notes.

Notice the pattern: **read → check evidence → decide → write it down.**

## securityExample

A company receives an alert: *"Many failed sign-ins on one account."*

- **Threat:** someone trying to guess the password.
- **Vulnerability:** the account has no multi-factor authentication (a second login step, like a phone approval).
- **Risk:** if the guess succeeds, the attacker can read that person's email.
- **Evidence:** the sign-in logs show 300 failed attempts from one internet address.
- **Response:** block that address, add multi-factor authentication, and check that no attempt succeeded.

## normal

- Most alerts turn out to have an **innocent explanation** (travel, IT maintenance, a typo in a password).
- Analysts close many alerts every day — with **a written reason**.

## suspicious

- Activity that doesn't fit the **person**, the **time**, or the **place**.
- **Several small warning signs** on the same account or computer.

> "Unusual" is not the same as "malicious". Analysts check the evidence before deciding.

## abuse

Defensive view: attackers succeed most often through simple paths:

- **Tricking people** (fake emails asking for passwords).
- **Using weak or reused passwords.**
- **Exploiting software that hasn't been updated.**

This is why this course starts with how computers, networks and accounts work — attacks use the same building blocks as normal work.

## evidence

Almost everything you will investigate is a **record** of something:

- A **sign-in** record
- A **program starting** on a computer
- A **network connection**
- An **email** being delivered

The next lessons explain each of these, one at a time.

## where

You will meet evidence in three kinds of places:

- **On the computer itself** (for example, Windows Event Viewer).
- **In security tools** that collect records from many computers.
- **In Microsoft's security tools** — Microsoft Sentinel and Microsoft Defender — which this course covers later.

## analyst

The SOC analyst's basic loop, which every lesson builds on:

1. **Read** the alert.
2. **Find** the evidence.
3. **Decide** whether it's real.
4. **Act** — escalate, stop the attack, or close with a reason.
5. **Write it down.**

## microsoft

This course prepares you for Microsoft's **SC-200** certification (Microsoft Security Operations Analyst). You'll learn two main Microsoft tools later:

- **Microsoft Defender** — watches computers, email and accounts, and raises alerts.
- **Microsoft Sentinel** — collects records from everywhere so analysts can search them in one place.

Don't worry about them yet — they come after the foundations.

## explainBack

Q: In your own words, what does a SOC analyst do all day?
A: They look at automatic warnings about possible attacks, check the records (evidence) to see whether each warning is real, investigate the real ones, help stop the attack, and write down what they found and decided.

Q: Explain the difference between a threat, a vulnerability and a risk using a house as the example.
A: The threat is the burglar. The vulnerability is the unlocked back door. The risk is how likely the burglar is to find that door and how much they could steal if they did.

Q: Why isn't "unusual" the same as "malicious"?
A: Lots of normal things look unusual — someone travelling, IT doing maintenance, a person mistyping a password. An analyst checks the evidence and the context before deciding something is an attack.
