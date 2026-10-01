## bridge

In **SIEM fundamentals** you learned that all the logs end up in one place, stored as **tables**. To ask questions of those tables you need a query language. In the Microsoft security world that language is **KQL**.

**Chain:** Logs → tables (rows and columns) → *KQL query* → results → investigation

## what

**[[kql|KQL]]** (Kusto Query Language) is a language for **asking questions of large amounts of data**.

It works like this:

1. You **start with a table** of data.
2. You pass it through **operators**, one after another.
3. Each operator **changes the data** a little — filters it, shapes it, counts it.
4. Operators are joined with the **pipe** symbol: `|`

> KQL is **read-only**. It never changes or deletes your data — it only reads it.

## why

Security data is:

- **Enormous** — billions of records.
- **Append-only** — new records are added; old ones aren't edited.
- **Time-based** — almost every question includes "when".

SQL (Structured Query Language, the most common database language) was designed for databases where rows are constantly updated (like a shop's stock list).

Microsoft built **Kusto** (the engine behind Azure Data Explorer) for fast searching and counting over huge log data — and **KQL** as an easy language for it that reads like a flow:

> *start here → filter → shape → summarize*

## name

- **Kusto** — reportedly a nod to ocean explorer Jacques Cousteau: exploring an ocean of data.
- **Query Language** — it asks questions (queries) of data.

## problem

Without a query language, analysts would have to:

- **Scroll** through logs by hand, or
- Rely only on **pre-built dashboards**.

KQL lets you ask **any** question. For example:

> *"Which accounts failed to sign in from more than 10 different IP addresses today?"*

## how

### Tables, columns and rows

A **table** is like a spreadsheet:

- **Columns** are the fields (e.g. `TimeGenerated`, `UserPrincipalName`, `IPAddress`).
- **Rows** are the individual records (one row = one sign-in).

### Data types

Each column holds one type of data:

| Type | What it holds | Example |
|---|---|---|
| `string` | Text | `"alex@contoso.com"` |
| `int` / `long` / `real` | Numbers | `4624`, `3.5` |
| `bool` | True or false | `true` |
| `datetime` | A moment in time | `datetime(2026-09-28 14:00)` |
| `timespan` | A length of time | `1h`, `7d`, `30m` |
| `dynamic` | JSON objects or lists | `DeviceDetail.operatingSystem` |

### Reading a query, line by line

```kql
SigninLogs                                   // 1. start with the sign-in table
| where TimeGenerated > ago(1d)              // 2. keep only the last day
| where ResultType != "0"                    // 3. keep only failures
| summarize Failures = count() by UserPrincipalName   // 4. count failures per user
| sort by Failures desc                      // 5. biggest first
| take 10                                    // 6. show 10 rows
```

Each line receives the result of the line above it.

> **Filter by time first.** It makes queries faster and cheaper.

## analogy

KQL is an **assembly line**:

- Raw material (the **table**) enters at the start.
- Each station (**operator**) does one job:
  - remove defects → `where`
  - cut to shape → `project`
  - count and bundle → `summarize`
  - line up for shipping → `sort`

## realWorld

The same language is used across Microsoft's security tools:

- **Microsoft Sentinel** — analytics rules, workbooks, hunting queries.
- **Defender XDR Advanced Hunting** — hunting and custom detection rules.
- **Azure Monitor / Log Analytics** — operational monitoring.
- **Azure Data Explorer** — large-scale data analysis.

> Learn KQL once, use it everywhere in the Microsoft stack.

## securityExample

A Tier 1 analyst gets an alert: *"Multiple failed sign-ins."*

Instead of opening each event one by one, they run one query that counts failures **by user and IP** for the last hour.

In seconds they can see which situation it is:

- **One user mistyping** their password, or
- **One IP trying many users** (an attack pattern).

## normal

Well-written security queries usually:

- **Start with a time filter.**
- Filter on **specific** columns (user, device, IP).
- Use `has` to match whole words.
- **Project** only the columns they need.

## suspicious

Here "suspicious" means **query mistakes** to avoid:

- **No time filter** — scans everything; slow and costly.
- **`contains`** on huge tables where **`has`** would work.
- Using **`take`** as if it returned the *latest* rows (it doesn't).
- **Joins** without filtering both sides first.

## abuse

Not an attacker topic — but analysts can **mislead themselves**.

A query that returns **nothing** might simply be **wrong**:

- `==` is **case-sensitive** — `"Alex"` does not equal `"alex"`.
- Wrong **table**.
- Wrong **time zone** or time range.

> Before trusting an empty result, test your query on an example you **know** should match.

## evidence

Your queries are part of the evidence.

- **Paste the exact query** into your ticket so others can reproduce your findings.

## where

You can run KQL in:

- **Microsoft Sentinel** → Logs
- **Defender XDR** → Advanced Hunting
- **Azure Data Explorer** — including Microsoft's **free public help cluster** with sample data
- **Log Analytics**

## analyst

A pattern that works for almost every investigation query:

1. **Time window** — `where TimeGenerated > ago(1d)`
2. **Entity filter** — the user, device or IP you care about
3. **Shape** — `project` the useful columns
4. **Aggregate** — `summarize` to see patterns
5. **Sort** — most important first

Then **pivot**: take a value from your result (an IP, a device name) and use it in your next query.

## microsoft

Two details that catch beginners:

### The time column has different names
- **Defender XDR** tables use `Timestamp`.
- **Sentinel / Log Analytics** tables use `TimeGenerated`.
- Defender tables streamed into Sentinel have **both**.

### Names are case-sensitive
- `SigninLogs` works. `signinlogs` does not.
- The same applies to column names.

## explainBack

Q: Explain what a KQL query does, without using the word "query".
A: It's a short set of instructions that starts with a table of records and passes it through steps — keep only some rows, pick some columns, count things — until you're left with the answer to your question.

Q: Why does "take 10" not give you the 10 newest rows?
A: take returns any 10 rows, in no particular order. To get the newest you must sort by time first, or use top 10 by time.

Q: Your query for "Alex.Morgan@contoso.com" returns nothing, but Alex signed in. What's the likely cause?
A: == is case-sensitive and the stored name is probably lowercase. Use =~ for a case-insensitive match.
