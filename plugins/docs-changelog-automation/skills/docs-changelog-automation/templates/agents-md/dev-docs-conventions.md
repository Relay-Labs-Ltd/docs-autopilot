<!--
  Append this block to AGENTS.md (create the file if absent). It is the
  "awareness for everyone" piece: it tells every future agent and contributor
  the documentation discipline this repo follows, so docs stay true to the code
  by habit — not only via the weekly docs-drift agent. Adapt the paths in the
  bullets to this repo.
-->

## Documentation — source-of-truth discipline

- The canonical engineering record is **this file + `docs/**` + `CHANGELOG.md`**
  ({{DOCS_SURFACES}}). Keep them true to the code.
- **Before structural changes**, read the relevant `docs/**` runbook and this
  file. When a change alters routes, schema, or user-facing behaviour, update
  the matching doc (and Help Centre article, if this app has one) in the **same
  PR** when practical.
- The **docs-drift agent** (`.github/workflows/docs-drift.yml`) is the backstop:
  weekly it diffs `{{DEFAULT_BRANCH}}` against `docs/.docs-sync` and opens a docs
  PR for review. Never rely on it instead of updating docs in your PR — it
  catches what slipped, it is not the primary channel.
- **Changelog:** public/customer-facing changelog entries are created as drafts
  by the release automation (`.github/workflows/changelog-on-release.yml`) when a
  GitHub Release is published, then a human reviews and publishes. Cut a release
  by merging the release-please Release PR once enough commits have landed.
- **Conventional Commits** drive the version bump and the changelog section:
  `feat:` → minor/New, `fix:` → patch/Fixed, `perf:`/`refactor:` → Improved,
  `feat!:`/`BREAKING CHANGE:` → major. `docs:`/`test:`/`chore:`/`ci:`/`build:`/
  `style:` are omitted from the public changelog.
