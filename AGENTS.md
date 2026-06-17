# Agent instructions — Tralee Masjid website

Static GitHub Pages site for Kerry Islamic Cultural Centre (Tralee Mosque). Vanilla HTML/CSS/JS with Bootstrap 4, Gulp for local dev, and timestamp-based JS cache busting on commit.

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
  ├── assets/js/scripts-{timestamp}.js (single bundled app script)
  └── CDN: Bootstrap 4, jQuery, Font Awesome, BaguetteBox

External APIs (Google Cloud Run, europe-west1)
  ├── getsalahtimes-*     → monthly salah times PDF/image URL
  ├── getiqamahtimes-*    → today's iqamah times
  ├── getannouncements-*  → homepage announcements
  ├── getnotices-*        → homepage notices
  ├── getmasjidprogrammes-* → activities programmes
  └── randomhadith-*      → daily hadith
```

## Critical: JS asset versioning

- One versioned file: `assets/js/scripts-{timestamp}.js`
- **Never manually edit** `<script src="assets/js/scripts-...">` in HTML
- On commit, `yarn precommit` runs `gulp rename-js` (new timestamp + updates all HTML) and bumps `package.json` patch version
- Edit the existing `scripts-*.js` file in place during development

## Page-specific JS behaviour

`setLocationSpecific()` and `DOMContentLoaded` branch on `window.location.href`:

| Page | Key init |
|------|----------|
| `/` (index) | pillars, sign-up modal, announcements, events, notices, salah/iqamah |
| `activities.html` | events, programmes |
| `projects.html` | BaguetteBox gallery |
| All pages | footer year, cookie policy, WhatsApp button |

## Conventions

- **HTML:** Bootstrap 4 grid, shared nav/footer patterns across pages, SRI on CDN assets
- **CSS:** `main.css` for layout/theme; `animations.css` for motion
- **JS:** IIFE with `"use strict"`; `const` arrow functions; localStorage caching for API responses; defensive fetch error handling
- **Images:** under `assets/images/` (backgrounds, masjid, posters, team, etc.)
- **Deployment:** `main` branch → GitHub Pages; custom domain via `CNAME` (`traleemasjidkicc.ie`)

## When editing

1. **Content (HTML):** edit directly; test with `yarn start`
2. **Styles:** edit CSS; BrowserSync hot-reloads
3. **Logic:** edit `assets/js/scripts-*.js`; commit normally — hooks version the file
4. **Dependencies:** `yarn upgrade <pkg>`, test, commit lockfile
5. **Ramadan/Eid dates:** update hardcoded dates in `isRamadan()` / `isEid()` annually

## Pitfalls

- JS changes not visible → hard refresh (Cmd+Shift+R) or rely on commit hook renames
- API down → check localStorage cache keys in DevTools
- Do not bump `package.json` version manually — precommit hook handles it
- `post-commit` hook amends the commit to include hook-generated changes

## Key files

- `gulpfile.js` — serve, watch, rename-js, update-html
- `package.json` — scripts, version, devDependencies
- `assets/js/scripts-*.js` — all client-side logic (~1200 lines)
- `index.html` — homepage template and CDN references
- `pre-commit` / `post-commit` — git hook scripts (copy to `.git/hooks/` if missing)
