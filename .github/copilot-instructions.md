# Copilot Instructions for Tralee Masjid Website

> See also [AGENTS.md](../AGENTS.md) and [README.md](../README.md) for architecture diagrams and local setup.

## Project Overview

Static GitHub Pages website for Kerry Islamic Cultural Centre (Tralee Masjid). Built with vanilla HTML/CSS/JS, Bootstrap 4.3, Gulp + BrowserSync for local dev, automated JS/CSS versioning on commit, and Playwright e2e tests.

**Live site:** https://traleemasjidkicc.ie

## Architecture & Key Patterns

### Asset Versioning Strategy

**Critical workflow**: JavaScript and main CSS use timestamp-based versioning to prevent browser caching issues.

- JS: `<script defer type="text/javascript" src="assets/js/scripts-{timestamp}.js"></script>`
- Main CSS: `<link rel="stylesheet" href="assets/css/main-{timestamp}.css">`
- Before commits, `yarn precommit` (`gulp precommit`) renames changed assets and updates HTML:
  1. Generates new timestamp filename(s) for changed JS and/or main CSS
  2. Renames the physical file(s) in `assets/js/` and/or `assets/css/`
  3. Updates all HTML files with the new reference(s)
  4. Bumps `package.json` patch version (once, if either asset changed)
- `post-commit` hook amends the commit to include staged hook output
- **When modifying JS or main CSS**: Always run `yarn start` to preview changes, then commit naturally — hooks handle versioning
- **When modifying HTML**: Manual edits work fine; hooks only update script/stylesheet references during commits

### Build & Development Workflow

```
yarn ci              # Clean install with --immutable (Yarn 4), then starts dev server
yarn verify          # Verify install integrity (--immutable --check-cache)
yarn start           # Serve locally on http://localhost:3000 with live reload (BrowserSync)
yarn setup-hooks     # Install pre-commit / post-commit hooks
yarn precommit       # Renames changed JS/CSS + bumps version when scripts-*.js or main*.css changed
yarn test:e2e        # Playwright tests (requires yarn start running locally)
yarn test:e2e:headed # Headed browser run
yarn test:e2e:ui     # Playwright UI mode
```

## Project Structure

```
assets/
  ├── css/
  │   └── main-*.css      # Versioned: layout, theme, motion, campaign, prayer-times, page sections
  ├── images/
  │   ├── brand/          # Logo, Bismillah, GoFundMe QR
  │   ├── backgrounds/    # Hero and section backgrounds
  │   ├── photos/         # Site and building photography
  │   ├── blueprints/     # 3D renders, site plans, construction updates
  │   ├── team/           # Staff/volunteer photos
  │   └── ui/             # UI elements (e.g. newsletter signup)
  └── js/
      └── scripts-*.js    # Versioned main app logic (~11,400 lines)

index.html, about.html, activities.html, madrasa.html,
projects.html, contact.html, prayer-times.html
404.html, 403.html, 500.html   # Themed error pages (404 auto-served by GitHub Pages)

scripts/build-error-pages.js   # Regenerates error pages from contact.html chrome

gulpfile.js             # Gulp task configuration
playwright.config.js    # E2E test config (Edge, port 3000)
tests/                  # 142 Playwright e2e tests (13 specs + helpers/site.js)
robots.txt              # Crawler rules + sitemap reference
sitemap.xml             # All public pages
site.webmanifest        # PWA manifest (theme, icons, start_url)
CNAME                   # GitHub Pages custom domain
AGENTS.md               # Primary AI agent instructions
.cursor/rules/          # Cursor IDE scoped rules
```

## Pages

| File | Nav label | Key features |
|------|-----------|--------------|
| `index.html` | Home | Prayer deck, nav salah dropdown, announcements, notices, programmes preview, Mixlr, hadith, GoFundMe, SumUp |
| `prayer-times.html` | Salah times | Day/week/month timetable, month tabs, print PDF sheet, visit CTA |
| `activities.html` | Programmes | Programmes API, Mixlr live hub, weekly schedule |
| `projects.html` | New Masjid | Donation campaign, GoFundMe goal bar, SumUp, building gallery |
| `about.html` | — | History, vision, team |
| `madrasa.html` | Madrasa | Children's madrasa info and registration |
| `contact.html` | Contact | Imams, management, consent-gated Google Maps embed, directions |

**Error pages:** `404.html` (GitHub Pages serves for missing URLs), `403.html`, `500.html`. Not in nav or `sitemap.xml`. Regenerate with `yarn build:error-pages` after nav/footer changes on `contact.html`.

## Critical JavaScript Functionality

The main script (`assets/js/scripts-*.js`) handles:

