# Statistics — sources & pre-launch verification

The three figures shown behind the **"Show the numbers"** reveal on the `why_matters`
screen ("Bigger than one family"). They were provided by the Edu team and confirmed by
Ali (PVAW) in July 2026. **Before public launch, each must be independently checked against
the cited publication** and the wording confirmed with PVAW — tick the boxes below.

> Why this matters: mis-stating a violence statistic (wrong number, wrong timeframe, wrong
> source) undermines trust and can cause harm. ANROWS publishes specific guidance on the
> *accurate use* of these exact statistics — consult it when confirming wording.

## The figures as currently shown

1. **"On average, one woman a week was killed by a current or former intimate partner in
   Australia (AIHW, 2018)."**
   - Source: AIHW, *Family, domestic and sexual violence in Australia 2018*.
   - ⚠️ Nuance to confirm: the widely-cited "one woman a week" rate derives from AIHW data
     for **2012–13 to 2013–14**; the 2018 report restates it. Later AIHW data shows the rate
     varies year to year. Confirm the timeframe wording with PVAW/ANROWS so it is not read
     as a current single-year figure.
   - Verify against: https://www.aihw.gov.au/reports/domestic-violence/family-domestic-sexual-violence-in-australia-2018/summary
   - Accurate-use guidance: https://www.anrows.org.au/publication/violence-against-women-accurate-use-of-key-statistics/read/
   - [ ] Independently verified · [ ] Wording confirmed with PVAW

2. **"Gender-based violence costs Australia $26 billion a year (PM&C, 2023)."**
   - Source: Australian Government (PM&C / Office for Women) material supporting the National
     Plan to End Violence against Women and Children 2022–2032.
   - Verify against: https://genderequality.gov.au/ (Office for Women) and the National Plan
     documentation at https://www.dss.gov.au/national-plan-end-gender-based-violence
   - ⚠️ Confirm the exact figure, base year and the correct attributing body/year (PM&C 2023).
   - [ ] Independently verified · [ ] Attribution/year confirmed

3. **"1 in 2 women have experienced sexual harassment (ABS, 2021)."**
   - Source: ABS *Personal Safety Survey* (2021–22 release).
   - ⚠️ Confirm the exact proportion and the timeframe it refers to (e.g. lifetime vs. last
     12 months) so the "1 in 2" claim matches the ABS definition.
   - Verify against: https://www.abs.gov.au/statistics/people/crime-and-justice/personal-safety-australia/latest-release
   - [ ] Independently verified · [ ] Timeframe/wording confirmed

## Where the numbers live in the code

- `lib/game-content.js` → node `why_matters` → `reveal.text` (single source of truth).
- Any change to a figure must be reflected here and re-confirmed with PVAW.
- `scripts/validate-content.mjs` guards that a reveal quoting a figure **keeps a year
  citation** (`npm run test:content`) — it can't stop a wrong number, but it stops a
  citation being silently dropped.
- Translated packs (`lib/i18n.js`) must carry the same figures + citations; check them too.

## Sign-off

- [ ] All three figures independently verified against source publications
- [ ] Wording/timeframes confirmed with PVAW (Anu / Ali)
- [ ] Cleared for public launch — name & date: ____________________
