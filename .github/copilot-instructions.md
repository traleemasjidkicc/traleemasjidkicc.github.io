# Copilot Instructions for Tralee Masjid Website

## Project Overview
This is a static GitHub Pages website for Kerry Islamic Cultural Centre (Tralee Mosque). Built with vanilla HTML/CSS/JS, Bootstrap 4, and automated asset management via Gulp.

## Architecture & Key Patterns

### Asset Versioning Strategy
**Critical workflow**: JavaScript files use timestamp-based versioning (`scripts-{timestamp}.js`) to prevent browser caching issues.

- All HTML files reference the JS asset with a glob pattern: `<script defer type="text/javascript" src="assets/js/scripts-{timestamp}.js"></script>`
- Before commits, the `yarn precommit` hook runs `gulp rename-js` which:
  1. Generates new timestamp filename
  2. Renames the physical JS file in `assets/js/`
  3. Updates all HTML files with the new reference
- **When modifying JS**: Always run `yarn start` to preview changes (Gulp watches and hot-reloads), then commit naturally—the hooks handle versioning automatically
- **When modifying HTML**: Manual edits work fine; hooks only update script references during commits

### Build & Development Workflow
```
yarn ci          # Install dependencies (frozen lockfile - production-safe)
yarn start       # Serve locally on http://localhost:3000 with live reload (Browser Sync)
yarn precommit   # Runs rename-js, update-html, patches version in package.json
```

The git hooks (`./.git/hooks/pre-commit`, `./.git/hooks/post-commit`) ensure:
- `pre-commit`: Executes `yarn precommit` to version assets, then stages changes
- `post-commit`: Amendments commit with final staged state

## Project Structure

```
assets/
  ├── css/
  │   ├── main.css        # Core styling (grid, layout)
  │   └── animations.css  # Animations & transitions
  ├── images/
  │   ├── backgrounds/    # Hero & section backgrounds
  │   ├── bp/            # Best practices or content images
  │   ├── masjid/        # Building photos
  │   ├── posters/       # Event/announcement posters
  │   └── team/          # Staff/volunteer photos
  └── js/
      └── scripts-*.js    # Versioned main app logic

index.html, about.html, contact.html, etc.  # Static content pages
gulpfile.js             # Gulp task configuration
package.json            # Dependencies: gulp, browser-sync, gulp-replace
site.webmanifest        # PWA manifest
CNAME                   # GitHub Pages custom domain
```

## Critical JavaScript Functionality

The main script (`assets/js/scripts-*.js`, ~1076 lines) handles:

1. **Ramadan Detection**: Determines if today falls within Ramadan dates for UI/banner logic
2. **Prayer Times Integration**: Fetches salah times from external Cloud Run API (`getsalahtimes-rds3nxm6za-ew.a.run.app`), with localStorage caching
3. **Footer Year**: Auto-updates copyright year dynamically
4. **Date Utilities**: Helper functions for date calculations (isToday, addDays, etc.)

**Key patterns**:
- IIFE wrapper: `(function() { "use strict"; ... })()` for scope isolation
- localStorage caching for performance
- Defensive error handling for external API calls

## Development Conventions

### Commit & Versioning
- Semantic versioning: Patch increments on every commit (via `--patch` flag in `yarn precommit`)
- Version lives in `package.json` and is incremented automatically
- **Do not manually edit version numbers**—let the hook handle it

### HTML Structure
- Bootstrap 4 grid system for responsive layouts
- Font Awesome 6.2.0 for icons (CDN)
- BaguetteBox 1.10.0 for image galleries
- Custom CSS in `assets/css/` extends Bootstrap defaults

### External Dependencies
- Bootstrap, jQuery, Popper.js, Font Awesome, BaguetteBox all loaded via CDN
- No build transpilation—ES6+ syntax in JS (assumes modern browser support)

## When Editing

### Adding Features
1. **Static content changes** (HTML): Edit directly, commit as usual
2. **Styling changes** (CSS): Edit `main.css` or `animations.css`, test with `yarn start`
3. **JavaScript logic**: Edit `assets/js/scripts-*.js`, test with `yarn start`, commit naturally
   - Hooks will auto-version the file on commit

### Dependency Updates
- Dependencies locked in `yarn.lock` via `yarn ci --frozen-lockfile`
- To update: `yarn upgrade [package]`, test locally, commit
- Ensure `yarn verify` passes before merging

### Testing
- Manual browser testing via `yarn start` (serves on localhost)
- Browser Sync auto-reloads on file changes
- Check network requests (especially salah times API) in DevTools

## Common Pitfalls

1. **JS not reloading**: Clear browser cache or hard refresh (Cmd+Shift+R on Mac)
2. **Script reference mismatch**: If HTML and JS filename don't match, the hooks fix it—never manually edit script src
3. **Forgotten `yarn start`**: Required to see CSS/JS changes locally; hot-reload won't work without it
4. **API failures**: Salah times API may be unavailable; check localStorage fallback in console

## Key Files to Reference

- [gulpfile.js](gulpfile.js) — Asset versioning, watch/serve logic
- [package.json](package.json) — Scripts, dependencies, version source
- [assets/js/scripts-*.js](assets/js/) — Main app logic (Ramadan, prayer times, utilities)
- [index.html](index.html) — Homepage structure and external CDN references
