# Security — Plain‑English Briefing

**Purpose:** a jargon‑light version of the security assessment, so you can confidently
talk the IT manager through it. Same coverage, easier words.
**Companions:** the one‑page summary ([SECURITY_SUMMARY_EXEC.md](./SECURITY_SUMMARY_EXEC.md))
and the full technical version ([SECURITY_RISK_ASSESSMENT.md](./SECURITY_RISK_ASSESSMENT.md)).

---

## The one‑sentence version

> *"It's a self‑contained web page with no server, no database, and no logins, and it
> sends no personal information anywhere — so the big security risks don't apply. The
> few things left are standard website settings your team already uses."*

That's the whole message. Everything below just backs it up.

---

## Why the risk is genuinely low (the three big reasons)

1. **There's nothing to break into.** No back‑end system, no database, no user accounts.
   Most serious breaches target those — this has none.
2. **Nothing personal leaves the visitor's device.** The only thing someone can type is
   a short, optional note ("commitment"). It's saved **only in their own browser** and
   is **never sent to AMES or anyone else**.
3. **Nothing is loaded from the wider internet while it runs.** The tree, the scenery
   and the sound are all **drawn in the browser** — there are no outside images, videos
   or scripts that could be tampered with.

---

## Every concern, in plain words

Each row is a real security concern, what it means, and why it's not a problem here.

| The concern (its technical name) | In plain words | Why it's low‑risk here / what we did | Status |
|---|---|---|---|
| **Cross‑site scripting (XSS)** | "Could someone slip malicious code in through the text box?" | The only input is a short note. The game treats it **strictly as text, never as code**, and never sends it anywhere. | Handled by design |
| **Hacking a server / database / login** | "The classic big breaches." | There is **no server, no database, and no login** to attack — so these don't apply. | Not applicable |
| **Data left on shared computers** | "Could the next person on a shared PC see what someone typed?" | The note stays **only in that browser** and is never sent to us. "Start over" clears it; on shared/kiosk machines we can auto‑clear it. | Handled (easy option) |
| **Clickjacking** | "Could a scam site hide our page inside theirs to trick clicks?" | We tell browsers to **only let the AMES site display it**. | Quick setting at launch |
| **No "browser rulebook" (CSP)** | "Stop any unexpected code from running on the page." | Because the page loads nothing from outside, we can apply a **strict rulebook**. | Quick setting at launch |
| **Out‑of‑date building blocks** | "Are the off‑the‑shelf parts up to date and safe?" | It uses only a **few well‑known parts** (React). We scan them and keep them patched. | Handled + routine |
| **Tampered outside content** | "Could a hacked image or script from elsewhere infect it?" | It **loads nothing from the wider internet** while running. All files live on AMES servers. | Handled by design |
| **Insecure connection** | "Is it encrypted in transit?" | Served **only over HTTPS** (the padlock), like the rest of the AMES site. | Standard |
| **Analytics & privacy** | "Are we collecting personal info or breaking privacy rules?" | Optional usage stats only — **behind cookie consent, anonymised**, and the **typed note is never sent to analytics**. | The main thing to set up carefully |
| **Files tampered with on the server** | "Could someone alter our files where they're hosted?" | Deploy through a **controlled process with restricted access** (AMES hosting governance). | AMES hosting |
| **Being knocked offline (DoS)** | "Could it be flooded and taken down?" | It's just **static files** (no server doing work), cached on the AMES network — cheap and resilient. | Handled by design |
| **Device permissions** | "Does it use the camera, microphone or location?" | **No** — it asks for nothing, and sound only starts when the visitor clicks. | Handled by design |
| **Tracking cookies** | "Does the game track people?" | The game sets **no cookies**. Only the optional analytics does, under consent. | Handled by design |
| **Duty of care (sensitive topic)** | "It's a DV‑prevention tool — is anyone left unsupported?" | The **1800RESPECT / 000 line is on every screen**, and nothing the visitor does is stored or shared. | Handled by design |

---

## Questions the IT manager is likely to ask (with plain answers)

**"What personal data do you collect, and where is it stored?"**
None is sent to us. The only input is a short note kept **in the visitor's own browser**.
If usage analytics is switched on, it's **anonymous** and **never includes that note**.

**"Is there a back end or database we need to secure?"**
No — there's no server‑side system, no database, and no logins. It's static files.

**"What does it load from the internet while running?"**
Nothing. The whole experience is generated in the browser. We host all the files on AMES
infrastructure.

**"How do you stop someone abusing the text box (XSS)?"**
The note is treated as plain text, safely encoded, **never run as code**, and never
transmitted. We also recommend the standard browser "rulebook" (CSP) as a backstop.

**"If we embed it in our Drupal page, can it touch our site's data?"**
No. It runs isolated in its own frame with **no access to Drupal logins, cookies or
admin**.

**"Has it been security‑tested?"**
We recommend the **standard pre‑launch checks** — a dependency scan, an automated web
scan, a quick manual test of the text box, and a header check. (Honest note: those
should be run as part of go‑live; it hasn't been independently pen‑tested yet, and that
can be folded into AMES's usual process.)

**"What do you need from us/IT before launch?"**
Five standard things — see below.

**"Who maintains it and keeps it patched?"**
It has very few parts to maintain. We document a simple patch‑and‑redeploy process and a
review cadence.

---

## The 5 things to switch on before launch (all standard)

1. **Serve it securely** — HTTPS only (same as the rest of the site).
2. **Turn on the standard browser security settings** — the "headers" and the rulebook
   (CSP) so only the AMES site can display it and nothing unexpected can run.
3. **Host all the files on AMES's own servers** — nothing loaded from outside.
4. **Set up analytics privately** — consent + anonymised, and confirm the typed note is
   never collected.
5. **Run a routine security scan** of the page and its parts.

The full technical detail for each of these — exact settings, a checklist, and a
sign‑off box — is in [SECURITY_RISK_ASSESSMENT.md](./SECURITY_RISK_ASSESSMENT.md) for
the IT team to action.

---

## Mini‑glossary (so the terms don't trip you up)

| Term | In one line |
|---|---|
| **XSS (cross‑site scripting)** | Tricking a page into running malicious code, usually through an input box. |
| **CSP (Content Security Policy)** | A browser "rulebook" listing what's allowed to run/load — blocks the unexpected. |
| **HTTPS / TLS** | The padlock — encrypts data travelling between the browser and the site. |
| **HSTS** | Forces browsers to always use the secure (HTTPS) connection. |
| **Clickjacking** | Hiding a real page inside a fake one to trick people into clicking. |
| **iframe** | A window that embeds one web page inside another (how the game sits on the AMES page). |
| **localStorage** | A small storage box inside the visitor's own browser — stays on their device. |
| **Dependencies** | Off‑the‑shelf code building blocks (e.g., React). |
| **npm audit / SCA scan** | A check of those building blocks for known weaknesses. |
| **DAST / OWASP ZAP** | A tool that automatically probes the live page for weaknesses. |
| **OWASP Top 10** | The industry's standard list of the ten most common web risks. |
| **DoS / DDoS** | Flooding a site with traffic to knock it offline. |
| **GA4** | Google Analytics 4 — the tool that measures usage. |
| **Consent Mode** | Only turns analytics on after the visitor accepts cookies. |

---

## How to close the conversation

> *"In short: the design removes the serious risks, and the rest is standard hardening
> your team already does. Here's the full assessment with a risk table, the exact
> settings, a go‑live checklist and a sign‑off box — happy for your team to review and
> sign it off."*
