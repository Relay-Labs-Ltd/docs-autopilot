---
name: docs-changelog-automation
description: Install documentation-drift and GitHub-release→changelog automation into the current repository. Detects the repo's stack (Next.js, Expo/React Native, plain Node/other) and scaffolds the portable GitHub Actions + AGENTS.md conventions everywhere, plus the Next.js Help Centre / Dev Docs viewer / changelog ingest route where they apply. Use when the user asks to set up docs automation, changelog automation, release automation, a docs-drift agent, or to "apply the Veritome docs/changelog system" to a repo.
---

# Docs & Changelog Automation — installer

You are installing a documentation + changelog automation system into the
**current repository**. Work adaptively: detect the stack, propose a plan,
confirm the few parameters you can't infer, then scaffold. Never blindly copy —
adapt file paths, the default branch, and the app name to the target repo.

All bundled templates are under this skill's `templates/` directory and carry a
`.template` suffix so they don't get compiled by the source repo they were
authored in. When you install one, strip the `.template` suffix and substitute
the placeholders (see "Placeholders" below).

## Step 1 — Detect the stack

Inspect the repo root and report what you find before changing anything:

- **Package manager / language:** `package.json` present? `pnpm-lock.yaml` /
  `yarn.lock` / `package-lock.json`? A `tsconfig.json`?
- **Framework signals:**
  - **Next.js** — `next` in dependencies, a `next.config.*`, an `app/` or
    `src/app/` directory.
  - **Expo / React Native** — `expo` or `react-native` in dependencies, an
    `app.json` / `app.config.*`, an `expo` key.
  - **Worker/service** — `bullmq`, a `Dockerfile`, no web framework.
  - **Other / non-JS** — no `package.json`; treat as portable-core only.
- **ORM:** Prisma? (`prisma/schema.prisma`). This gates the changelog **ingest
  route** and any DB-backed changelog UI.
- **Existing automation:** is there already a `.github/workflows/`,
  `release-please*`, an `AGENTS.md`, a `docs/` tree, a `CHANGELOG.md`?
- **Default branch:** run `git symbolic-ref --short HEAD` and check for a
  `dev` branch. Ask the user which branch is their integration branch if it's
  ambiguous (many teams use `main`; some use `dev` → `main`).

Summarise the detected stack in one short paragraph, then map it to a tier:

| Tier | When | What gets installed |
|---|---|---|
| **Core** | every repo | `docs-drift.yml`, `changelog-on-release.yml`, `release-please.yml` + configs, AGENTS.md conventions block, `gen-docs-manifest` script + npm script, `public-release-notes.mjs` (customer-facing release-note renderer, optional) |
| **Web UI** | Next.js (App Router) **and** the user wants public docs/changelog surfaces | Core **plus** changelog **ingest route** (if Prisma) and a recipe to scaffold the Help Centre + Dev Docs viewer |
| **Mobile/Service** | Expo/RN, workers, non-JS | Core only. No web Help Centre. Changelog automation still applies (targets the app's ingest endpoint if it has one, otherwise maintains `CHANGELOG.md` + GitHub Releases via release-please) |

## Step 2 — Confirm parameters

Infer as much as possible; only ask when you genuinely can't. Collect:

- `APP_NAME` — human name of the app (for the docs-drift agent prompt + docs).
- `DEFAULT_BRANCH` — the integration branch the agents run against (`main` or `dev`).
- `RELEASE_BRANCH` — where release-please watches (usually `main`).
- `DOCS_SURFACES` — which user-facing doc sources the drift agent should keep
  true (e.g. `docs/**`, a Help Centre path, a README). Default: `docs/**` + `README.md`.
- `DRIFT_MODEL` — the Claude model the docs-drift agent runs on. Default
  `claude-sonnet-5-5` (drafting work, human-reviewed before it lands);
  offer `claude-opus-5-5` for teams that want the strongest reconciliation.
  The run is also capped at 120 turns as a cost circuit-breaker.
- Whether to install the **Web UI** tier (only offer for Next.js).

Present the plan (files to create/modify + secrets the user must add) and get a
go-ahead before writing.

## Step 3 — Install the Core (every repo)

1. **Workflows** → copy into `.github/workflows/`, stripping `.template` and
   substituting placeholders:
   - `templates/workflows/docs-drift.yml.template`
   - `templates/workflows/changelog-on-release.yml.template`
   - `templates/workflows/release-please.yml.template`
2. **release-please config** → `templates/config/release-please-config.json.template`
   → `release-please-config.json`; `templates/config/release-please-manifest.json.template`
   → `.release-please-manifest.json` (set the current version, default `0.1.0`).
3. **Docs manifest script** (optional, most useful for the Dev Docs viewer) →
   `templates/scripts/gen-docs-manifest.mjs.template` → `scripts/gen-docs-manifest.mjs`,
   and add an npm script `"docs:manifest": "node scripts/gen-docs-manifest.mjs"`.
   Skip for non-JS repos.
4. **AGENTS.md conventions** → if `AGENTS.md` exists, append the block from
   `templates/agents-md/dev-docs-conventions.md` (adapt paths); otherwise create
   `AGENTS.md` starting from that block. This is the "awareness for everyone"
   piece — it tells future agents the docs discipline to follow.
5. **Docs-sync baseline** → create `docs/.docs-sync` containing the current
   `git rev-parse HEAD` so the drift agent has a starting point.
6. **Public release-note renderer** (recommended when the changelog workflow
   has somewhere to post) → `templates/scripts/public-release-notes.mjs.template`
   → `scripts/release-notes/public-release-notes.mjs`. `changelog-on-release.yml`
   runs it when present: release-please's engineering changelog (SHA-stamped,
   scope-prefixed, often duplicated across branches) becomes one
   customer-facing note before it is sent. Idempotent; never rewrites a note a
   person edited. Skip for repos with no changelog surface.

