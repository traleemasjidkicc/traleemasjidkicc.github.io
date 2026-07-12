# Agent instructions — Tralee Masjid website

Static GitHub Pages site for Kerry Islamic Cultural Centre (Tralee Masjid). Vanilla HTML/CSS/JS with Bootstrap 4.3, Gulp for local dev, query-string cache busting (`?v=`) on commit, and Playwright e2e tests.

## Quick reference

| Task | Command |
|------|---------|
| Install deps | `yarn ci` |
| Install git hooks | `yarn setup-hooks` |
| Local dev server | `yarn start` → http://localhost:3000 |
| Verify node_modules | `yarn verify` |
| E2E tests (dev server must be running) | `yarn test:e2e` |
| E2E headed / UI | `yarn test:e2e:headed` / `yarn test:e2e:ui` |
| Regenerate error pages (after nav/footer changes) | `yarn build:error-pages` |
| Commit (hooks run automatically) | `git commit` — runs `yarn precommit` via pre-commit hook |

**Package manager:** Yarn only (`engine-strict` in `.npmrc`). Do not use npm.

## Architecture

```
Browser (GitHub Pages)
  ├── Static HTML pages (root *.html)
  ├── assets/css/main.css
  ├── assets/js/scripts.js (single app script, ~11,400 lines)
  ├── SEO: robots.txt, sitemap.xml, site.webmanifest
  └── CDN: Bootstrap 4.3, jQuery 3.3, Font Awesome 6.2, BaguetteBox, js-cookie

Google Cloud Run (europe-west1) — masjid content APIs in CLOUD_RUN_APIS
  ├── getsalahtimes-*       → monthly salah times PDF/image URL
  ├── getiqamahtimes-*      → today's iqamah times + Jumuah schedule
  ├── getannouncements-*    → site-wide announcements ribbon
  ├── getnotices-*          → homepage notice board
  ├── getmasjidprogrammes-* → activities programmes (schedule + catalogue)
  ├── randomhadith-*        → daily hadith
  ├── getcampaigns-*        → donation campaign progress (GoFundMe totals)
  └── createcheckout-*      → SumUp card checkout session

Other third-party
  ├── api.mixlr.com         → live stream status and events (homepage + activities)
  ├── GoFundMe embed        → donation widgets (homepage + projects.html)
  ├── Microsoft Forms       → Kerry Muslim database (nav/footer/modal; not madrasa enrolment)
  ├── SumUp Payment Widget  → uses Cloud Run createCheckout above
  └── Google Analytics      → gtag G-3H9CDDS71D (consent-gated)
```

## Critical: JS and CSS asset versioning

- Stable files: `assets/js/scripts.js`, `assets/css/main.css`
- Version source: `assets/asset-version.txt` (timestamp written by pre-commit hook)
- HTML references: `scripts.js?v={timestamp}` and `main.css?v={timestamp}`
- **Never manually edit** `?v=` in HTML `<script>` / `<link>` tags — git hooks bump it on commit
- On commit, `yarn precommit` runs `gulp precommit`: bumps `?v=` in all HTML when `scripts.js` and/or `main.css` has git changes; `pre-commit` hook stages the result
- Edit `scripts.js` and `main.css` in place during development; `yarn start` hot-reloads without a hard refresh

## Pages

| File | Nav label | Purpose |
|------|-----------|---------|
| `index.html` | Home | Hero, prayer deck, announcements, notices, programmes preview, Mixlr, hadith, donate |
| `prayer-times.html` | Salah times | Full salah timetable (day/week/month), print sheet, visit CTA |
| `activities.html` | Programmes | Weekly programmes API, Mixlr live hub |
| `projects.html` | **New Masjid** | Donation campaign, GoFundMe, SumUp, building gallery |
| `about.html` | — | History, vision, team |
| `madrasa.html` | Madrasa | Children's Islamic school |
| `contact.html` | Contact | Imams, management, map, directions |

### Error pages (not in nav or sitemap)

