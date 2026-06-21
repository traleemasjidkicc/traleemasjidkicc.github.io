# Agent instructions — Tralee Masjid website

Static GitHub Pages site for Kerry Islamic Cultural Centre (Tralee Masjid). Vanilla HTML/CSS/JS with Bootstrap 4.3, Gulp for local dev, timestamp-based JS/CSS cache busting on commit, and Playwright e2e tests.

## Quick reference

| Task | Command |
|------|---------|
| Install deps | `yarn ci` |
| Install git hooks | `yarn setup-hooks` |
| Local dev server | `yarn start` → http://localhost:3000 |
| Verify node_modules | `yarn verify` |
| E2E tests (dev server must be running) | `yarn test:e2e` |
| E2E headed / UI | `yarn test:e2e:headed` / `yarn test:e2e:ui` |
| Commit (hooks run automatically) | `git commit` — runs `yarn precommit` via pre-commit hook |

**Package manager:** Yarn only (`engine-strict` in `.npmrc`). Do not use npm.

## Architecture

```
Browser (GitHub Pages)
  ├── Static HTML pages (root *.html)
  ├── assets/css/main-{timestamp}.css
  ├── assets/js/scripts-{timestamp}.js (single app script, ~8200 lines)
  ├── SEO: robots.txt, sitemap.xml, site.webmanifest
  └── CDN: Bootstrap 4.3, jQuery 3.3, Font Awesome 6.2, BaguetteBox, js-cookie

External APIs (Google Cloud Run, europe-west1)
  ├── getsalahtimes-*       → monthly salah times PDF/image URL
  ├── getiqamahtimes-*      → today's iqamah times + Jumuah schedule
  ├── getannouncements-*    → site-wide announcements ribbon
  ├── getnotices-*          → homepage notice board
  ├── getmasjidprogrammes-* → activities programmes (table + weekly cards)
  └── randomhadith-*        → daily hadith

Other third-party
  ├── api.mixlr.com         → live stream status and events (homepage + activities)
  ├── GoFundMe embed        → donation widgets (homepage + projects.html)
  ├── SumUp Payment Widget  → card donations via Firebase `createCheckout` (homepage + projects)
  └── Google Analytics      → gtag G-3H9CDDS71D (consent-gated)
```

## Critical: JS and CSS asset versioning

- Versioned files: `assets/js/scripts-{timestamp}.js`, `assets/css/main-{timestamp}.css`
- **Never manually edit** `<script src="assets/js/scripts-...">` or `<link href="assets/css/main...">` in HTML
- On commit, `yarn precommit` runs `gulp precommit`: renames changed JS/CSS and bumps version **only when** `assets/js/scripts-*.js` and/or `assets/css/main*.css` has git changes
- Edit the existing `scripts-*.js` and `main*.css` files in place during development
- `post-commit` hook amends the commit to include hook-generated changes

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

## Page-specific JS behaviour

Init is split between `DOMContentLoaded` and `window.onload`. Page routing uses pathname helpers and `setLocationSpecific()`.

| Page | DOMContentLoaded (page-specific) | window.onload (`setLocationSpecific`) |
|------|----------------------------------|---------------------------------------|
| `/` (index) | `showNotices`, `initHomeNotices`, `initHomePillars` | `setEvent`, `loadProgrammes` |
| `prayer-times.html` | `initPrayerTimesPage`, `initPrayerTimesPageMotion` | `initPrayerTimesPage` |
| `activities.html` | — | `setEvent`, `loadProgrammes` |
| `projects.html` | — | `initBaguetteBox` (`.grid-gallery`) |

**All pages** on `DOMContentLoaded`: announcements ribbon, nav salah panel, mobile nav, section nav dock, cookie consent, consent-gated embeds (maps), WhatsApp/back-to-top, footer year, page motion inits (about/contact/campaign/home donate as applicable), SumUp widget init.

**All pages** on `window.onload`: `setSalahTimeUrl`, `setSalahTimes`, `getRandomHadith`, `loadFundraiserProgress`, `setLocationSpecific`, `scrollToLocationHash`.

