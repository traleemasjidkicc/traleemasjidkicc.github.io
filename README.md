# Tralee Masjid — Kerry Islamic Cultural Centre

Official website for Kerry Islamic Cultural Centre (Tralee Mosque), serving the religious, cultural, and social needs of Muslims in County Kerry, Ireland.

**Live site:** [traleemasjidkicc.ie](https://traleemasjidkicc.ie)

---

## Overview

A static [GitHub Pages](https://pages.github.com/) site built with vanilla HTML, CSS, and JavaScript. No build step is required for deployment — files are served directly from the repository. [Gulp](https://gulpjs.com/) and [BrowserSync](https://browsersync.io/) provide local development with live reload.

```mermaid
flowchart TB
    subgraph Client["Browser"]
        HTML["Static HTML pages"]
        CSS["assets/css/"]
        JS["assets/js/scripts-*.js"]
        CDN["CDN: Bootstrap, jQuery, Font Awesome"]
    end

    subgraph Hosting["GitHub Pages"]
        GH["main branch → traleemasjidkicc.ie"]
    end

    subgraph APIs["Google Cloud Run APIs"]
        ST["getsalahtimes"]
        IQ["getiqamahtimes"]
        AN["getannouncements"]
        NO["getnotices"]
        PR["getmasjidprogrammes"]
        HA["randomhadith"]
    end

    HTML --> GH
    CSS --> GH
    JS --> GH
    JS --> APIs
    CDN --> Client
```

---

## Pages

| Page | File | Purpose |
|------|------|---------|
| Home | `index.html` | Prayer times, announcements, notices, events, pillars of faith |
| About | `about.html` | Centre history and mission |
| Activities | `activities.html` | Weekly programmes and events |
| Madrasa | `madrasa.html` | Islamic school information |
| Projects | `projects.html` | Community projects gallery |
| Contact | `contact.html` | Location and contact details |

---

## Architecture

### Request flow (homepage)

```mermaid
sequenceDiagram
    participant U as User
    participant P as GitHub Pages
    participant J as scripts-*.js
    participant LS as localStorage
    participant API as Cloud Run APIs

    U->>P: Load index.html
    P->>J: Execute on window.onload
    J->>LS: Read cached salah/iqamah data
    LS-->>J: Cached JSON (if any)
    J->>U: Render cached times immediately
    par Parallel fetches
        J->>API: getsalahtimes (monthly PDF URL)
        J->>API: getiqamahtimes (today's iqamah)
        J->>API: getannouncements
        J->>API: getnotices
        J->>API: randomhadith
    end
    API-->>J: JSON responses
    J->>LS: Update cache
    J->>U: Update DOM
```

### Project structure

```
traleemasjidkicc.github.io/
├── index.html              # Homepage
├── about.html
├── activities.html
├── madrasa.html
├── projects.html
├── contact.html
├── assets/
│   ├── css/
│   │   ├── main.css        # Layout, theme, components
│   │   └── animations.css  # Transitions and keyframes
│   ├── js/
│   │   └── scripts-*.js    # All client logic (versioned filename)
│   └── images/             # Photos, posters, backgrounds
├── gulpfile.js             # Dev server + JS cache-busting
├── package.json
├── CNAME                   # Custom domain (traleemasjidkicc.ie)
├── site.webmanifest        # PWA manifest
├── AGENTS.md               # AI agent instructions
└── .cursor/rules/          # Cursor IDE rules
```

### JS asset versioning

JavaScript uses a timestamped filename (`scripts-{timestamp}.js`) to bust browser caches on each commit.

```mermaid
flowchart LR
    A[Edit scripts-*.js] --> B[git commit]
    B --> C[pre-commit hook]
    C --> D[gulp rename-js]
    D --> E[Rename file + update HTML refs]
    E --> F[bump package.json patch]
    F --> G[post-commit amend]
    G --> H[Push to GitHub Pages]
```

> **Do not** manually rename the JS file or edit `<script src="...">` tags — git hooks handle this automatically.

---

## Running locally

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Yarn](https://yarnpkg.com/) ≥ 4.0.0 (npm is blocked via `engine-strict`)

### Setup

```bash
# Clone the repository
git clone git@github.com:traleemasjidkicc/traleemasjidkicc.github.io.git
cd traleemasjidkicc.github.io

# Install dependencies (frozen lockfile)
yarn ci
```

`yarn ci` runs a clean `yarn install --immutable` (Yarn 4 equivalent of `--frozen-lockfile`) and then starts the dev server. To install without starting:

```bash
yarn install --immutable
```

### Development server

```bash
yarn start
```

Opens **http://localhost:3000** with live reload. BrowserSync watches:

- `*.html`
- `assets/css/*.css`
- `assets/js/*.js`

### Verify dependencies

Checks that `node_modules` and the lockfile are in sync and package checksums match:

```bash
yarn verify
```

Runs `yarn install --immutable --check-cache`.

### Git hooks (optional but recommended)

After cloning, install commit hooks so JS assets are versioned on each commit:

```bash
yarn setup-hooks
```

This copies `pre-commit` and `post-commit` into `.git/hooks/` and makes them executable. Equivalent manual setup:

```bash
cp pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
cp post-commit .git/hooks/post-commit && chmod +x .git/hooks/post-commit
```

---

## Development workflow

| Task | Command |
|------|---------|
| Install dependencies | `yarn ci` |
| Install git hooks | `yarn setup-hooks` |
| Start dev server | `yarn start` |
| Verify node_modules | `yarn verify` |
| Commit (with hooks) | `git commit` — runs asset versioning automatically |

### Editing guide

1. **HTML content** — edit page files directly; preview with `yarn start`
2. **Styles** — edit `assets/css/main.css` or `animations.css`
3. **JavaScript** — edit `assets/js/scripts-*.js` in place; commit normally
4. **Dependencies** — `yarn upgrade <package>`, test locally, commit `yarn.lock`

---

## External APIs

All dynamic content is fetched client-side from Google Cloud Run services:

| API | Used for |
|-----|----------|
| `getsalahtimes-rds3nxm6za-ew.a.run.app` | Monthly salah times asset URL |
| `getiqamahtimes-rds3nxm6za-ew.a.run.app` | Today's iqamah times |
| `getannouncements-rds3nxm6za-ew.a.run.app` | Homepage announcements |
| `getnotices-rds3nxm6za-ew.a.run.app` | Homepage notices |
| `getmasjidprogrammes-rds3nxm6za-ew.a.run.app` | Activities programmes |
| `randomhadith-rds3nxm6za-ew.a.run.app` | Daily hadith |

Responses are cached in `localStorage` for resilience when APIs are unavailable.

---

## Deployment

Pushing to the `main` branch deploys automatically to GitHub Pages. The `CNAME` file configures the custom domain `traleemasjidkicc.ie`.

No CI build step — static assets are served as committed.

---

## Cursor / AI context

This repo includes files to help AI assistants work effectively:

| File | Purpose |
|------|---------|
| `AGENTS.md` | Primary agent instructions |
| `.cursor/rules/` | Scoped rules (JS, HTML/CSS, build workflow) |
| `.cursorignore` | Excludes `node_modules` from indexing |
| `.github/copilot-instructions.md` | GitHub Copilot context |

---

## License

Apache License 2.0 — see [LICENSE](LICENSE).
