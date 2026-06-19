# Agent instructions — Tralee Masjid website

Static GitHub Pages site for Kerry Islamic Cultural Centre (Tralee Mosque). Vanilla HTML/CSS/JS with Bootstrap 4.3, Gulp for local dev, and timestamp-based JS cache busting on commit.

## Quick reference

| Task | Command |
|------|---------|
| Install deps | `yarn ci` |
| Install git hooks | `yarn setup-hooks` |
| Local dev server | `yarn start` → http://localhost:3000 |
| Verify node_modules | `yarn verify` |
| Commit (hooks run automatically) | `git commit` — runs `yarn precommit` via pre-commit hook |

**Package manager:** Yarn only (`engine-strict` in `.npmrc`). Do not use npm.

## Architecture

```
Browser (GitHub Pages)
  ├── Static HTML pages (root *.html)
  ├── assets/css/ (main.css, animations.css)
  ├── assets/js/scripts-{timestamp}.js (single bundled app script, ~1200 lines)
  └── CDN: Bootstrap 4.3, jQuery 3.3, Font Awesome 6.2, BaguetteBox, js-cookie

External APIs (Google Cloud Run, europe-west1)
  ├── getsalahtimes-*     → monthly salah times PDF/image URL
  ├── getiqamahtimes-*    → today's iqamah times + Jumuah schedule
  ├── getannouncements-*  → homepage announcements banner
  ├── getnotices-*        → homepage notice board
  ├── getmasjidprogrammes-* → activities programmes (table + weekly cards)
  └── randomhadith-*      → daily hadith

Other third-party
  ├── api.mixlr.com       → live stream status and events (homepage + activities)
  ├── GoFundMe embed      → donation widgets (homepage + projects.html)
  └── Google Analytics    → gtag G-3H9CDDS71D
```

## Critical: JS asset versioning

- One versioned file: `assets/js/scripts-{timestamp}.js`
- **Never manually edit** `<script src="assets/js/scripts-...">` in HTML
- On commit, `yarn precommit` runs `gulp precommit`: renames JS and bumps version **only when** `assets/js/scripts-*.js` has git changes
- Edit the existing `scripts-*.js` file in place during development
- `post-commit` hook amends the commit to include hook-generated changes

## Page-specific JS behaviour

Init is split between `DOMContentLoaded` and `window.onload`. Page routing uses `window.location.href` in `setLocationSpecific()`.

| Page | File | Nav label | DOMContentLoaded | window.onload |
|------|------|-----------|------------------|---------------|
| `/` (index) | `index.html` | Home | notices | sign-up modal, announcements, Mixlr events |
| `activities.html` | activities.html | Programmes | — | Mixlr events, programmes API |
| `projects.html` | projects.html | New Masjid | — | BaguetteBox gallery |
| All pages | — | — | footer year, cookie policy, WhatsApp button | salah URL, iqamah times, hadith |

### localStorage cache keys

| Key | Purpose |
|-----|---------|
| `salahTimesAssetUrl` | Monthly timetable PDF/image URL |
| `iqamah-today` | Today's iqamah JSON |
| `kicc-announcements` | Homepage announcements |
| `kicc-notices` | Homepage notices |
| `kicc-random-hadith` | Daily hadith |
| `masjidProgrammes_programme_active_true_v1` | Activities programmes |

## Conventions

- **HTML:** Bootstrap 4 grid, shared nav/footer patterns across pages, SRI on CDN assets, `lang="en-GB"`
- **CSS:** `main.css` for layout/theme/campaign components; `animations.css` for motion
- **JS:** IIFE with `"use strict"`; `const` arrow functions; localStorage cache-then-fetch; defensive fetch error handling
- **Images:** under `assets/images/` (`backgrounds/`, `bp/`, `masjid/`, `posters/`, `team/`)
- **Deployment:** `main` branch → GitHub Pages; custom domain via `CNAME` (`traleemasjidkicc.ie`)

## When editing

1. **Content (HTML):** edit directly; test with `yarn start`
2. **Styles:** edit CSS; BrowserSync hot-reloads
3. **Logic:** edit `assets/js/scripts-*.js`; commit normally — hooks version the file
4. **Dependencies:** `yarn upgrade <pkg>`, test, commit lockfile
5. **Ramadan/Eid dates:** update hardcoded dates in `isRamadan()` / `isEid()` annually (currently 2026)
6. **Campaign page:** `projects.html` uses `campaign-*` CSS classes and GoFundMe iframes — match existing patterns in `main.css`

## Pitfalls

- JS changes not visible → hard refresh (Cmd+Shift+R) or rely on commit hook renames
- API down → check localStorage cache keys in DevTools
- Do not bump `package.json` version manually — precommit hook handles it
- Hadith/announcement HTML from APIs uses `innerHTML` — only trusted backend sources
- Mixlr API failures are non-fatal; events section falls back gracefully

## Key files

- `gulpfile.js` — serve, watch, rename-js, update-html, setup-hooks
- `package.json` — scripts, version, devDependencies
- `assets/js/scripts-*.js` — all client-side logic
- `index.html` — homepage template, CDN references, GoFundMe widgets
- `projects.html` — New Masjid donation campaign page
- `assets/css/main.css` — includes `campaign-*` component styles
- `pre-commit` / `post-commit` — git hook scripts (copy to `.git/hooks/` via `yarn setup-hooks`)