| File | Served when | Notes |
|------|-------------|-------|
| `404.html` | GitHub Pages auto-serves for missing URLs | Branded page; `noindex`; root-relative asset paths (`/assets/...`) so CSS/JS load from deep missing URLs |
| `403.html` | Manual / future host config only | Access denied copy; not auto-served on GitHub Pages |
| `500.html` | Manual / future host config only | Server error copy; not auto-served on GitHub Pages |

**Regenerate** after nav, footer, or cookie-consent markup changes on `contact.html`:

```bash
yarn build:error-pages
```

Source: `scripts/build-error-pages.js` — copies shared chrome from `contact.html`, injects error hero content, and writes all three files. Styles: `.page-error` / `.error-*` in `main.css`. Do **not** add error pages to `sitemap.xml`.

## Page-specific JS behaviour

Init is split between `DOMContentLoaded` and `window.onload`. Page routing uses pathname helpers and `setLocationSpecific()`.

| Page | DOMContentLoaded (page-specific) | window.onload (`setLocationSpecific`) |
|------|----------------------------------|---------------------------------------|
| `/` (index) | `showNotices`, `initHomeNotices`, `initHomePillars` | `setLiveStreamStatus`, `loadProgrammes` |
| `prayer-times.html` | `initPrayerTimesPage`, `initPrayerTimesPageMotion`, `loadProgrammes` | `initPrayerTimesPage` |
| `activities.html` | `initProgrammesPageMotion` | `setLiveStreamStatus`, `loadProgrammes` |
| `projects.html` | — | `initBaguetteBox` (`.grid-gallery`) |

**All pages** on `DOMContentLoaded`: announcements ribbon, nav salah panel, mobile nav, section nav dock, cookie consent, consent-gated embeds (maps), WhatsApp/back-to-top, footer year, `initCanonicalSiteLinks`, page motion inits (about/contact/campaign/home donate as applicable), SumUp widget init.

**All pages** on `window.onload`: `setSalahTimeUrl`, `setSalahTimes`, `getRandomHadith`, `loadFundraiserProgress`, `setLocationSpecific`, `scrollToLocationHash`.

### localStorage cache keys

API content caches expire after **7 days** (via `kiccTimedStorageGet` / `kiccTimedStorageSet`). Dismiss flags (`kicc-breaking-dismiss-*`) are not TTL-limited.

| Key | Purpose |
|-----|---------|
| `salahTimesAssetUrl` | Monthly timetable PDF/image URL |
| `iqamah-month-*` | Monthly iqamah timetables (prev/current/next month) |
| `iqamah-tomorrow` | Legacy day iqamah JSON fallback |
| `kicc-announcements` | Announcements ribbon |
| `notices` | Homepage notices |
| `kicc-random-hadith` | Daily hadith |
| `masjidProgrammes_programme_active_true_v2` | Activities programmes |
| `kicc-campaign-progress` | GoFundMe / campaign totals from `getcampaigns` |

## Site links & naming

- **Kerry Muslim database** — Microsoft Form for email updates (`data-site-link="kerry-muslim-database"`). Never label it “Register for programmes”.
- **Madrasa enrolment** — WhatsApp only (`madrasa.html#ready-to-enrol`).
- Canonical URLs: `SITE_LINKS` in `scripts.js`; see `.cursor/rules/site-links.mdc`.

## SEO and discoverability

- **`robots.txt`** — allows crawling; references sitemap
- **`sitemap.xml`** — all 7 public HTML pages at `https://traleemasjidkicc.ie/` (error pages excluded)
- **Per-page `<head>`** — unique `title`, `description`, `canonical`, Open Graph, Twitter Card, JSON-LD (`Mosque`/`Organization`, `WebPage`, `BreadcrumbList`; homepage also `WebSite`)
- **`site.webmanifest`** — PWA metadata (`start_url`, `scope`, theme colour `#0a8a8e`)
- **Apple home screen** — `apple-touch-icon`, `apple-mobile-web-app-*`, `theme-color` on all pages
- **Google Search Console** — property may be verified via DNS/Analytics; HTML meta tag on `index.html` may show as unused if not the active method

