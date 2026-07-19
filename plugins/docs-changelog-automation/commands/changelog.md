---
description: Draft public, customer-facing changelog entries from commits since the last release tag.
---

You are drafting PUBLIC changelog entries for this app. Do NOT invent changes and do NOT publish.

1. Find the last release: `git describe --tags --abbrev=0`. List merged commits/PRs since it:
   `git log <lastTag>..HEAD --no-merges --pretty='%s%n%b'`.
2. Keep only user-facing changes. Drop docs/test/chore/ci and pure refactors with no user impact.
3. Group related commits; collapse many small fixes into one line. Aim for a tight, scannable set.
4. For each entry, capture:
   - category: New (feat) | Fixed (fix) | Improved (perf/refactor, user-visible) | Security | Deprecated/Removed (breaking)
   - title: benefit-led, no library/vendor names
   - summary: 1-2 sentences in customer language
   - version: the version from the pending release-please Release PR; date: today (ISO 8601)
   - highlight: true for at most the 1-2 biggest items; else false
5. Write them to wherever this app stores changelog entries:
   - **DB-backed changelog** (this plugin's ingest model): create them via the
     admin changelog manager, or leave them for the release-triggered draft.
   - **JSON/MDX-backed changelog**: prepend to the changelog data file (newest first).
   Then open a PR titled "changelog: <version>" summarising what you added. STOP — wait
   for human review. Do not merge and do not publish.

Hard rules: every entry must trace to a real commit; never include internal-only changes; never
overstate; match the existing tone. Prefer editing the changelog **data**, not JSX/TSX — the page
and any RSS feed render from the data.
