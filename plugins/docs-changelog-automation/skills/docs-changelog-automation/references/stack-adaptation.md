# Per-stack adaptation notes

The Core tier installs everywhere; adapt these details per stack.

## release-please `release-type`

Set `release-type` in `release-please-config.json` to match the repo:

| Stack | release-type | Notes |
|---|---|---|
| Next.js / Node package | `node` | Bumps `package.json` version + `package-lock.json`. |
| Expo / React Native | `node` | Also bump `app.json`/`app.config.*` `version` (and native build numbers) in a release step or `extra-files`. |
| Monorepo | one entry per package under `packages` | Give each its own path + changelog. |
| Non-JS / generic | `simple` | Tracks version in `.release-please-manifest.json` only; no package file. |

For Expo, you can add `extra-files` to `release-please-config.json` so the
`app.json` version tracks the release:

```json
"extra-files": [{ "type": "json", "path": "app.json", "jsonpath": "$.expo.version" }]
```

## Changelog automation per stack

- **Next.js web app** — install the ingest route; the workflow POSTs to it and a
  human publishes from admin. Full loop.
- **Expo / React Native (no web backend)** — there is no ingest endpoint to POST
  to. Two options:
  1. Point `CHANGELOG_BASE_URL` at a **companion web app** that owns the
     changelog (common when the mobile app has a marketing/web sibling), or
  2. **Drop `changelog-on-release.yml` entirely** and let release-please own the
     changelog: it already maintains `CHANGELOG.md` and the GitHub Release notes.
     That is a complete, human-gated changelog for an app with no web surface.
- **Worker / service (Next.js + BullMQ, etc.)** — same as the Next.js web app if
  it exposes HTTP; otherwise treat like the service has no changelog surface and
  rely on release-please + `CHANGELOG.md`.

## Default branch vs release branch

Many teams develop on `main` and release from `main` (`DEFAULT_BRANCH ==
RELEASE_BRANCH`). Some (like Veritome) develop on `dev`, promote to `main`, and
release from `main`. The docs-drift agent runs on `DEFAULT_BRANCH` (where day-to-
day work lands); release-please watches `RELEASE_BRANCH`. Set both correctly.

## Package manager

Templates assume npm. For pnpm/yarn, adjust the `docs:manifest` npm-script
invocation and any `npm ci`/`npm run` calls in workflows you add.
