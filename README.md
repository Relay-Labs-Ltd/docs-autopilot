# Docs Autopilot

**A Claude Code plugin that keeps your documentation and changelog in sync with
your code — without ever publishing anything on its own.**

Docs drift. Changelogs get written "later". Release notes get pasted from
memory. Docs Autopilot installs a small, human-gated automation system into any
repository in one command:

- 🤖 **Docs-drift agent** — a weekly GitHub Action where Claude diffs your code
  against your docs and opens a PR when the docs have fallen behind. You review
  it like any other PR.
- 🏷️ **release-please** — versions cut from your Conventional Commits via a
  Release PR. Nothing bumps until a human merges it.
- 📣 **Release → changelog drafts** — publishing a GitHub Release automatically
  drafts a customer-facing changelog entry (to your app's ingest endpoint, or
  your `CHANGELOG.md`). A human reviews the wording and hits Publish.
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
keeps 80+ docs, a public changelog, and a customer help centre honest.

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
   create, and which secrets you'll need to add. Nothing is written until you
   approve.
3. **Scaffolds the pieces**, adapting file paths, branch names, and your app's
   name (templates are placeholder-driven, never blind copies).
4. **Prints a one-time setup checklist** — the secrets, branch protection, and
   the first-release flow.

You can pass arguments, e.g. `/install-docs-automation core only` or
`/install-docs-automation branch main`.

### Tiers

| Tier | When | What gets installed |
|---|---|---|
| **Core** | every repo | `docs-drift.yml`, `changelog-on-release.yml`, `release-please.yml` + configs, the `AGENTS.md` conventions block, the docs-manifest script |
| **Web UI** | Next.js App Router, on request | Core **plus** the changelog ingest route (needs Prisma) and a recipe to build a Help Centre + Dev Docs viewer in your design system |
| **Mobile / Service** | Expo/RN, workers, non-JS | Core only — changelog automation targets `CHANGELOG.md` + GitHub Releases |

## How it works

```
                     you write code with Conventional Commits
                                      │
                                      ▼
                      release-please opens a Release PR   ←── human merges = version bump
                                      │
                            GitHub Release published
                                      │
                                      ▼
                 changelog-on-release.yml POSTs tag + notes
                 to your app's ingest route (or CHANGELOG.md)
                                      │
                                      ▼
                        DRAFT changelog entry created    ←── human reviews + publishes
                                      
              …meanwhile, weekly (or on demand):
                                      
                 docs-drift.yml: Claude diffs code vs docs
                 since the last sync point (docs/.docs-sync)
                                      │
                                      ▼
                       opens a docs-update PR            ←── human reviews + merges
```

Three properties hold everywhere:

- **Human gates stay.** Changelog entries are drafts; versions require merging
  the Release PR; docs changes arrive as PRs. There is no auto-publish path.
- **Fail closed and quiet.** Every workflow no-ops cleanly when its secret is
  unset — an unconfigured repo is never broken or noisy.
- **Adapt, don't paste.** The installer reads your repo first. Templates use
  `{{PLACEHOLDER}}` substitution, and existing files (AGENTS.md,
  `package.json`, workflows) are merged, not clobbered.

## One-time setup (after install)

| Secret / setting | Where | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | repo Actions secret | Powers the docs-drift agent. Without it the workflow exits quietly. |
| `CHANGELOG_INGEST_SECRET` | repo Actions secret **and** your app's env (same value) | Authenticates the release→changelog POST. Only needed with the Web UI ingest route. |
| `CHANGELOG_BASE_URL` | repo Actions *variable* (optional) | Overrides the production URL the changelog workflow posts to. |
| Branch protection | repo Settings → Branches | Make release-please / CI checks gate merges if you want them enforced. |

**First run:** release-please opens a Release PR on your next push to the
release branch. Merging it publishes a GitHub Release, which triggers the
changelog draft. A human reviews the draft and publishes it.

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
      workflows/  docs-drift, changelog-on-release, release-please (.yml.template)
      config/     release-please config + manifest (.json.template)
      scripts/    gen-docs-manifest.mjs.template
      nextjs/     changelog-ingest-route.ts.template
      agents-md/  dev-docs-conventions.md
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
- **Paste frozen UI.** Design-coupled surfaces (Help Centre, Dev Docs viewer)
  ship as a *recipe* the skill follows in your design system, not as
  copy-pasted components.

## Validate before contributing

```bash
claude plugin validate .
claude plugin validate plugins/docs-changelog-automation
```

## License

[MIT](./LICENSE) — use it, fork it, ship it.
