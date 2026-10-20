<p align="center">
  <img src="assets/brand/docs-autopilot-lockup.png" alt="Docs Autopilot" width="560">
</p>

<p align="center">
  <a href="https://github.com/Relay-Labs-Ltd/docs-autopilot/actions/workflows/ci.yml"><img src="https://github.com/Relay-Labs-Ltd/docs-autopilot/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-141310.svg" alt="MIT"></a>
</p>

**A Claude Code plugin that keeps your documentation and changelog in sync with
your code — without ever publishing anything on its own.**

Docs drift. Changelogs get written "later". Release notes get pasted from
memory. Docs Autopilot installs a small, human-gated automation loop into any
repository in one command:

- 🏷️ **release-please** — versions cut from your Conventional Commits via a
  Release PR. Nothing bumps until a human merges it.
- 📣 **Release → changelog drafts** — publishing a GitHub Release fetches the
  notes, rewrites them into one customer-facing format, and drafts a changelog
  entry on your app's ingest endpoint. A human reviews the wording and hits
  Publish.
- 🤖 **Docs-drift agent** — weekly, on demand, and on every release, Claude
  diffs your code against your docs and opens a PR when the docs have fallen
  behind. You review it like any other PR. Pinned model, hard turn cap.
- ✍️ **`/changelog` command** — draft public, benefit-led changelog entries from
  the commits since your last release tag, in your app's tone.
- 📚 **Docs conventions for agents** — an `AGENTS.md` block that teaches every
  future AI agent working in your repo to keep docs updated in the same PR as
  the code.
- 🗂️ **Docs manifest generator** — stamps per-file git provenance
  (last commit, author, date) for building a "Dev Docs" viewer in your app.
- 🌐 **Next.js web tier (optional)** — for Next.js + Prisma apps: a
  machine-authenticated changelog **ingest route**, plus a recipe for
  scaffolding a Help Centre and Dev Docs viewer that match *your* design
  system instead of pasting someone else's components.