1. **Prayer times**: Nav salah panel, homepage prayer deck, full `prayer-times.html` page, monthly PDF URL, iqamah + Jumuah
2. **Ramadan/Eid detection**: `isRamadan()` / `isEid()` for dynamic celebration banner
3. **Announcements & notices**: Cloud Run APIs with localStorage cache; site-wide ribbon + homepage notice board
4. **Programmes**: Homepage preview + activities page table and weekly programme cards
5. **Mixlr events**: Live stream status and upcoming events
6. **Hadith**: Daily random hadith with fallback content
7. **Donations**: GoFundMe progress widgets, SumUp checkout (Firebase `createCheckout`)
8. **Global UI**: Mobile nav, section nav dock, cookie/consent management, consent-gated map embeds, WhatsApp float, BaguetteBox gallery, print timetable

**Init timing**:
- `DOMContentLoaded`: shared chrome (nav, cookies, announcements, embeds); page-specific notices/home pillars/prayer-times page
- `window.onload`: salah/iqamah/hadith/fundraiser fetches, `setLocationSpecific()` page routing

**Key patterns**:
- IIFE wrapper: `(function() { "use strict"; ... })()` for scope isolation
- Pathname helpers: `isHomePage()`, `isPrayerTimesPage()`, etc.
- localStorage cache-then-fetch for all API responses
- Defensive error handling for external API calls

## SEO

Each HTML page includes unique `title`, `description`, `canonical`, Open Graph, Twitter Card, and JSON-LD structured data. Root assets:

- `robots.txt` → `Sitemap: https://traleemasjidkicc.ie/sitemap.xml`
- `sitemap.xml` — lists all 7 pages
- `site.webmanifest` + `theme-color` + Apple home-screen meta tags

When adding a new public page, update navigation, footer, and `sitemap.xml`.

## Development Conventions

### Commit & Versioning

- Patch increments when JS or CSS changes (via `yarn version patch -i` in `gulp precommit`)
- Version lives in `package.json` and is incremented automatically
- **Do not manually edit version numbers** — let the hook handle it

### HTML Structure

- Bootstrap 4.3.1 grid system for responsive layouts
- Font Awesome 6.2.0 for icons (CDN)
- BaguetteBox 1.10.0 for image galleries (`.grid-gallery`)
- js-cookie 3.0.1 for cookie consent and modal preferences
- GoFundMe embed script on homepage and campaign page
- Custom CSS in versioned `main-*.css` extends Bootstrap defaults
- Nav link to `projects.html` is labelled **New Masjid** (not "Projects")

### External Dependencies

- Bootstrap, jQuery, Popper.js, Font Awesome, BaguetteBox, js-cookie loaded via CDN
- No build transpilation — ES6+ syntax in JS (assumes modern browser support)

## When Editing

### Adding Features

1. **Static content changes** (HTML): Edit directly, commit as usual; keep SEO head tags unique per page
2. **Styling changes** (CSS): Edit `main-*.css` in place, test with `yarn start`
3. **JavaScript logic**: Edit `assets/js/scripts-*.js`, test with `yarn start`, commit naturally
4. **Campaign page**: Use existing `campaign-*` CSS classes; match patterns in `projects.html`
5. **Prayer times page**: Use `prayer-times-*` and `data-prayer-*` attributes; extend `initPrayerTimesPage()`

### Dependency Updates

- Dependencies locked in `yarn.lock` via `yarn ci` (`yarn install --immutable`)
- To update: `yarn upgrade [package]`, test locally, commit
- Ensure `yarn verify` passes before merging

### Testing

- Manual browser testing via `yarn start` (serves on localhost:3000)
- BrowserSync auto-reloads on file changes
- E2E: `yarn start` then `yarn test:e2e` (or CI runs BrowserSync automatically)
- Check network requests (Cloud Run APIs, Mixlr) in DevTools
- Hard refresh (Cmd+Shift+R) if JS changes don't appear before commit

## Common Pitfalls

1. **JS not reloading**: Clear browser cache or hard refresh; commit hook renames file on commit
2. **Script/CSS reference mismatch**: Hooks fix HTML refs — never manually edit versioned filenames in HTML
3. **API failures**: Check localStorage fallback in DevTools Application tab
4. **Ramadan/Eid dates**: Must be updated annually in `isRamadan()` / `isEid()`
5. **E2E without server**: `pretest:e2e` fails if port 3000 is not serving the site

## Key Files to Reference

- [gulpfile.js](gulpfile.js) — Asset versioning, watch/serve logic
- [package.json](package.json) — Scripts, dependencies, version source
- [playwright.config.js](playwright.config.js) — E2E configuration
- [assets/js/scripts-*.js](assets/js/) — Main app logic
- [assets/css/main-*.css](assets/css/) — All styles
- [index.html](index.html) — Homepage structure and CDN references
- [prayer-times.html](prayer-times.html) — Salah timetable page
- [projects.html](projects.html) — New Masjid donation campaign page
- [sitemap.xml](sitemap.xml) — Search engine page list
