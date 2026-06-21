# Copilot Instructions for Tralee Masjid Website

> See also [AGENTS.md](../AGENTS.md) and [README.md](../README.md) for architecture diagrams and local setup.

## Project Overview

Static GitHub Pages website for Kerry Islamic Cultural Centre (Tralee Mosque). Built with vanilla HTML/CSS/JS, Bootstrap 4.3, and automated asset management via Gulp.

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
yarn ci          # Clean install with --immutable (Yarn 4 frozen lockfile), then starts dev server
yarn verify      # Verify install integrity (--immutable --check-cache)
yarn start       # Serve locally on http://localhost:3000 with live reload (BrowserSync)
yarn setup-hooks # Install pre-commit / post-commit hooks
yarn precommit   # Renames changed JS/CSS + bumps version when scripts-*.js or main*.css changed
```

## Project Structure

```
assets/
  ├── css/
  │   └── main-*.css      # Versioned core styling, motion, campaign components
  ├── images/
  │   ├── brand/          # Logo, Bismillah text, decorative quotes
  │   ├── backgrounds/    # CSS hero and section backgrounds
  │   ├── photos/         # Site and building photography
  │   ├── blueprints/     # 3D renders, site plans, construction updates
  │   ├── posters/        # Event/announcement posters
  │   ├── team/           # Staff/volunteer photos
  │   └── ui/             # UI elements (e.g. newsletter signup)
  └── js/
      └── scripts-*.js    # Versioned main app logic (~1200 lines)

index.html, about.html, activities.html, madrasa.html,
projects.html (New Masjid campaign), contact.html

gulpfile.js             # Gulp task configuration
package.json            # Dependencies: gulp, browser-sync, gulp-replace
site.webmanifest        # PWA manifest
CNAME                   # GitHub Pages custom domain
```

## Pages

| File | Nav label | Key features |
|------|-----------|--------------|
| `index.html` | Home | Prayer times, announcements, notices, Mixlr live events, hadith, GoFundMe |
| `activities.html` | Programmes | Programmes API, Mixlr events |
| `projects.html` | New Masjid | Donation campaign, GoFundMe goal bar, building gallery |
| `about.html` | — | History, team |
| `madrasa.html` | Madrasa | School info |
| `contact.html` | Contact | Location, contact |

## Critical JavaScript Functionality

The main script (`assets/js/scripts-*.js`) handles:

1. **Prayer times**: Salah timetable URL + today's iqamah (with Jumuah schedule rendering)
2. **Ramadan/Eid detection**: `isRamadan()` / `isEid()` for dynamic celebration banner
3. **Announcements & notices**: Cloud Run APIs with localStorage cache
4. **Programmes**: Activities page table and weekly programme cards
5. **Mixlr events**: Live stream status and upcoming events
6. **Hadith**: Daily random hadith with fallback content
7. **Global UI**: Footer year, cookie consent (js-cookie), WhatsApp float button, BaguetteBox gallery

**Init timing**:
- `DOMContentLoaded`: footer year, cookies, WhatsApp, homepage notices
- `window.onload`: salah/iqamah/hadith fetches, `setLocationSpecific()` page routing

**Key patterns**:
- IIFE wrapper: `(function() { "use strict"; ... })()` for scope isolation
- localStorage cache-then-fetch for all API responses
- Defensive error handling for external API calls

## Development Conventions

### Commit & Versioning

- Semantic versioning: Patch increments when JS changes (via `yarn version patch -i` in `gulp precommit`)
- Version lives in `package.json` and is incremented automatically
- **Do not manually edit version numbers** — let the hook handle it

### HTML Structure

- Bootstrap 4.3.1 grid system for responsive layouts
- Font Awesome 6.2.0 for icons (CDN)
- BaguetteBox 1.10.0 for image galleries (`.grid-gallery`)
- js-cookie 3.0.1 for cookie consent and modal preferences
- GoFundMe embed script on homepage and campaign page
- Custom CSS in `assets/css/` extends Bootstrap defaults

### External Dependencies

- Bootstrap, jQuery, Popper.js, Font Awesome, BaguetteBox, js-cookie loaded via CDN
- No build transpilation — ES6+ syntax in JS (assumes modern browser support)

## When Editing

### Adding Features

1. **Static content changes** (HTML): Edit directly, commit as usual
2. **Styling changes** (CSS): Edit `main.css`, test with `yarn start`
3. **JavaScript logic**: Edit `assets/js/scripts-*.js`, test with `yarn start`, commit naturally
4. **Campaign page**: Use existing `campaign-*` CSS classes; match patterns in `projects.html`

### Dependency Updates

- Dependencies locked in `yarn.lock` via `yarn ci` (`yarn install --immutable`)
- To update: `yarn upgrade [package]`, test locally, commit
- Ensure `yarn verify` passes before merging

### Testing

- Manual browser testing via `yarn start` (serves on localhost)
- BrowserSync auto-reloads on file changes
- Check network requests (Cloud Run APIs, Mixlr) in DevTools
- Hard refresh (Cmd+Shift+R) if JS changes don't appear before commit

## Common Pitfalls

1. **JS not reloading**: Clear browser cache or hard refresh; commit hook renames file on commit
2. **Script reference mismatch**: Hooks fix HTML refs — never manually edit script src
3. **API failures**: Check localStorage fallback in DevTools Application tab
4. **Ramadan/Eid dates**: Must be updated annually in `isRamadan()` / `isEid()`

## Key Files to Reference

- [gulpfile.js](gulpfile.js) — Asset versioning, watch/serve logic
- [package.json](package.json) — Scripts, dependencies, version source
- [assets/js/scripts-*.js](assets/js/) — Main app logic
- [index.html](index.html) — Homepage structure and CDN references
- [projects.html](projects.html) — New Masjid donation campaign page
- [assets/css/main.css](assets/css/main.css) — Campaign and layout styles