Extracted from the production automation built for
[Veritome](https://veritome.eu) (an EU AI Act compliance platform), where it
keeps 80+ docs, a public changelog, and a customer help centre honest across
200+ release-please runs.

---

## Requirements

- [Claude Code](https://claude.com/claude-code) (CLI, desktop, or web)
- A GitHub repository (the workflows are GitHub Actions)
- An `ANTHROPIC_API_KEY` for the docs-drift agent (the rest works without it)

## Install

```
/plugin marketplace add Relay-Labs-Ltd/docs-autopilot
/plugin install docs-changelog-automation@docs-autopilot
```

## Use

Open Claude Code in the repository you want to automate and run:

```
/install-docs-automation
```

Claude then:

1. **Detects your stack** — Next.js / Expo / worker / non-JS, Prisma or not,
   your default and release branches — and reports what it found.
2. **Proposes a plan** — which tier applies (see below), which files it will
   create, which model the drift agent should run on, and which secrets you'll
   need to add. Nothing is written until you approve.
3. **Scaffolds the pieces**, adapting file paths, branch names, and your app's
   name (templates are placeholder-driven, never blind copies).
4. **Prints a one-time setup checklist** — the secrets, the repo switch,
   branch protection, and the first-release flow.

You can pass arguments, e.g. `/install-docs-automation core only` or
`/install-docs-automation branch main`.

### Tiers

| Tier | When | What gets installed |
|---|---|---|
| **Core** | every repo | `release-please.yml` + configs, `changelog-on-release.yml`, `docs-drift.yml`, the public release-note renderer, the `AGENTS.md` conventions block, the docs-manifest script |
| **Web UI** | Next.js App Router, on request | Core **plus** the changelog ingest route (needs Prisma) and a recipe to build a Help Centre + Dev Docs viewer in your design system |
| **Mobile / Service** | Expo/RN, workers, non-JS | Core only — the changelog is `CHANGELOG.md` + GitHub Releases; the ingest workflow skips itself with a notice |

## How it works

```
            you write code with Conventional Commits
                              │
                              ▼
           release-please.yml keeps a Release PR open     ◄── human merges = version bump
                              │
                 GitHub Release published (tag vX.Y.Z)
                              │
        ┌─────────────────────┴──────────────────────┐
        │  release-please.yml DISPATCHES both:        │
        │  (a GITHUB_TOKEN-made release never fires   │
        │   `release: published` on its own)          │
        ▼                                             ▼
changelog-on-release.yml                        docs-drift.yml  (tag=vX.Y.Z)
  fetch notes by tag                              checkout integration branch
  → public-release-notes.mjs (one format)         → diff since docs/.docs-sync
  → POST to /api/admin/changelog/ingest           → update what drifted
        │                                             │
        ▼                                             ▼
  DRAFT changelog entry   ◄── human publishes    docs PR   ◄── human reviews + merges

        …and docs-drift.yml also runs every Monday and on demand.
```

Three properties hold everywhere:

- **Human gates stay.** Changelog entries are drafts; versions require merging
  the Release PR; docs changes arrive as PRs. There is no auto-publish path.
- **Fail closed and quiet.** Every workflow no-ops with a notice when its
  secret is unset — an unconfigured repo is never broken or noisy.
- **Adapt, don't paste.** The installer reads your repo first. Templates use
  `{{PLACEHOLDER}}` substitution, and existing files (`AGENTS.md`,
  `package.json`, workflows) are merged, not clobbered.

## One-time setup (after install)

| Secret / setting | Where | Purpose |
|---|---|---|
| Allow Actions to create PRs | Settings → Actions → General → Workflow permissions | Lets release-please open the Release PR. Without it the branch is pushed and the PR call is refused — flip and re-run, nothing is lost. |
| `RELEASE_PLEASE_TOKEN` *(recommended)* | repo Actions secret (PAT with `repo` scope or a GitHub App token) | A Release PR opened by `GITHUB_TOKEN` gets no `pull_request` CI; one opened by a PAT does. Falls back to `GITHUB_TOKEN`. |
| `ANTHROPIC_API_KEY` | repo Actions secret | Powers the docs-drift agent. Without it the workflow exits quietly. |
| `CHANGELOG_INGEST_SECRET` | repo Actions secret **and** your app's env (same value) | Authenticates the release→changelog POST. Only needed with the Web UI ingest route; unset, the workflow skips with a notice. |
| `CHANGELOG_BASE_URL` | repo Actions *variable* (optional) | Overrides the production URL the changelog workflow posts to. |
| Branch protection | Settings → Branches | Make release-please / CI checks gate merges if you want them enforced. |

**First run:** release-please opens a Release PR on your next push to the
release branch. Merging it publishes a GitHub Release, which dispatches the
changelog draft and a docs-drift run tagged with the version. A human reviews
both.

## Repository layout

```
.claude-plugin/marketplace.json          ← this repo is a Claude Code marketplace
plugins/docs-changelog-automation/
  .claude-plugin/plugin.json
  commands/
    install-docs-automation.md           ← /install-docs-automation
    changelog.md                         ← /changelog
  skills/docs-changelog-automation/
    SKILL.md                             ← the installer's step-by-step brain
    references/
      stack-adaptation.md                ← how to adapt per stack
      nextjs-surfaces.md                 ← Help Centre / Dev Docs viewer recipe
    templates/
      workflows/  release-please, changelog-on-release, docs-drift (.yml.template)
      config/     release-please config + manifest (.json.template)
      scripts/    public-release-notes.mjs, gen-docs-manifest.mjs (.template)
      nextjs/     changelog-ingest-route.ts.template
      agents-md/  dev-docs-conventions.md
assets/brand/                            ← logo, icon, social preview
docs/marketplace-listing.md              ← listing copy for skill marketplaces
scripts/
  check-templates.sh                     ← render + actionlint every template
  package-skill.sh                       ← build the marketplace ZIP
tests/                                   ← node --test
```

Templates carry a `.template` suffix so a host repo's TypeScript/ESLint/build
never compiles them; the installer strips the suffix and substitutes the
placeholders on install.

## What it deliberately does NOT do

- **Auto-publish.** Changelog entries are created as drafts; a human publishes.
- **Surprise version bumps.** Versions only change when you merge the
  release-please Release PR.
- **Break an unconfigured repo.** Every workflow no-ops quietly until its
  secret is set.
- **Rely on events GitHub never sends.** A release cut with `GITHUB_TOKEN`
  does not fire `release: published`; the loop dispatches its follow-ups
  explicitly.
- **Run up a bill.** The drift agent runs on a model you pin, with a hard
  120-turn cap.
- **Paste frozen UI.** Design-coupled surfaces (Help Centre, Dev Docs viewer)
  ship as a *recipe* the skill follows in your design system, not as
  copy-pasted components.

## Validate before contributing

```bash
claude plugin validate .
claude plugin validate plugins/docs-changelog-automation
scripts/check-templates.sh     # renders every template, actionlint, placeholder check
node --test                    # release-note renderer
```

This repo versions itself with the same release-please flow it installs
(`.github/workflows/release-please.yml`): merge the Release PR to cut a
version, bump `plugin.json`, and update `CHANGELOG.md`.

## Marketplace packaging

`scripts/package-skill.sh` builds `dist/docs-autopilot-skill-<version>.zip`
with `SKILL.md` at the root for SKILL.md-style marketplaces (Agensi and
others). Listing copy and image specs live in
[`docs/marketplace-listing.md`](docs/marketplace-listing.md); brand assets in
[`assets/brand/`](assets/brand/).

## License

[MIT](./LICENSE) — use it, fork it, ship it.