### localStorage cache keys

| Key | Purpose |
|-----|---------|
| `salahTimesAssetUrl` | Monthly timetable PDF/image URL |
| `iqamah-today` | Today's iqamah JSON |
| `kicc-announcements` | Announcements ribbon |
| `kicc-notices` | Homepage notices |
| `kicc-random-hadith` | Daily hadith |
| `masjidProgrammes_programme_active_true_v1` | Activities programmes |

## SEO and discoverability

- **`robots.txt`** — allows crawling; references sitemap
- **`sitemap.xml`** — all 7 public HTML pages at `https://traleemasjidkicc.ie/`
- **Per-page `<head>`** — unique `title`, `description`, `canonical`, Open Graph, Twitter Card, JSON-LD (`Mosque`/`Organization`, `WebPage`, `BreadcrumbList`; homepage also `WebSite`)
- **`site.webmanifest`** — PWA metadata (`start_url`, `scope`, theme colour `#0a8a8e`)
- **Apple home screen** — `apple-touch-icon`, `apple-mobile-web-app-*`, `theme-color` on all pages
- **Google Search Console** — property may be verified via DNS/Analytics; HTML meta tag on `index.html` may show as unused if not the active method

## Conventions

- **HTML:** Bootstrap 4 grid, shared nav/footer patterns, SRI on CDN assets, `lang="en-GB"`, descriptive `alt` on images
- **CSS:** single versioned `main-{timestamp}.css` — layout, theme, motion, campaign, prayer-times, page-specific sections
- **JS:** IIFE with `"use strict"`; `const` arrow functions; localStorage cache-then-fetch; defensive fetch error handling
- **Images:** under `assets/images/` (`brand/`, `backgrounds/`, `photos/`, `blueprints/`, `team/`, `ui/`)
- **Deployment:** `main` branch → GitHub Pages; custom domain via `CNAME` (`traleemasjidkicc.ie`)

## When editing

1. **Content (HTML):** edit directly; test with `yarn start`
2. **Styles:** edit `assets/css/main*.css`; BrowserSync hot-reloads; commit normally — hooks version the file
3. **Logic:** edit `assets/js/scripts-*.js`; commit normally — hooks version the file
4. **Dependencies:** `yarn upgrade <pkg>`, test, commit lockfile
5. **Ramadan/Eid dates:** update hardcoded dates in `isRamadan()` / `isEid()` annually (currently 2026)
6. **Campaign page:** `projects.html` uses `campaign-*` CSS classes and GoFundMe iframes — match existing patterns
7. **New public page:** add to nav/footer, `sitemap.xml`, and full SEO head block (canonical, OG, JSON-LD)

## Pitfalls

- JS/CSS changes not visible → hard refresh (Cmd+Shift+R) or rely on commit hook renames
- API down → check localStorage cache keys in DevTools
- Do not bump `package.json` version manually — precommit hook handles it
- Hadith/announcement HTML from APIs uses `innerHTML` — only trusted backend sources
- Mixlr API failures are non-fatal; events section falls back gracefully
- E2E locally: run `yarn start` before `yarn test:e2e` (`pretest:e2e` checks port 3000)

## Key files

- `gulpfile.js` — serve, watch, rename-js, rename-css, update-html, setup-hooks
- `package.json` — scripts, version, devDependencies
- `playwright.config.js` — Edge e2e; CI starts BrowserSync on port 3000
- `tests/projects.spec.js` — New Masjid campaign page tests
- `assets/js/scripts-*.js` — all client-side logic
- `assets/css/main-*.css` — all styles including `campaign-*` and `prayer-times-*`
- `index.html`, `prayer-times.html`, `projects.html` — highest-traffic / feature-rich pages
- `robots.txt`, `sitemap.xml`, `site.webmanifest` — SEO/PWA root assets
- `pre-commit` / `post-commit` — git hook scripts (copy to `.git/hooks/` via `yarn setup-hooks`)
