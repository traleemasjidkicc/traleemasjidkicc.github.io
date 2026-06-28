# Test suite documentation — Tralee Masjid

Versioned UAT (User Acceptance Testing) suites for [traleemasjidkicc.ie](https://traleemasjidkicc.ie).

## Active suite

| Version | Document | Cases | Status |
|---------|----------|-------|--------|
| **v2.0.1** | [uat-suite-v2.0-2026-06-28.md](active/uat-suite-v2.0-2026-06-28.md) | 100 | **Active** — cases, priorities, and execution **Status** in one file |

Update the **Status** column in the active suite when you run manual or automated tests. Do not maintain a separate results file.

## Archived suites

| Version | Document | Cases | Superseded by |
|---------|----------|-------|---------------|
| v1.0 | [v1.0-pdf-export-2026-06-28.pdf](archived/v1.0-pdf-export-2026-06-28.pdf) · [markdown mirror](archived/v1.0-pdf-export-2026-06-28.md) | 72 | v2.0 |
| v1.1 | [v1.1-code-audit-2026-06-28.md](archived/v1.1-code-audit-2026-06-28.md) | 141 | v2.0 |
| — | [uat-execution-results-2026-06-28.md](archived/uat-execution-results-2026-06-28.md) | — | Merged into v2.0.1 Status column |

## Versioning policy

- **Major** (v1 → v2): suite restructure, ID scheme change, or large merge of sources.
- **Minor** (v2.0 → v2.1): new cases, priority changes, execution status refresh, or wording fixes without ID churn.
- **Patch**: typos and clarifications only; same version file may be replaced in place with an updated date suffix if needed.

When a suite is superseded:

1. Copy the current active file to `archived/` with its version and date in the filename.
2. Place the new suite in `active/`.
3. Update this README and the version table in the new suite document.

## Related artefacts

| Artefact | Location |
|----------|----------|
| Playwright e2e tests | [`tests/`](../../tests/) |
| Sprint backlog (audit cross-check) | [`SPRINT.md`](../../SPRINT.md) |

## ID scheme (v2.0)

Cases use a **section prefix** and two-digit number (e.g. `NAV-04`, `CC-02`), matching the PDF layout. The **Legacy** column maps to v1.0 PDF IDs and v1.1 numeric IDs where applicable.
