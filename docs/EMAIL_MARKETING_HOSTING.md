# Email draft — to the Marketing team (hosting the game on the website)

_Draft to send to the Marketing team (who manage the AMES Drupal site, built with a
third‑party company), letting them know the interactive is being built and will be
hosted on ames.net.au. Replace the **[bracketed placeholders]** before sending._

---

**To:** [Marketing team / Name]
**Subject:** New interactive for the AMES website — *Power, Pressure & Choice* (planning the hosting)

Hi [Name / Marketing team],

I'm running a small internal project to build an interactive web experience called
**Power, Pressure & Choice** — a short, reflective activity that supports our
violence‑prevention work, developed with input from the **Education** and **PVAW**
teams. It's currently in build, and the plan is to make it available to the public on
our website, **ames.net.au**.

Since your team manages the Drupal site (built with [third‑party Drupal company]), I
wanted to reach out early to plan how we add it and make sure we follow your process and
involve the right people.

A few things that should make this straightforward on your side:

- It's a **self‑contained, lightweight** piece — static files, **no back‑end, no
  database, no logins**.
- It's designed to sit on a page via a **simple embed (an iframe)**, so it won't touch
  the Drupal theme or the rest of the site, and it can be updated independently.
- I've prepared **step‑by‑step integration notes** (hosting + embedding + analytics) and
  a **security / risk assessment** that we can share with you and your Drupal vendor.
- It will go through our **IT security sign‑off** and an **accessibility (WCAG) check**
  before launch.

**Measuring usage (Google Analytics).** We'd like to track basic, anonymous usage with
**Google Analytics 4** — how many people start and finish, and which paths they take — to
show reach and keep improving the activity. It's **privacy‑first**: no logins, no personal
information, and none of the free text a player might type is ever sent — only fixed,
non‑identifying events.

One thing I'd value your steer on: **can this be set up in‑house, or do we need the Drupal
vendor?** Because the activity is a **self‑contained embed**, we can add the GA4 tag
**inside the activity itself**, so the measurement can most likely be done **in‑house,
without changes to the Drupal build**. The parts that may touch your side are:

- **Which GA4 property to use** — ideally the existing **ames.net.au** property (if you can
  share the Measurement ID), or a new one set up for the activity;
- **Cookie‑consent and the privacy policy** — making sure the site's consent banner and
  policy also cover the activity's analytics;
- **Content‑Security‑Policy (CSP)** — if the site sends a CSP, allowing the Google Analytics
  domains (`googletagmanager.com`, `google‑analytics.com`).

The last two are the ones that **might** need your Drupal vendor — could you let me know
whether **cookie‑consent and the CSP are managed in‑house or by them**? We're planning
analytics as a **final step just after go‑live**, so it won't hold up the launch.

What would help from your side:

- Who's the best contact on your team (and at [third‑party Drupal company]) to plan the
  embed?
- A short call to agree the approach — e.g. a dedicated page or a small subdomain — and
  your process and lead time for adding it.
- Any requirements we should design around (security headers / CSP, cookie‑consent, and
  where it should live on the site).
- For **analytics**: the **GA4 Measurement ID** to use (or agreement to a new property),
  and whether **cookie‑consent / CSP for it** are handled in‑house or by your Drupal vendor.

I'm happy to give you a quick **demo** (I have a clickable version) and send the
documentation whenever suits. There's no fixed launch date yet — I'd like to plan it
around your team's availability.

Thanks,
[Your name]
[Role / team] · [contact]

---

## Before you send

- **Fill the placeholders:** recipient name, the Drupal vendor's name, your name / role /
  contact.
- The violence‑prevention framing and the **Edu/PVAW** mention are intentional — they
  give Marketing the context and signal the care around the topic.
- Security/accessibility are phrased as *"will go through"* (not "done"), which is
  accurate at this stage.
- The *"iframe / static / no back‑end"* line pre‑empts the first technical questions from
  Marketing and their Drupal vendor, and signals it's low‑risk, low‑effort.
- The **Google Analytics** section raises the key question up front — whether GA (and its
  cookie‑consent / CSP) is **in‑house or needs the vendor** — so you're not blocked late.
  In practice the **tag is in‑house** (it lives in the embedded activity); only consent and
  CSP may involve the vendor. The privacy‑first wording (no personal data, no free text)
  reassures on a sensitive topic. Analytics is the project's **final stage**, added just
  after go‑live.
- **Docs you can attach or offer** when they reply: the integration guide
  (`AMES_DRUPAL_INTEGRATION.md`), the plain‑English security briefing
  (`SECURITY_PLAIN_BRIEFING.md`), and the full security assessment
  (`SECURITY_RISK_ASSESSMENT.md`). You can also send the clickable deck or POC as the demo.
