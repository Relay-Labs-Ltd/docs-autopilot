# Docs & Changelog Automation — Claude Code plugin

The plugin behind [Docs Autopilot](../../README.md): drop documentation-drift +
GitHub-release→changelog automation into **any** repo, without rebuilding it
each time. Stack-aware:

- **Core (every repo):** a weekly **docs-drift agent** (opens a PR when docs
  fall behind the code), **release-please** (a human-gated Release PR that cuts
  versions from Conventional Commits), a **GitHub-release→changelog** workflow,
  an **AGENTS.md conventions** block, and a docs-manifest generator.
- **Web UI (Next.js + Prisma, on request):** a machine-authenticated **changelog
  ingest route**, plus a recipe to scaffold a **Help Centre** and **Dev Docs
  viewer** adapted to the host app's design system.

## Install

```
/plugin marketplace add Relay-Labs-Ltd/docs-autopilot
/plugin install docs-changelog-automation@docs-autopilot
```

## Use

In the target repo:

```
/install-docs-automation
```

Claude detects the stack, proposes a plan, and scaffolds the pieces after you
approve. Then it prints the one-time setup checklist (repo secrets + branch
protection). Also included: `/changelog` to draft public entries from commits.

## What it deliberately does NOT do

- **Auto-publish.** Changelog entries are created as drafts; a human publishes.
- **Surprise version bumps.** Versions only change when you merge the
  release-please Release PR.
- **Break an unconfigured repo.** Every workflow no-ops quietly when its secret
  is unset.
- **Rely on events GitHub never sends.** A release cut with `GITHUB_TOKEN`
  does not fire `release: published`, so `release-please.yml` dispatches the
  changelog draft and the docs-drift run explicitly when a release is cut.
- **Run up a bill.** The docs-drift agent runs on a pinned model with a hard
  120-turn cap.

## Design

The portable artifacts (workflows, configs, manifest script, AGENTS.md block,
ingest route) ship as `.template` files under
`skills/docs-changelog-automation/templates/`. The design-coupled surfaces
(Help Centre, Dev Docs viewer) ship as a **recipe** the skill follows to build
them into the host app rather than pasting frozen components. See
`skills/docs-changelog-automation/references/`.

See the [repo README](../../README.md) for the full picture — how the pieces
fit together, the setup checklist, and the template layout.

## License

[MIT](../../LICENSE).
