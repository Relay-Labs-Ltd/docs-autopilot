---
description: Install docs-drift + GitHub-release→changelog automation into the current repo (stack-aware).
---

Install the documentation + changelog automation system into **this repository**.

Load and follow the `docs-changelog-automation` skill bundled with this plugin.
Work through its steps in order:

1. **Detect the stack** (Next.js / Expo-RN / worker / other; Prisma or not;
   default + release branches) and report what you found.
2. **Propose a plan** — which tier (Core everywhere; Web UI only for Next.js on
   request), which files, and which secrets the user must add — then get a
   go-ahead.
3. **Install** the Core (workflows, release-please config, AGENTS.md conventions,
   docs manifest) and, if requested and applicable, the Next.js Web UI surfaces.
4. **Print the setup checklist** (`ANTHROPIC_API_KEY`, `CHANGELOG_INGEST_SECRET`,
   branch protection, first-release flow).

Substitute every `{{PLACEHOLDER}}` in the templates and grep for leftover `{{`
before finishing. Never auto-publish anything; keep the human gates (draft
changelog entries + the release-please Release PR). If a target file already
exists, show a diff and merge rather than clobbering it.

$ARGUMENTS may name a specific tier or parameters (e.g. "core only", "branch
main") — honour them.
