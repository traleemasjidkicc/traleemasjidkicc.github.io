> **Archived** — superseded by [v2.0.2](../active/uat-suite-v2.0.2-2026-07-11.md).

# UAT Execution Results — High-Priority Automated Run

**Site:** [traleemasjidkicc.ie](https://traleemasjidkicc.ie)  
**Executed:** 28 June 2026  
**Environment:** `http://127.0.0.1:3000` (local BrowserSync via `yarn start`)  
**Browser:** Microsoft Edge (Playwright)  
**Viewports exercised:** 390×844 (mobile portrait), 844×390 (mobile landscape), 1280×800 (desktop)  
**Command:** `yarn test:e2e` (55 Playwright tests, including 44 mapped to high-priority UAT cases below)

## Summary

| Metric | Count |
|--------|-------|
| High-priority UAT cases with automated coverage | 44 |
| Automated ✅ Pass | 43 |
| Not automated (manual / device-only) | Remaining cases in [uat-suite v2.0](docs/tests/active/uat-suite-v2.0-2026-06-28.md) |

## High-priority results (automated)

| UAT # | Heading | Device | Status | Playwright test |
|-------|---------|--------|--------|-----------------|
| 1 | Site loads on homepage | Desktop | ✅ Pass | `homepage.spec.js` |
| 3 | Desktop top nav links visible | Desktop | ✅ Pass | `mobile-nav.spec.js` |
| 4 | Mobile hamburger opens menu | Mobile – Portrait | ✅ Pass | `mobile-nav.spec.js` |
| 5 | Mobile menu closes on link tap | Mobile – Portrait | ✅ Pass | `mobile-nav.spec.js` |
| 6 | Programmes mega menu (desktop) | Desktop | ✅ Pass | `mobile-nav.spec.js` |
| 7 | Programmes mega menu (mobile) | Mobile – Portrait | ✅ Pass | `mobile-nav.spec.js` |
| 8 | About mega menu links | Desktop | ✅ Pass | `mobile-nav.spec.js` |
| 9 | Salah times nav dropdown | Mobile – Portrait | ✅ Pass | `mobile-nav.spec.js` |
| 19 | First-visit cookie banner | Mobile – Portrait | ✅ Pass | `cookie-consent.spec.js` |
| 20 | Accept all enables embeds | Mobile – Portrait | ✅ Pass | `cookie-consent.spec.js` |
| 21 | Essential-only blocks Mixlr | Desktop | ✅ Pass | `cookie-consent.spec.js` |
| 26 | Google Maps consent on contact | Mobile – Portrait | ✅ Pass | `cookie-consent.spec.js` |
| 27 | Preferences persist across pages | Desktop | ✅ Pass | `cookie-consent.spec.js` |
| 28 | Privacy copy visitor-friendly | Mobile – Portrait | ✅ Pass | `cookie-consent.spec.js` |
| 34 | Hero date and prayer status | Mobile – Portrait | ✅ Pass | `homepage.spec.js` |
| 35 | Prayer deck carousel | Mobile – Portrait | ✅ Pass | `homepage.spec.js` |
| 37 | Link to full timetable | Mobile – Portrait | ✅ Pass | `homepage.spec.js` |
| 40 | Pillars of Faith tabs | Mobile – Portrait | ✅ Pass | `homepage.spec.js` |
| 47 | Homepage donate section | Mobile – Portrait | ✅ Pass | `homepage.spec.js` |
| 50 | Homepage layout landscape | Mobile – Landscape | ✅ Pass | `homepage.spec.js` |
| 51 | Prayer times hero live cards | Mobile – Portrait | ✅ Pass | `prayer-times.spec.js` |
| 52 | Month view default on load | Mobile – Portrait | ✅ Pass | `prayer-times.spec.js` |
| 53 | Switch to week view | Mobile – Portrait | ✅ Pass | `prayer-times.spec.js` |
| 54 | Switch to month/day view | Desktop | ✅ Pass | `prayer-times.spec.js` |
| 55 | Month tabs switch periods | Mobile – Portrait | ✅ Pass | `prayer-times.spec.js` |
| 56 | Day picker prev/next/today | Mobile – Portrait | ✅ Pass | `prayer-times.spec.js` |
| 58 | PDF download link present | Mobile – Portrait | ✅ Pass | `prayer-times.spec.js` |
| 59 | Jumu'ah section reachable | Mobile – Portrait | ✅ Pass | `prayer-times.spec.js` |
| 62 | URL deep link `?view=month` | Desktop | ✅ Pass | `prayer-times.spec.js` |
| 66 | Weekly schedule grid | Mobile – Portrait | ✅ Pass | `homepage.spec.js` |
| 68 | Programme details modal | Mobile – Portrait | ✅ Pass | `homepage.spec.js` |
| 76–87 | New Masjid campaign (subset) | Mixed | ✅ Pass | `projects.spec.js` |
| 84 | GoFundMe donate links | Mobile – Portrait | ✅ Pass | `homepage.spec.js` |
| 85 | SumUp widget mount | Desktop | ✅ Pass | `homepage.spec.js` |
| 103 | Contact form empty submit | Desktop | ✅ Pass | `contact-form.spec.js` |
| 104 | Contact form validation rules | Mobile – Portrait | ✅ Pass | `contact-form.spec.js` |
| 105 | Message character counter | Mobile – Portrait | ✅ Pass | `contact-form.spec.js` |
| 106 | Valid form client validation | Desktop | ✅ Pass | `contact-form.spec.js` |
| 111 | SumUp on homepage | Mobile – Portrait | ✅ Pass | `homepage.spec.js` |
| 113 | Page language `en-GB` | Desktop | ✅ Pass | `homepage.spec.js` |
| 114 | Keyboard focus on nav | Desktop | ✅ Pass | `homepage.spec.js` |
| 119 | Mobile nav touch target | Mobile – Portrait | ✅ Pass | `mobile-nav.spec.js` |
| 120 | Form labels and error roles | Desktop | ✅ Pass | `contact-form.spec.js` |
| 134 | UK date format | Desktop | ✅ Pass | `prayer-times.spec.js` |
| 135 | UK time format in nav | Desktop | ✅ Pass | `prayer-times.spec.js` |
| 136 | 404 for unknown URL | Desktop | ✅ Pass | Manual after deploy — branded `404.html` on GitHub Pages |

## Manual follow-up (not fully automatable)

- **Real devices:** Safari iOS, Chrome Android — Add to Home Screen (132), touch ergonomics, geolocation directions (102)
- **Payment completion:** SumUp card charge end-to-end (85–86) — requires sandbox/test card
- **API failure paths:** Block Cloud Run / Mixlr (36, 39, 109, 138–140) — use DevTools network blocking
- **Print dialog:** Case 57 — verify print sheet visually
- **Accessibility:** VoiceOver/NVDA (116), contrast audit (118), reduced motion on device (63, 121)
- **Performance:** Fast 3G throttling (122), offline cache (123)

## Test files added

| File | Coverage |
|------|----------|
| [`tests/helpers/site.js`](tests/helpers/site.js) | Viewports, consent helpers, nav helper |
| [`tests/cookie-consent.spec.js`](tests/cookie-consent.spec.js) | Cookie consent UAT 19–21, 26–28 |
| [`tests/mobile-nav.spec.js`](tests/mobile-nav.spec.js) | Navigation UAT 3–9, 119 |
| [`tests/contact-form.spec.js`](tests/contact-form.spec.js) | Contact form UAT 103–106, 120 |
| [`tests/prayer-times.spec.js`](tests/prayer-times.spec.js) | Prayer times UAT 51–59, 62, 134–135 |
| [`tests/homepage.spec.js`](tests/homepage.spec.js) | Homepage, programmes, donations, a11y |
| [`tests/projects.spec.js`](tests/projects.spec.js) | New Masjid campaign (existing, extended) |

## How to re-run

```bash
yarn start          # terminal 1 — http://localhost:3000
yarn test:e2e       # terminal 2 — all 55 tests
yarn test:e2e:headed  # watch in Edge
```
