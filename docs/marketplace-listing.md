# Marketplace listing — Docs Autopilot

Copy for the Agensi listing (and any other SKILL.md marketplace). Keep the
product name, the loop description and the "never auto-publishes" promise
identical everywhere; vary only length.

## Package

- **File:** `dist/docs-autopilot-skill-<version>.zip` from `scripts/package-skill.sh`
  (SKILL.md at the ZIP root; templates and references inside).
- **Images:** `assets/brand/docs-autopilot-icon.png` (512×512 icon),
  `assets/brand/social-preview.png` (1280×640 cover).
- **Category / tags:** `developer-tools`, `documentation`, `changelog`,
  `release-automation`, `github-actions`, `release-please`, `claude-code`,
  `devops`, `technical-writing`.
- **Platforms:** Claude Code (plugin + skill), any SKILL.md-compatible agent
  for the installer skill. The workflows it installs run on GitHub Actions.

## Name

**Docs Autopilot — docs & changelog that keep up with your code**

## One-liner (≤ 120 chars)

Installs a human-gated GitHub loop: Release PR → Release → changelog draft → docs-drift PR. Nothing publishes itself.

## Short description (≤ 300 chars)

One command adds release-please, a weekly + per-release docs-drift agent, and
GitHub-Release→changelog drafts to any repo. Stack-aware (Next.js, Expo,
services, non-JS), placeholder-driven, fails quiet when unconfigured, and
every output is a PR or a draft a human approves.

## Full description

Docs drift. Changelogs get written "later". Release notes get pasted from
memory. **Docs Autopilot** installs a small, human-gated automation loop into
any GitHub repository in one command — and keeps it honest afterwards.

**The full circle it installs**

1. **You commit** with Conventional Commits (`feat:`, `fix:`, `feat!:`).
2. **release-please** keeps a Release PR open proposing the next SemVer and
   the `CHANGELOG.md` diff. Merging it is your sign-off — nothing bumps until a
   human merges.
3. **A GitHub Release is published.** The plugin dispatches the two follow-ups
   explicitly, because GitHub will not fire `release: published` for a release
   the workflow's own token created (the bug every hand-rolled setup hits).
4. **Changelog draft.** The release notes are fetched by tag, rewritten into
   one customer-facing format (no SHAs, no internal scopes, duplicates
   collapsed) and POSTed to your app's secret-authenticated ingest route as a
   **draft**. A human reviews the wording and hits Publish. Repos without a web
   app skip this quietly — release-please's `CHANGELOG.md` is the changelog.
5. **Docs-drift PR.** A Claude agent diffs the code since the last sync point,
   updates the docs that drifted (Help Centre articles, runbooks, README) and
   opens a PR against your integration branch. Weekly, on demand, and on every
   release. It never merges.

Plus: an `AGENTS.md` conventions block so every future AI agent in your repo
keeps docs updated in the same PR as the code; a docs-manifest generator with
git provenance for a "Dev Docs" viewer; a `/changelog` command that drafts
benefit-led entries from commits; and, for Next.js + Prisma apps, the ingest
route and a recipe for a Help Centre + Dev Docs viewer in *your* design system.

**Three properties hold everywhere**

- **Human gates stay.** Drafts, Release PRs, docs PRs. There is no auto-publish path.
- **Fail closed and quiet.** Every workflow no-ops with a notice when its
  secret is unset; an unconfigured repo is never broken or noisy.
- **Adapt, don't paste.** The installer reads your repo first, substitutes
  placeholders, and merges into existing `AGENTS.md` / workflows instead of
  clobbering them.

**Cost-controlled by design.** The docs-drift agent runs with a pinned model
and a hard turn limit — the circuit breaker that stopped a $19 runaway run in
production. You choose the model at install.

**Battle-tested.** Extracted from the automation that keeps 80+ docs, a public
changelog and a customer help centre honest for Veritome, an EU AI Act
compliance platform: 200+ release-please runs, 15+ releases cut through the
loop, every changelog draft and docs PR reviewed by a human.

**What you need:** a GitHub repo, Claude Code, and an `ANTHROPIC_API_KEY`
secret for the drift agent (everything else works without it).

**Install**

```
/plugin marketplace add Relay-Labs-Ltd/docs-autopilot
/plugin install docs-changelog-automation@docs-autopilot
/install-docs-automation
```

Open source under MIT at github.com/Relay-Labs-Ltd/docs-autopilot.

## FAQ (for the listing's Q&A block)

**Does it publish anything on its own?** No. Changelog entries land as drafts,
versions need a merged Release PR, docs arrive as PRs.

**What does the drift agent cost?** You pin the model and the turn cap at
install; a typical weekly run on a mid-sized app is a few dollars, and the cap
makes a runaway run impossible.

**I don't have a web app.** Install the Core tier: release-please owns
`CHANGELOG.md` and the GitHub Release notes; the changelog-ingest workflow
skips itself with a notice.

**Does it work on monorepos / non-JS?** release-please `release-type` is set
per stack (`node`, `simple`, per-package for monorepos); the drift agent and
conventions are language-agnostic.

**Is it safe to give an agent `contents: write`?** The only untrusted input
(the release tag) is validated to a SemVer shape before it reaches the prompt;
tools are allow-listed; the agent can open a PR but never merge.

## Pricing recommendation

List **free**, with the GitHub repo as the canonical home. See the licensing
notes in the PR / advice that accompanies this file: the MIT edition on GitHub
cannot be sold on a marketplace whose buyer terms forbid redistribution, and a
paid edition needs to be a different artefact under a different licence.
