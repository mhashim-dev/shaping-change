# Power, Pressure & Choice — Security Summary (one page)

**For:** AMES leadership · **About:** putting the interactive on the AMES public website
**Date:** 25 June 2026 · Full detail: [SECURITY_RISK_ASSESSMENT.md](./SECURITY_RISK_ASSESSMENT.md)

## Bottom line

**The security risk of publishing this interactive is LOW.** It is a simple,
self‑contained web experience with no login, no database, and no personal information
sent anywhere. The most serious kinds of website security problems **cannot happen here
because the parts that cause them do not exist.** A short list of standard website
protections — the same ones AMES already uses — should be switched on before launch.

## Why the risk is low (in plain terms)

- **Nothing to break into.** There is **no back‑end system, no database, and no user
  accounts.** Most serious breaches target exactly those things; this interactive has
  none of them.
- **Nothing personal leaves the visitor's device.** The only thing a visitor can type
  is a short, optional "commitment." It is saved **only in their own browser** and is
  **never transmitted to AMES or anyone else.**
- **Nothing is loaded from the wider internet while it runs.** The whole experience —
  the tree, the scenery, the sound — is **generated in the browser**, so there are no
  outside images, videos or code that could be tampered with.
- **Small, well‑known technology.** It is built on widely used, well‑maintained
  components (React) and ships as plain static web files that are cheap and safe to
  host.

## The one thing to get right

**Analytics privacy.** If AMES measures usage with Google Analytics, that is the only
information that ever leaves the page. It must be set up the standard way — behind the
site's cookie‑consent, with anonymised data — and it must **only count anonymous
actions** (how far people get, which ending they reach). The words a visitor types are
**never** sent to analytics. (Care of duty for a violence‑prevention tool, and required
under the Australian Privacy Act.)

## What we will do before go‑live

These are routine, and most are AMES's existing website controls:

1. Serve it over a secure (HTTPS) connection only.
2. Switch on the standard website security settings (the technical headers in the full
   report) so the page can't be misused or framed by other sites.
3. Host all the files on AMES's own infrastructure (nothing loaded from outside).
4. Configure analytics privately (consent + anonymised) and confirm no typed text is
   ever collected.
5. Run a routine security scan of the page and its components before launch.

## Built‑in safeguards (worth noting)

- The **1800RESPECT / 000 support line is shown on every screen**, and nothing the
  visitor does is stored or shared — appropriate for a sensitive topic.
- It asks for **no permissions** (no camera, microphone or location) and sets **no
  tracking cookies of its own.**

## Recommendation

**Proceed to publish**, once the five standard steps above are in place. The full
technical assessment (risk register, OWASP mapping, recommended settings, and a go‑live
checklist) is in [SECURITY_RISK_ASSESSMENT.md](./SECURITY_RISK_ASSESSMENT.md) for the IT
team to action and sign off.
