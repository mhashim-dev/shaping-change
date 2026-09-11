# Power, Pressure & Choice — Security Risk Assessment & Mitigation Strategy

**Prepared for:** AMES Australia — IT / Information Security
**Subject:** Embedding the *Power, Pressure & Choice* interactive on the AMES Australia public website (Drupal)
**Document type:** Risk mitigation strategy (for IT security review)
**Version:** 1.0 · **Date:** 25 June 2026 · **Classification:** Internal

> Companion documents: [AMES_DRUPAL_INTEGRATION.md](./AMES_DRUPAL_INTEGRATION.md)
> (integration & analytics) and [GAME_DESIGN_DOCUMENT.md](./GAME_DESIGN_DOCUMENT.md).

---

## 1. Purpose & scope

This document identifies the potential security risks of publishing the interactive
to the AMES public website, and sets out how each is **handled by design** or
**mitigated through controls AMES applies at go‑live**. It is intended to give the IT
manager and any security reviewer a clear, honest picture of the attack surface and
residual risk.

**In scope:** the interactive itself (front‑end application + content) and its
integration into the AMES Drupal site.
**Out of scope:** the security of the wider AMES Drupal/CMS platform, hosting
infrastructure, network and the AMES Google Analytics tenant — these remain under
AMES governance. Where the interactive depends on those controls, it is called out as
**“AMES to configure.”**

---

## 2. Executive summary

The interactive is a **self‑contained, client‑side, static web experience**. It has:

- **no back‑end application, no database, no API, and no user accounts;**
- **no transmission of any personal data** — the only user input (a short free‑text
  “commitment”) is stored **only in the visitor’s own browser** and is never sent
  anywhere;
- **no third‑party assets or code loaded at runtime** — the tree, scenery and audio
  are all generated in the browser (no image, video or audio files), so there is no
  external content to compromise;
- a **minimal dependency footprint** (React, Next.js) and **no use of `eval`,
  `dangerouslySetInnerHTML`, `document.write`, cookies, or any device permissions**.

Because of this architecture, the **highest‑severity web risk categories simply do not
apply** (server‑side injection, authentication bypass, back‑end data breach, SSRF).
The residual risk is limited to standard front‑end hardening (output encoding, a
Content Security Policy and security headers) and privacy controls around the
**optional** Google Analytics measurement — all of which AMES can apply through its
existing website controls.

**Overall residual risk after the recommended controls: LOW.**

Top five actions before go‑live (all standard AMES controls):

1. Serve over HTTPS only (already AMES standard) and add HSTS.
2. Apply a Content Security Policy and the security‑header set in §7.
3. Set `frame-ancestors`/`X-Frame-Options` to AMES origins (anti‑clickjacking).
4. Configure Google Analytics for IP anonymisation + cookie consent, and confirm the
   free‑text commitment is **never** sent to analytics (§6, risk 8).
5. Run a dependency/SCA scan and an automated web scan against the deployed page (§9).

---

## 3. System overview (security‑relevant architecture)

| Property | Detail |
|---|---|
| **Type** | Static, client‑side web application (Next.js / React) + a framework‑free HTML5 `<canvas>` engine |
| **Back end** | **None.** No server‑side application code, database, API, or business logic |
| **Authentication** | **None.** No accounts, logins, sessions or roles |
| **Assets** | **Asset‑free** — every visual and sound is generated procedurally in the browser; no image/audio/video files are loaded |
| **External calls at runtime** | **None required** by the app. Optional Google Analytics is the only egress, and it is configured separately by AMES |
| **Persistence** | Browser **`localStorage` only** (the visitor’s progress and their own commitment text). No cookies are set by the app |
| **User input** | A single optional free‑text field (“commitment”, max 160 characters) |
| **Runtime dependencies** | `next`, `react`, `react-dom` (3 packages) |
| **Deployment** | Static files hosted by AMES (recommended), embedded in Drupal as a page/block or sandboxed iframe |

A fully self‑contained single‑file build also exists for demos; the production
deployment should use the standard static build hosted on AMES infrastructure (see §8).

---

## 4. Data handling & classification

