# Tralee Masjid — Kerry Islamic Cultural Centre

<p align="center">
  <img src="assets/images/brand/logo.png" alt="Kerry Islamic Cultural Centre logo" width="160">
</p>

<p align="center">
  <strong>Official website for Kerry Islamic Cultural Centre (Tralee Masjid)</strong><br>
  Serving the religious, cultural, and social needs of Muslims in Tralee and County Kerry, Ireland.
</p>

<p align="center">
  <a href="https://traleemasjidkicc.ie"><strong>traleemasjidkicc.ie</strong></a>
  &nbsp;·&nbsp;
  <a href="https://traleemasjidkicc.ie/prayer-times.html">Prayer times</a>
  &nbsp;·&nbsp;
  <a href="https://traleemasjidkicc.ie/projects.html">New Masjid appeal</a>
  &nbsp;·&nbsp;
  <a href="https://traleemasjidkicc.ie/contact.html">Contact</a>
</p>

<p align="center">
  <img src="assets/images/photos/community-centre-exterior.jpg" alt="Kerry Islamic Cultural Centre building exterior" width="720">
</p>

---

## Table of contents

- [About this project](#about-this-project)
- [What the website offers](#what-the-website-offers)
- [Pages](#pages)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Development workflow](#development-workflow)
- [JS & CSS asset versioning](#js--css-asset-versioning)
- [Testing](#testing)
- [External APIs & services](#external-apis--services)
- [SEO, PWA & discoverability](#seo-pwa--discoverability)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [AI assistant context](#ai-assistant-context)
- [License](#license)

---

## About this project

This repository powers the public website for **Kerry Islamic Cultural Centre (KICC)**, commonly known as **Tralee Masjid**. The site is a **static [GitHub Pages](https://pages.github.com/)** project: HTML, CSS, and JavaScript files are served directly from the `main` branch — there is **no production build step**.

Local development uses **[Gulp](https://gulpjs.com/)** and **[BrowserSync](https://browsersync.io/)** for live reload. Dynamic content (prayer times, announcements, programmes, hadith) is fetched in the browser from **Google Cloud Run** APIs and cached in `localStorage` for resilience.

| | |
|---|---|
| **Live URL** | [https://traleemasjidkicc.ie](https://traleemasjidkicc.ie) |
| **Hosting** | GitHub Pages (`main` branch) |
| **Custom domain** | `CNAME` → `traleemasjidkicc.ie` |
| **Address** | Killerisk Business Centre, Tralee, Co. Kerry V92 N6YR |
| **Email** | [info@traleemasjidkicc.ie](mailto:info@traleemasjidkicc.ie) |
| **Package manager** | **Yarn 4** only (npm is blocked) |

---

## What the website offers

| Feature | Where | How it works |
|---------|-------|--------------|
| **Today's salah & iqamah** | Nav dropdown, homepage deck | Cloud Run `getiqamahtimes` + cache |
| **Full prayer timetable** | [`prayer-times.html`](prayer-times.html) | Day / week / month views, print-friendly PDF sheet |
| **Monthly timetable PDF** | Nav, prayer times page | Cloud Run `getsalahtimes` |
| **Announcements ribbon** | All pages | Cloud Run `getannouncements` |
| **Notice board** | Homepage | Cloud Run `getnotices` |
| **Weekly programmes** | Homepage preview, [`activities.html`](activities.html) | Cloud Run `getmasjidprogrammes` |
| **Daily hadith** | All pages (footer area) | Cloud Run `randomhadith` |
| **Live stream & events** | Homepage, Programmes | [Mixlr](https://traleemasjid.mixlr.com/) API |
| **Donations** | Homepage, [`projects.html`](projects.html) | GoFundMe embed + SumUp card checkout |
| **New Masjid campaign** | [`projects.html`](projects.html) | Progress gallery, blueprints, funding breakdown |
| **Children's madrasa** | [`madrasa.html`](madrasa.html) | Registration via WhatsApp |
| **Contact & directions** | [`contact.html`](contact.html) | Consent-gated Google Maps embed |
| **Add to Home Screen** | Mobile | `site.webmanifest` + Apple meta tags |

<p align="center">
  <img src="assets/images/blueprints/render-front-elevation.png" alt="Architectural render of the planned Tralee Masjid front elevation" width="480">
  &nbsp;&nbsp;
  <img src="assets/images/photos/site-wide.jpg" alt="Aerial view of the Kerry Islamic Cultural Centre site" width="480">
</p>
<p align="center"><em>Planned masjid front elevation and site overview — see the <a href="https://traleemasjidkicc.ie/projects.html">New Masjid appeal</a> for full progress and donation details.</em></p>

---

## Pages

Seven public HTML pages live at the repository root. Navigation labels match what visitors see in the menu.

| Page | File | Nav label | Summary |
|------|------|-----------|---------|
| **Home** | [`index.html`](index.html) | Home | Hero, prayer deck, announcements, notices, programmes preview, Mixlr, hadith, donate |
| **Prayer times** | [`prayer-times.html`](prayer-times.html) | Salah times | Full adhan & iqamah timetable; day, week, and month views; printable sheet |
| **Programmes** | [`activities.html`](activities.html) | Programmes | Weekly schedule, live talks hub, programme cards from API |
| **New Masjid** | [`projects.html`](projects.html) | New Masjid | Lillah appeal, GoFundMe progress, SumUp, construction photos & blueprints |
| **About** | [`about.html`](about.html) | — | History since 1988, vision, team |
| **Madrasa** | [`madrasa.html`](madrasa.html) | Madrasa | Evening Islamic school for children |
| **Contact** | [`contact.html`](contact.html) | Contact | Imams, management, map, phone, WhatsApp, email |

Footer links also include **Salah timetable** → `prayer-times.html`.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Markup** | Static HTML5, `lang="en-GB"`, Bootstrap 4.3 grid |
| **Styles** | Single versioned CSS file (`main-{timestamp}.css`) — layout, theme, motion, page sections |
| **Logic** | Single versioned JS file (`scripts-{timestamp}.js`, ~8 200 lines, IIFE, ES6+) |
| **Icons** | Font Awesome 6.2 (CDN) |
| **Gallery** | BaguetteBox 1.10 (CDN) |
| **Cookies** | js-cookie 3.0 (CDN) |
| **Local dev** | Gulp 4 + BrowserSync (port **3000**) |
| **E2E tests** | Playwright 1.60 (Microsoft Edge) |
| **Analytics** | Google Analytics `G-3H9CDDS71D` (consent-gated) |
| **Deployment** | GitHub Pages — no CI build; files served as committed |

**Intentionally not used:** React, Vue, bundlers, TypeScript, or a production transpilation step.

---

## Architecture

### High-level diagram

```mermaid
flowchart TB
    subgraph Browser["Visitor browser"]
        HTML["7 × static HTML pages"]
        CSS["main-{timestamp}.css"]
        JS["scripts-{timestamp}.js"]
        CDN["CDN: Bootstrap, jQuery, FA, BaguetteBox, js-cookie"]
        Embed["GoFundMe · SumUp · Mixlr · gtag"]
    end

    subgraph GitHub["GitHub Pages"]
        GH["main → traleemasjidkicc.ie"]
    end

    subgraph Backend["External services"]
        CR["Cloud Run APIs (europe-west1)"]
        MX["api.mixlr.com"]
        FB["Firebase createCheckout (SumUp)"]
    end

    HTML --> GH
    CSS --> GH
    JS --> GH
    JS --> CR
    JS --> MX
    JS --> FB
    CDN --> Browser
    Embed --> Browser
```

### Homepage request flow

When someone opens the homepage, the single app script runs in two phases:

```mermaid
sequenceDiagram
    participant U as User
    participant P as GitHub Pages
    participant J as scripts-*.js
    participant LS as localStorage
    participant API as Cloud Run
    participant MX as Mixlr

    U->>P: Load index.html
    P->>J: DOMContentLoaded
    J->>J: Nav, cookies, WhatsApp, announcements ribbon
    J->>API: getnotices
    API-->>J: notices JSON
    J->>U: Render notice board

    P->>J: window.onload
    J->>LS: Read cached salah / iqamah / hadith
    LS-->>J: Cached JSON (if any)
    J->>U: Show cached times immediately
    par Parallel fetches
        J->>API: getsalahtimes (monthly PDF URL)
        J->>API: getiqamahtimes (today + Jumuah)
        J->>API: randomhadith
        J->>MX: Live events / stream status
    end
    API-->>J: Fresh JSON
    MX-->>J: Events
    J->>LS: Update cache
    J->>U: Refresh DOM
```

### Client-side init timing

| Event | All pages | Page-specific extras |
|-------|-----------|----------------------|
| **`DOMContentLoaded`** | Footer year, cookie bar, announcements ribbon, nav salah panel, mobile nav, section nav dock, consent embeds, WhatsApp, back-to-top | **Home:** notices · **Prayer times:** timetable UI + motion |
| **`window.onload`** | Salah URL, iqamah times, hadith, fundraiser progress | **Home / Programmes:** Mixlr + programmes · **New Masjid:** BaguetteBox gallery · **Prayer times:** timetable refresh |

---

## Project structure

```
traleemasjidkicc.github.io/
├── index.html                 # Homepage
├── prayer-times.html          # Full salah timetable
├── activities.html            # Programmes
├── projects.html              # New Masjid donation campaign
├── about.html
├── madrasa.html
├── contact.html
│
├── assets/
│   ├── css/
│   │   └── main-*.css         # Versioned stylesheet (edit in place)
│   ├── js/
│   │   └── scripts-*.js       # Versioned app logic (~8 200 lines)
│   └── images/
│       ├── brand/             # Logo, Bismillah, GoFundMe QR
│       ├── backgrounds/       # Hero backgrounds
│       ├── photos/            # Building & site photography
│       ├── blueprints/        # Renders, plans, construction updates
│       ├── team/              # Team photos
│       └── ui/                # UI illustrations
│
├── tests/
│   └── projects.spec.js       # Playwright e2e (New Masjid page)
│
├── robots.txt                 # Crawler rules + sitemap URL
├── sitemap.xml                # All public pages for search engines
├── site.webmanifest           # PWA / Add to Home Screen metadata
├── CNAME                      # traleemasjidkicc.ie
├── gulpfile.js                # Dev server + asset versioning tasks
├── playwright.config.js       # E2E test configuration
├── package.json               # Scripts & devDependencies
├── pre-commit / post-commit   # Git hooks (copy via yarn setup-hooks)
│
├── AGENTS.md                  # AI agent instructions
├── .cursor/rules/             # Cursor IDE scoped rules
└── .github/copilot-instructions.md
```

---

## Getting started

### Prerequisites

- **[Node.js](https://nodejs.org/)** — LTS recommended
- **[Yarn](https://yarnpkg.com/)** ≥ 4.0.0 — required (`npm` is blocked via `engine-strict` in `.npmrc`)

### 1. Clone and install

```bash
git clone git@github.com:traleemasjidkicc/traleemasjidkicc.github.io.git
cd traleemasjidkicc.github.io

# Clean install from lockfile (also starts dev server via postci)
yarn ci
```

To install **without** auto-starting the dev server:

```bash
yarn install --immutable
```

### 2. Install git hooks (recommended)

Hooks automatically version JS/CSS files when you commit changes:

```bash
yarn setup-hooks
```

This copies `pre-commit` and `post-commit` into `.git/hooks/`.

### 3. Start the dev server

```bash
yarn start
```

Opens **[http://localhost:3000](http://localhost:3000)** with live reload. BrowserSync watches:

- `*.html`
- `assets/css/*.css`
- `assets/js/*.js`

### 4. Verify dependencies (optional)

Confirms `node_modules` matches `yarn.lock`:

```bash
yarn verify
```

---

## Development workflow

### Command reference

| Task | Command |
|------|---------|
| Install dependencies | `yarn ci` |
| Install git hooks | `yarn setup-hooks` |
| Start dev server | `yarn start` |
| Verify lockfile / cache | `yarn verify` |
| Run pre-commit tasks manually | `yarn precommit` |
| Commit (hooks run automatically) | `git commit` |
| E2E tests (server must be running) | `yarn test:e2e` |
| E2E with visible browser | `yarn test:e2e:headed` |
| E2E interactive UI | `yarn test:e2e:ui` |
| Open last E2E report | `yarn test:e2e:report` |

### What to edit

| Change type | File(s) | Notes |
|-------------|---------|-------|
| **Page content** | `*.html` at repo root | Preview with `yarn start` |
| **Styles** | `assets/css/main-*.css` (current timestamped file) | Hot-reloads in browser |
| **JavaScript** | `assets/js/scripts-*.js` (current timestamped file) | Commit triggers rename if changed |
| **Dependencies** | `package.json`, `yarn.lock` | `yarn upgrade <pkg>`, then test |
| **Ramadan / Eid banner** | `scripts-*.js` → `isRamadan()` / `isEid()` | Update dates annually (currently 2026) |
| **New public page** | HTML + nav + footer + `sitemap.xml` + SEO `<head>` | Copy meta pattern from an existing page |

### Important rules

- **Use Yarn only** — not npm.
- **Do not manually rename** `scripts-*.js` or `main-*.css`, and **do not edit** their `<script>` / `<link>` paths in HTML — git hooks handle versioning on commit.
- **Do not bump** `package.json` version manually — the pre-commit hook patches it when JS or CSS changes.
- Hard refresh (**Cmd+Shift+R**) if JS/CSS changes do not appear before committing.

---

## JS & CSS asset versioning

JavaScript and CSS use **timestamped filenames** so returning visitors always get fresh assets after a deploy.

```mermaid
flowchart LR
    A[Edit scripts-*.js or main-*.css] --> B[git commit]
    B --> C[pre-commit hook]
    C --> D{JS or CSS changed?}
    D -->|Yes| E[Rename file + update all HTML refs + patch version]
    D -->|No| F[Skip]
    E --> G[post-commit amends commit]
    F --> H[Push to GitHub Pages]
    G --> H
```

Example references in HTML (timestamps change on commit):

```html
<link rel="stylesheet" href="assets/css/main-1782019298767.css">
<script defer src="assets/js/scripts-1782019298633.js"></script>
```

---

## Testing

### Manual testing

1. Run `yarn start`
2. Open [http://localhost:3000](http://localhost:3000)
3. Check prayer times, announcements, and programmes load (Network tab in DevTools)
4. Test cookie consent → map embed on Contact page
5. Test mobile layout and nav

### Automated E2E (Playwright)

Tests live in [`tests/projects.spec.js`](tests/projects.spec.js) and cover the **New Masjid** campaign page (hero, section nav, gallery images, GoFundMe links, SumUp donate button).

**Locally** — dev server must already be running on port 3000:

```bash
# Terminal 1
yarn start

# Terminal 2
yarn test:e2e
```

`pretest:e2e` fails fast with a clear message if nothing is listening on port 3000.

**In CI** — Playwright starts its own BrowserSync server automatically (see [`playwright.config.js`](playwright.config.js)).

| Command | Purpose |
|---------|---------|
| `yarn test:e2e` | Headless Edge run |
| `yarn test:e2e:headed` | Visible browser |
| `yarn test:e2e:ui` | Playwright UI mode |
| `yarn test:e2e:report` | Open HTML report after a run |

---

## External APIs & services

### Google Cloud Run (`europe-west1`)

All masjid content is fetched client-side and cached in `localStorage`.

| Endpoint | Purpose | Cache key |
|----------|---------|-----------|
| `getsalahtimes-rds3nxm6za-ew.a.run.app` | Monthly timetable PDF/image URL | `salahTimesAssetUrl` |
| `getiqamahtimes-rds3nxm6za-ew.a.run.app` | Today's iqamah + Jumuah schedule | `iqamah-today` |
| `getannouncements-rds3nxm6za-ew.a.run.app` | Site-wide announcements ribbon | `kicc-announcements` |
| `getnotices-rds3nxm6za-ew.a.run.app` | Homepage notice board | `kicc-notices` |
| `getmasjidprogrammes-rds3nxm6za-ew.a.run.app` | Weekly programmes | `masjidProgrammes_programme_active_true_v1` |
| `randomhadith-rds3nxm6za-ew.a.run.app` | Daily hadith | `kicc-random-hadith` |

If an API is temporarily down, the site shows the last cached response where available.

### Other third-party services

| Service | Used for |
|---------|----------|
| [Mixlr](https://traleemasjid.mixlr.com/) (`api.mixlr.com`) | Live stream status and upcoming events |
| **GoFundMe embed** | Donation widgets on homepage and New Masjid page |
| **SumUp** via Firebase `createCheckout` | Card donations (homepage + projects) |
| **Google Analytics** (`G-3H9CDDS71D`) | Site analytics (loaded after consent) |
| **js-cookie** (CDN) | Cookie preferences and newsletter modal |
| **Google Maps** (embed) | Contact page map (loaded after functional cookie consent) |

---

## SEO, PWA & discoverability

The site is optimised for search engines and mobile home-screen installation.

| Asset / pattern | Purpose |
|-----------------|---------|
| [`robots.txt`](robots.txt) | Allows crawling; points to sitemap |
| [`sitemap.xml`](sitemap.xml) | Lists all 7 public pages at `https://traleemasjidkicc.ie/` |
| **Per-page `<head>`** | Unique `title`, `description`, `canonical`, Open Graph, Twitter Card |
| **JSON-LD** | `Mosque` / `Organization`, `WebPage`, `BreadcrumbList` (homepage also `WebSite`) |
| [`site.webmanifest`](site.webmanifest) | PWA name, icons, theme colour `#0a8a8e`, `start_url` |
| **Apple meta tags** | Home screen title, standalone mode, touch icon |
| **Root icons** | `favicon.ico`, `apple-touch-icon.png`, `android-chrome-*.png` |

After deploying structural changes, submit the sitemap in [Google Search Console](https://search.google.com/search-console):  
`https://traleemasjidkicc.ie/sitemap.xml`

---

## Deployment

1. Merge or push to the **`main`** branch.
2. GitHub Pages serves static files within a few minutes.
3. Custom domain **`traleemasjidkicc.ie`** is configured via [`CNAME`](CNAME).

There is **no build pipeline** — what you commit is what visitors receive. Remember that JS/CSS commits trigger filename renames via hooks, so always commit hook-generated changes together with your edits.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| JS or CSS changes not visible | Browser cache | Hard refresh (Cmd+Shift+R) or commit so hooks rename the file |
| `yarn test:e2e` fails immediately | Dev server not running | Run `yarn start` in another terminal first |
| `npm install` fails | npm is blocked | Use `yarn ci` or `yarn install --immutable` |
| Prayer times show stale data | Cached `localStorage` | DevTools → Application → Local Storage → clear relevant keys |
| Map not showing on Contact | Cookies not accepted | Accept functional cookies in the cookie bar |
| APIs return errors | Backend unavailable | Site falls back to cache; check Network tab for 4xx/5xx |
| Hook did not rename JS/CSS | File not staged as changed | Ensure you edited the current `scripts-*.js` / `main-*.css` and run `yarn setup-hooks` |
| Google Search Console “unused verification token” | HTML meta tag present but property verified via DNS/Analytics | Safe to ignore, or remove unused meta tag from `index.html` |

---

## AI assistant context

This repo includes documentation for AI coding tools:

| File | Purpose |
|------|---------|
| [`AGENTS.md`](AGENTS.md) | Primary instructions for Cursor / agents |
| [`.cursor/rules/`](.cursor/rules/) | Scoped rules (overview, JS, HTML/CSS, build workflow) |
| [`.cursorignore`](.cursorignore) | Excludes `node_modules`, Playwright reports from indexing |
| [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | GitHub Copilot context |

---

## License

[Apache License 2.0](LICENSE)

---

<p align="center">
  <img src="assets/images/brand/bismillah-dark.png" alt="Bismillah" width="200">
</p>

<p align="center">
  <sub>Kerry Islamic Cultural Centre · Tralee Masjid · County Kerry, Ireland</sub>
</p>
