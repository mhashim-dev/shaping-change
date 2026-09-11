# Importing the project plan into Microsoft Planner

**The honest starting point:** Microsoft Planner has **no "upload a file / import CSV"
button.** There's no one‑click import. But there are three reliable ways to get this
plan in, from fastest‑manual to fully‑automated. Pick one.

Helper files (generated alongside this guide):

- **`planner-tasks-by-bucket.txt`** — clean task names grouped by bucket (for Method A).
- **`planner-import.csv`** — every task with Priority, **Duration (days)**, Owner,
  Checklist, Dependency and Reference columns (for Method B). Opens in Excel. Use the
  Duration column to set each task's dates in the Timeline view (start the build on the
  content‑handover date and chain from there).
- **`PROJECT_PLAN_PLANNER.md`** — the full detail (checklists, owners, dependencies).

---

## Method A — Bucket‑by‑bucket paste  ★ fastest, no tools

Planner lets you **create many tasks at once by pasting a multi‑line list** into a
bucket. This is the quickest way in.

1. In your plan, create the **7 buckets** (columns), in this order:
   *Initiation & Sign‑off · Content Intake & Build · Security & Integration · QA ·
   Stakeholder Review & Sign‑off · Launch & Handover · Analytics & Privacy (final stage).*
2. Open **`planner-tasks-by-bucket.txt`**. For the first bucket, **copy the task names
   under it** (just the lines, not the `=== Bucket: … ===` header).
3. In Planner, in that bucket click **"+ Add task"**, **paste**, and press **Enter**.
   Planner detects the line breaks and asks *"Add N tasks?"* — confirm. All the tasks
   for that bucket are created at once.
4. Repeat for each of the 9 buckets.
5. **Enrich each task** (this part is manual in Planner): open the task and add its
   **Checklist**, **Assigned to**, **Priority**, **Start/Due dates** and **Label** using
   the detail in `PROJECT_PLAN_PLANNER.md` / `planner-import.csv`.

> Works in both classic Planner and the new Planner. It creates the task **names**;
> checklists/assignments/dates are added per task afterwards.

---

## Method B — Power Automate from the CSV  ★ most complete (sets fields & checklists)

If you want the tasks created **with** their priority, checklist and notes already
filled, use a **Power Automate** flow that reads `planner-import.csv` and creates the
tasks. This needs a little comfort with Power Automate, but it's the closest thing to a
true import.

**Prep**
1. Create the **9 buckets** in the plan first (the flow puts tasks into existing
   buckets).
2. Put `planner-import.csv` in **OneDrive/SharePoint** and **save it as an Excel file**
   with the data formatted as a **Table** (Power Automate's Excel actions need a Table).

**Build the flow** (Power Automate → Create → Instant cloud flow):
3. **Excel → "List rows present in a table"** → point at your table.
4. **Planner → "List buckets"** (for your Plan) → use this to map each row's **Bucket**
   name to its **Bucket Id** (a Filter array or a Switch on the bucket name).
5. **Apply to each** row →
   - **Planner → "Create a task"**: set **Plan Id**, **Title** = `Task`, **Bucket Id**
     (from step 4), **Priority** (map *High→Important/Urgent, Medium→Medium, Low→Low*),
     and **Due date** if you've added one.
   - **Planner → "Update task details"**: set **Description** = `Reference`, and add the
     **Checklist** by splitting the `Checklist` cell on `" | "` and adding each item.
6. **Run** the flow once. The 21 tasks appear in the right buckets with priority,
   checklist and notes.

> Tips: map *Owner (label)* to a **Planner label/category** or to an assignee if you
> have the person's account. **Dependencies** can't be set by the Planner connector —
> add them in the Timeline view afterwards (Premium).

---

## Method C — Grid view paste (Planner Premium / Project for the web)

If you're on **Planner Premium**, the **Grid** view behaves like a spreadsheet:

1. Open the plan in **Grid** view.
2. **Paste task names** into the Name column (one per line) — or type them — to create
   rows quickly.
3. Set the **Bucket** column on each row, then fill **Priority**, **Assigned To** and
   **Dates** in the grid.
4. Add **Checklists** in each task's detail pane, and **Dependencies** in the
   **Timeline** view.

> The Grid is faster than the Board for bulk entry, but Planner still doesn't ingest the
> CSV directly — you're pasting names and filling columns.

---

## What can't be "imported" (add these after)

| Item | How to add |
|---|---|
| **Checklists** | Per task (Method A/C) or automatically via Method B's "Update task details" |
| **Dependencies** | In the **Timeline/Schedule** view (Premium) — link finish‑to‑start along the critical path in `PROJECT_PLAN_PLANNER.md` |
| **Assignments** | Per task; map the *Owner (label)* column to real people |
| **Goals** | Create the 4 goals (Premium → Goals) and relate tasks to them |
| **Labels** | Create the colour labels once, then tag tasks |

---

## Recommendation

- **Just want it in quickly?** → **Method A** (paste per bucket), then enrich the few
  critical‑path tasks first.
- **Want fields/checklists populated and you'll reuse the plan?** → **Method B** (Power
  Automate from the CSV).
- **On Premium and comfortable with the grid?** → **Method C**.

All three end up in the same place; they differ only in how much you fill in by hand
versus up front. The detail to fill from is in `PROJECT_PLAN_PLANNER.md`.