| Data | Sensitivity | Where it lives | Leaves the device? |
|---|---|---|---|
| “Commitment” free text (user‑written; could contain a personal reflection) | Potentially personal | The visitor’s browser `localStorage` | **No** — never transmitted by the app |
| Progress / path / chosen options | Non‑sensitive | The visitor’s browser `localStorage` | **No** |
| Mute preference | Non‑sensitive | The visitor’s browser `localStorage` | **No** |
| Analytics events (only if AMES enables GA) | Usage metrics (IP, device, interaction events) | Google Analytics | **Yes — to Google**, under AMES’ GA tenant & consent (see risk 8) |
| Application code & content | Public | Hosted static files | Public |

**Key point:** the application itself sends **no data off the device**. The only
possible data egress is the AMES‑configured analytics, which must be limited to
**non‑identifying interaction events** and must **never** include the free‑text input.

---

## 5. Threat model summary

The attack surface is deliberately small:

- **Served content:** static HTML/JS/CSS hosted by AMES.
- **Client‑side execution:** the canvas/game logic in the visitor’s browser.
- **One input:** a length‑limited text field.
- **One optional egress:** Google Analytics.

There is **no server endpoint owned by the interactive**, so the classic high‑impact
server‑side threats (SQL/command injection, authentication bypass, SSRF, back‑end data
exfiltration) have **no surface to attack**. The realistic concerns are front‑end:
cross‑site scripting, clickjacking, supply‑chain/dependency risk, transport security,
content integrity on the host, and the privacy of analytics.

---

## 6. Risk register

Status key — **By design:** inherent to the build, already handled · **Configure:**
AMES applies at go‑live · **Verify:** confirm via testing before launch.

| # | Security concern | Risk if unmitigated | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|---|---|
| 1 | **Cross‑site scripting (XSS)** via the free‑text commitment | Stored/reflected script execution → defacement, redirection | Low | Med | The only input is a 160‑char text field that is **never executed**: the React build auto‑escapes all rendered text, the canvas renders no HTML, and the standalone build **HTML‑encodes** the value before display. **No `dangerouslySetInnerHTML`, `eval`, `new Function`, or `document.write`** anywhere (verified). Input is length‑capped. A CSP (risk 4) adds defence‑in‑depth. | By design |
| 2 | **Persistent data on shared/kiosk devices** | A later visitor on a shared PC could see a previous visitor’s commitment in `localStorage` | Low | Low | Data is **on‑device only and never transmitted**. “Start over” clears the saved state. For kiosk/shared deployments, switch the store to `sessionStorage` or clear the key on completion (one‑line change). No PII leaves the device regardless. | By design + Configure (kiosk) |
| 3 | **Clickjacking / UI‑redress** when embedded | The page framed by a malicious site to trick clicks | Low | Low | Set `Content-Security-Policy: frame-ancestors 'self' https://www.ames.net.au` (and `X-Frame-Options: SAMEORIGIN`). If embedded via iframe, use the `sandbox` attribute (§8). | Configure |
| 4 | **No Content Security Policy** | A future injected script could run unrestricted | Low | Med | Add a CSP. Because the app loads **no third‑party assets**, a tight policy is feasible (sample in §7). Tune `script-src`/`style-src` to the chosen build artifact (Next.js requires a nonce/hash or `'unsafe-inline'` for its bootstrap/styles — see §7 note). | Configure |
| 5 | **Supply‑chain / vulnerable dependencies** | A compromised or outdated npm package introduces a flaw | Low | Med | **Minimal footprint** — only `next`, `react`, `react-dom`; **no third‑party runtime SDKs, trackers or analytics libraries bundled.** Pin versions via lockfile, run `npm audit` / enable Dependabot, build in a controlled pipeline, and ship a **static** artifact (no server runtime to exploit). Run an SCA scan before launch. | By design + Verify |
| 6 | **Third‑party / CDN content compromise** | A hijacked external asset injects malicious code | Low | Med | The app loads **no external assets at runtime** (asset‑free). **Self‑host all files on AMES infrastructure**; do not load the interactive from an external origin. If any CDN is ever introduced, apply **Subresource Integrity (SRI)**. | By design + Configure |
| 7 | **Transport security** (interception/MITM) | Content tampered in transit | Low | Med | Serve **only over HTTPS/TLS** (AMES standard); add **HSTS**. Asset‑free design means **no mixed‑content** risk. | Configure (AMES standard) |
| 8 | **Privacy of analytics** (Australian Privacy Act 1988 / APPs) | GA collects IP/device/behaviour; lack of consent or leakage of the free‑text reflection | Med | Med | If GA is enabled: use **GA4 with IP anonymisation**, gate it behind the **site’s existing cookie‑consent** mechanism, update the **privacy notice**, and track **only non‑identifying interaction events** (e.g. *step reached, ending reached, option category*). **The free‑text commitment and any raw input must never be sent to analytics.** See [AMES_DRUPAL_INTEGRATION.md](./AMES_DRUPAL_INTEGRATION.md) for the exact event list. | Configure |
| 9 | **Content/code integrity on the host** | Tampering with hosted JS injects malicious behaviour | Low | Med | Deploy via a **controlled pipeline**, restrict write access to the hosting path, enable file‑integrity monitoring, and let the CSP (risk 4) constrain any injected script. | Configure (AMES hosting governance) |
| 10 | **Availability / DoS** | The interactive becomes unavailable | Low | Low | **Static assets only** — cheap to serve, highly cacheable, **no server‑side compute to exhaust.** Rely on the AMES CDN/WAF for rate‑limiting and DDoS protection. | By design + AMES infra |
| 11 | **Browser permissions / autoplay abuse** | Unexpected access to device features | Low | Low | The app requests **no permissions** (no camera, microphone, geolocation, notifications). Audio is **synthesised and only starts after a user click** (no autoplay). Recommend a `Permissions-Policy` header disabling unused features (§7). | By design + Configure |
| 12 | **Cookies / tracking by the app** | Undisclosed tracking | Low | Low | The **app sets no cookies.** Only GA (if AMES enables it) sets cookies, under consent. | By design |
| 13 | **Sensitive‑topic safeguarding** (duty of care, not classic infosec) | A distressed user with no support pathway | Low | High | The **1800RESPECT / 000 support line is shown on every screen**; no shaming language; no data retention. Flagged here so IT/Comms are aware it is a deliberate control, not a gap. | By design |
| 14 | **Injection / SSRF / open redirect / auth bypass** | — | — | — | **Not present** — there is no server, no database, no authentication, and no user‑controlled URL fetching or redirection. | N/A by design |

