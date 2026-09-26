# Jarvis Command Language & Keyboard Navigation Specification

The Jarvis Task Matrix features a universal Command Palette (`Cmd+K` / `Ctrl+K`) and natural language parser designed for high-velocity mouse-free operation.

---

## 1. Global Activation Shortcuts

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `Cmd + K` or `Ctrl + K` | Universal | Opens/closes the Global Command Palette. |
| `/` | Global (when not typing in an input) | Opens the Command Palette instantly. |
| `f` or `z` | Global (when not typing in an input) | Opens **Command Spotlight / Deep Work Focus Mode**. |
| `↑` / `↓` | Palette open | Navigates matching search results or commands. |
| `Enter ↵` | Palette open | Executes the parsed command or selects the highlighted task. |
| `Esc` | Any modal open | Closes the modal. |

---

## 2. Natural Language Ingestion Syntax

You can ingest new tasks into the matrix without opening the full form by typing natural shorthand directly into the Command Palette:

### A. Dedicated Quadrant Prefixes

* **`q1 [title]`**  
  Ingests an urgent & important crisis item (Importance: 5, Urgency: 5).  
  *Example:* `q1 Fix production database connection pool`

* **`q2 [title]`**  
  Ingests a strategic life/work milestone (Importance: 5, Urgency: 2).  
  *Example:* `q2 Write 5-year personal manifesto`

* **`q3 [title]`**  
  Ingests an urgent operational interruption (Importance: 2, Urgency: 5).  
  *Example:* `q3 Reply to urgent logistics supplier email`

* **`q4 [title]`**  
  Ingests a low-priority incidental item (Importance: 1, Urgency: 1).  
  *Example:* `q4 Browse ergonomic keyboard reviews`

* **`qw [title]`** or **`quickwin [title]`**  
  Ingests an Action Priority Quick Win (Impact: 5, Effort: 1).  
  *Example:* `qw Enable gzip compression on CDN`

* **`mp [title]`** or **`majorproject [title]`**  
  Ingests an Action Priority Major Project (Impact: 5, Effort: 5).  
  *Example:* `mp Rewrite payment microservice`

* **`fi [title]`** or **`fillin [title]`**  
  Ingests an Action Priority Fill-In item (Impact: 2, Effort: 2).  
  *Example:* `fi Update API documentation typos`

* **`ts [title]`** or **`timesink [title]`**  
  Ingests an Action Priority Time Sink item (Impact: 1, Effort: 5).  
  *Example:* `ts Research customized keycap sets`

---

### B. Inline Parameter Flags

You can append parameters anywhere inside an `add ...` directive or natural task entry:

| Parameter Pattern | Function | Example |
| :--- | :--- | :--- |
| `impact [1-5]` or `impct [1-5]` | Sets discrete Impact rating (1 to 5) | `add Design landing page impact 5` |
| `effort [1-5]` or `eff [1-5]` | Sets discrete Effort rating (1 to 5) | `add Refactor auth store effort 2` |
| `imp [1-5]` or `importance [1-5]` | Sets discrete Importance rating (1 to 5) | `add Audit SSL certs imp 4` |
| `urg [1-5]` or `urgency [1-5]` | Sets discrete Urgency rating (1 to 5) | `add Review tax return urg 5` |
| `bucket: [name]` or `bin: [name]` | Assigns to a Mega Task Bin (auto-creates if non-existent instead of cancelling!) | `add Ship v2 bucket: "Core Engine 2.0"` |
| `due tomorrow` | Automatically sets deadline to +24 hours | `q1 Submit report due tomorrow` |
| `due today` | Automatically sets deadline to current day end | `add Pay server invoice due today` |

#### Full Synthesis Example:
```text
add Deploy zero-downtime database migration due tomorrow imp 5 urg 4 impact 5 effort 2 bucket: "Infrastructure & DevOps"
```

---

## 3. View & Mission Bin Commands

Type `/` followed by the command name in the palette to change perspectives or filter/create mission bins:

| Command | Action |
| :--- | :--- |
| `/bucket [name]` (or `/bin [name]`) | Filters by mission bin (instantly creates the bin if it doesn't already exist!) |
| `/strategic` (or `/strat`) | Switches to **Strategic Priority** (High Importance First). |
| `/matrix` (or `/eisenhower`) | Switches to **Eisenhower 2x2 Matrix** (Urgency vs. Importance). |
| `/impact` (or `/effort`) | Switches to **Impact-Effort 2x2 Matrix** (Action Priority). |
| `/deadline` (or `/urgent`) | Switches to **Deadline Acceleration Mode** (Imminent Deadlines First). |
| `/focus` (or `/spotlight`, `/pomo`) | Launches **Command Spotlight & Focus Chronometer**. |
| `/new` | Opens the full multi-parameter task creation modal. |
| `/help` (or `?`) | Expands the inline syntax reference cheatsheet. |

---

## 4. Search & Rapid Execution

Typing any search term (without prefixes) runs a real-time fuzzy filter across your existing tasks:
- Displays matching active tasks with importance and urgency scores.
- Pressing `Enter` opens the task for fine-calibration.
- Clicking the inline **"Focus"** button engages the deep work chronometer for that specific task.