## Conventions

- **HTML:** Bootstrap 4 grid, shared nav/footer patterns, SRI on CDN assets, `lang="en-GB"`, descriptive `alt` on images
- **CSS:** `assets/css/main.css` — layout, theme, motion, campaign, prayer-times, page-specific sections
- **JS:** IIFE with `"use strict"`; `const` arrow functions; localStorage cache-then-fetch; defensive fetch error handling
- **Dates:** UK format via `formatUkDate` / `formatGregorianFromRecord` (`en-GB`, day before month) — see `.cursor/rules/uk-date-format.mdc`
- **Times:** 12-hour via `formatUkDisplayTime` (no leading zero, lowercase `am`/`pm`) — see `.cursor/rules/uk-time-format.mdc`
- **Images:** under `assets/images/` (`brand/`, `backgrounds/`, `photos/`, `blueprints/`, `team/`, `ui/`)
- **Deployment:** `main` branch → GitHub Pages; custom domain via `CNAME` (`traleemasjidkicc.ie`)

## When editing

1. **Content (HTML):** edit directly; test with `yarn start`
2. **Styles:** edit `assets/css/main*.css`; BrowserSync hot-reloads; commit normally — hooks version the file
3. **Logic:** edit `assets/js/scripts.js`; commit normally — hooks bump `?v=`
4. **Dependencies:** `yarn upgrade <pkg>`, test, commit lockfile
5. **Ramadan/Eid dates:** update hardcoded dates in `isRamadan()` / `isEid()` annually (currently 2026)
6. **Campaign page:** `projects.html` uses `campaign-*` CSS classes and GoFundMe iframes — match existing patterns
7. **New public page:** add to nav/footer, `sitemap.xml`, and full SEO head block (canonical, OG, JSON-LD)
8. **Error pages:** edit styles in `main.css` or messages in `scripts/build-error-pages.js`, then run `yarn build:error-pages` — do not hand-edit nav/footer in `404.html` / `403.html` / `500.html` (they are generated)

## Pitfalls

- JS/CSS changes not visible → use `yarn start` (BrowserSync sends `no-store` for HTML/JS/CSS); after commit, normal reload picks up new `?v=`
- API down → check localStorage cache keys in DevTools
- Do not bump `package.json` version manually — precommit hook handles it
- Hadith/announcement HTML from APIs uses `innerHTML` — only trusted backend sources
- Mixlr API failures are non-fatal; events section falls back gracefully
- E2E locally: run `yarn start` before `yarn test:e2e` (`pretest:e2e` checks port 3000)

## Key files

- `gulpfile.js` — serve, watch, bump-asset-version, update-html, setup-hooks
- `package.json` — scripts, version, devDependencies
- `scripts/build-error-pages.js` — regenerates `404.html`, `403.html`, `500.html` from `contact.html` chrome
- `playwright.config.js` — Edge e2e; CI starts BrowserSync on port 3000
- `tests/helpers/site.js` — shared Playwright helpers (`gotoWithViewport`, `acceptAllCookies`, `openCookieSettings`, route blockers)
- `tests/*.spec.js` — 16 spec files, 154 tests mapped to UAT v2.0 IDs (see `docs/tests/active/uat-suite-v2.0.2-2026-07-11.md`)
- `assets/js/scripts.js` — all client-side logic
- `assets/css/main.css` — all styles including `campaign-*` and `prayer-times-*`
- `index.html`, `prayer-times.html`, `projects.html` — highest-traffic / feature-rich pages
- `404.html`, `403.html`, `500.html` — themed error pages (`404.html` auto-served by GitHub Pages)
- `robots.txt`, `sitemap.xml`, `site.webmanifest` — SEO/PWA root assets
- `pre-commit` — git hook script (copy to `.git/hooks/` via `yarn setup-hooks`)