---

## 7. Recommended security headers

Apply at the web‑server / reverse‑proxy / Drupal layer for the page hosting the
interactive. Adjust origins to AMES’ actual domains.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://www.googletagmanager.com;        /* + nonce/hash if GA inline; see note */
  connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com;
  img-src 'self' data:;
  style-src 'self' 'unsafe-inline';                          /* see note */
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'self' https://www.ames.net.au;
  upgrade-insecure-requests;
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment(), usb()
```

> **Note on `'unsafe-inline'`:** Next.js emits a small inline bootstrap script and some
> inline styles, and the optional GA snippet is inline. For the **strictest** CSP,
> serve the externalised static build and apply **nonces or hashes** to those inline
> blocks (Next.js supports nonce‑based CSP), which lets you drop `'unsafe-inline'`
> entirely. If a nonce pipeline is not available at launch, `'unsafe-inline'` for
> `style-src` (and a hashed/nonced `script-src`) is an acceptable interim posture given
> the app loads no third‑party scripts. Validate the final policy with a CSP evaluator.

---

## 8. Integration security (Drupal)

- **Host on AMES infrastructure / same origin.** Publish the static build under an
  AMES‑controlled path or subdomain; do **not** load it from an external origin.
- **Embedding options:**
  - *Preferred:* a dedicated AMES page/route (same origin) — simplest CSP and headers.
  - *Iframe:* if embedded in an existing page, use
    `<iframe src="…" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer" …>`.
    `allow-same-origin` is needed for the game’s own `localStorage`; because the app has
    no back end and no cross‑frame messaging, this does not expose Drupal session data.
    Keep the iframe on an AMES origin and set `frame-ancestors` accordingly.
- **Isolate from the CMS:** the interactive needs **no access to Drupal sessions,
  cookies, admin or user data**. Serve it as static content; do not couple it to
  authenticated Drupal context.
- **Least privilege on deploy:** restrict who/what can write to the hosting path; deploy
  through the standard AMES release process.

---

## 9. Pre‑go‑live verification (recommended)