How the three workflows chain — and why `release-please.yml` dispatches the
other two instead of relying on events: a GitHub Release created with the
workflow's own `GITHUB_TOKEN` does **not** fire `release: published`
(GitHub's anti-recursion rule), so a hand-rolled setup silently never drafts
a changelog. The template dispatches `changelog-on-release.yml` and
`docs-drift.yml` explicitly on `release_created`; `docs-drift.yml` lists
`allowed_bots: "github-actions"` because `claude-code-action` refuses
bot-initiated runs otherwise. Keep both when adapting.

## Step 4 — Install the Web UI tier (Next.js only, on request)

Read `references/nextjs-surfaces.md` and follow it. In brief:

1. **Changelog ingest route** (needs Prisma): copy
   `templates/nextjs/changelog-ingest-route.ts.template` to
   `src/app/api/admin/changelog/ingest/route.ts`, then adapt the Prisma model
   name, the admin-audit call, and add a `ChangelogEntry` model to the schema if
   absent (the template's header comments list the required fields). This is
   what `changelog-on-release.yml` POSTs to.
2. **Help Centre + Dev Docs viewer** are design-coupled, so scaffold them
   adaptively to the target app's design system rather than pasting Veritome's
   components. `references/nextjs-surfaces.md` gives the data model, the route
   shape, and the wiring; build them to match the host app.

## Step 5 — Print the setup checklist

The automation is inert until the user adds secrets/vars. End with an explicit
checklist (adapt to what you installed):

- **Workflow permissions** — Settings → Actions → General → Workflow
  permissions → tick *Allow GitHub Actions to create and approve pull
  requests*. Without it release-please pushes its branch but the "open the
  PR" call is refused (an org-level setting of the same name overrides the
  repo one). Nothing is lost; flip it and re-run.
- **`RELEASE_PLEASE_TOKEN`** (recommended) — repo Actions secret: a PAT with
  `repo` scope or a GitHub App token. A Release PR opened by `GITHUB_TOKEN`
  gets no `pull_request` CI runs; one opened by a PAT does. The workflow
  falls back to `GITHUB_TOKEN` when unset.
- **`ANTHROPIC_API_KEY`** — repo Actions secret. Without it the docs-drift agent
  exits quietly (no error).
- **`CHANGELOG_INGEST_SECRET`** — repo Actions secret **and** the app's env
  (same value), only if the Web UI ingest route was installed. Unset, the
  workflow skips itself with a notice; set but rejected by the endpoint, it
  fails loudly (a 401 usually means middleware in front of the route, not a
  wrong secret).
- **`CHANGELOG_BASE_URL`** — optional repo Actions *variable*; defaults to the
  production URL you set in the workflow.
- **Branch protection** — if `release-please`/CI checks should gate merges, add
  them under Settings → Branches.
- **First run** — `release-please` opens a Release PR on the next push to the
  release branch; merging it publishes a Release, which dispatches the
  changelog draft and a docs-drift reconciliation tagged with the version.
  Nothing publishes automatically — a human reviews the changelog draft and
  hits Publish, and reviews the docs PR like any other.

## Placeholders

Every template uses `{{DOUBLE_BRACE}}` placeholders. Substitute all of them:

| Placeholder | Meaning | Example |
|---|---|---|
| `{{APP_NAME}}` | Human app name | `Veritome` |
| `{{DEFAULT_BRANCH}}` | Integration branch the agents run on | `dev` |
| `{{RELEASE_BRANCH}}` | Branch release-please watches | `main` |
| `{{DOCS_SURFACES}}` | Doc sources the drift agent maintains | `docs/**, README.md` |
| `{{PRODUCTION_URL}}` | Base URL the changelog workflow posts to | `https://veritome.eu` |
| `{{HELP_ARTICLES_PATH}}` | Where Help Centre articles live (Next.js) | `src/lib/help/articles` |
| `{{DRIFT_MODEL}}` | Model the docs-drift agent runs on | `claude-sonnet-5-5` |

After substitution, run `grep -rnE '\{\{[A-Z_]+\}\}'` over the installed files
to confirm none were missed. (A plain `grep '{{'` false-positives on every
`${{ }}` GitHub Actions expression — match the uppercase placeholder shape.)

## Design principles

- **Adapt, don't paste.** File paths, branch names, and the app name differ per
  repo — read the repo first.
- **Fail closed & quiet.** Every automation no-ops cleanly when its secret is
  unset, so an unconfigured repo is never broken or noisy.
- **Human gates stay.** Changelog entries are created as *drafts*; release
  versions require merging the Release PR. Never wire an auto-publish path.
- **Idempotent.** If a file already exists, show a diff and merge rather than
  clobbering — especially `AGENTS.md`, `package.json`, and existing workflows.