| Check | Tool / method | Why |
|---|---|---|
| Dependency / SCA scan | `npm audit`, Snyk/Dependabot | Catch vulnerable packages (risk 5) |
| Static analysis / secret scan | CodeQL / gitleaks | Confirm no secrets, no unsafe sinks |
| Automated web scan (DAST) | OWASP ZAP against the deployed page | Headers, XSS, misconfig (risks 1, 3, 4) |
| Manual XSS test | Enter script payloads in the commitment field | Confirm output encoding (risk 1) |
| Header / CSP validation | Mozilla Observatory / securityheaders.com | Confirm §7 is in force |
| Privacy / analytics review | Review GA4 config + consent + privacy notice | Confirm risk 8 controls |
| Penetration test | As required by AMES policy (often as part of the wider site) | Independent assurance |

---

## 10. OWASP Top 10 (2021) mapping

| OWASP risk | Applicability & handling |
|---|---|
| **A01 Broken Access Control** | **N/A** — no authentication, no protected resources or roles. Access control is the host/CMS’s responsibility for the page itself. |
| **A02 Cryptographic Failures** | TLS in transit (§7). No secrets and no server‑side sensitive data; `localStorage` holds only the user’s own non‑transmitted text. |
| **A03 Injection** | No server/DB → no SQL/command injection. XSS mitigated by output encoding + CSP (risks 1, 4). |
| **A04 Insecure Design** | Privacy‑by‑design (no data egress from the app), least‑privilege hosting, safeguarding controls (risk 13). |
| **A05 Security Misconfiguration** | Addressed by the header/CSP set (§7) and the go‑live checklist (Appendix A). |
| **A06 Vulnerable & Outdated Components** | Minimal deps + lockfile + `npm audit`/Dependabot + SCA scan (risk 5). |
| **A07 Identification & Authentication Failures** | **N/A** — no authentication. |
| **A08 Software & Data Integrity Failures** | Controlled build/deploy pipeline, SRI if any CDN, CSP limits injected scripts (risks 6, 9). |
| **A09 Security Logging & Monitoring Failures** | Rely on AMES web‑server/WAF/CDN logging; the app holds nothing sensitive to log. |
| **A10 Server‑Side Request Forgery (SSRF)** | **N/A** — no server‑side requests; the app fetches nothing from user‑controlled URLs. |

---

## 11. Residual risk & recommendation

After the controls above, **residual risk is LOW**. The architecture removes the
highest‑severity categories outright (no back end, no database, no authentication, no
personal‑data transmission), and the remaining items are standard front‑end hardening
that AMES already applies to its website. The interactive is **suitable for publication
on the public site once the §7 headers, the analytics‑privacy controls (risk 8), and
the §9 verification are in place.**

| Role | Name | Decision | Date |
|---|---|---|---|
| Prepared by | _Project team_ | For review | 25 Jun 2026 |
| Reviewed by | _AMES IT / Security_ | ☐ Approve ☐ Approve with conditions ☐ Reject | |
| Approved for go‑live | _AMES_ | | |

---

## Appendix A — Go‑live security checklist

- [ ] Served over HTTPS only; HSTS enabled
- [ ] CSP applied and validated (§7); `frame-ancestors` limited to AMES origins
- [ ] `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` set
- [ ] All files self‑hosted on AMES infrastructure (no external origins; SRI if any CDN)
- [ ] Dependency/SCA scan clean (`npm audit` / Snyk)
- [ ] Automated web scan (ZAP) and manual XSS test on the commitment field passed
- [ ] GA4 (if used) IP‑anonymised, behind cookie consent, privacy notice updated
- [ ] Confirmed: **no free‑text/user input is ever sent to analytics**
- [ ] Confirmed: app sets no cookies and requests no device permissions
- [ ] 1800RESPECT / 000 support line visible on every screen
- [ ] Kiosk/shared‑device builds clear or session‑scope `localStorage` (if applicable)

## Appendix B — What the interactive explicitly does **not** do

- Does **not** have a back end, database, API or admin panel.
- Does **not** authenticate users or hold credentials.
- Does **not** send any personal data off the device.
- Does **not** load third‑party images, fonts, audio, video or scripts at runtime.
- Does **not** set cookies, or request camera, microphone, location or notification access.
- Does **not** use `eval`, `new Function`, `document.write` or `dangerouslySetInnerHTML`.
- Does **not** upload files or accept any input other than one short text field.
