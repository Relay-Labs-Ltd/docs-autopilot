# Next.js Web UI surfaces — build recipe

These surfaces are **design-coupled**: paste-copying another app's components
produces a Frankenstein UI. So scaffold them to match the **host app's** design
system, using this as the spec for structure, data model, and wiring. Confirm
with the user before adding DB models or admin routes.

## 1. Changelog ingest route + model (the machine side)

Install `templates/nextjs/changelog-ingest-route.ts.template` →
`src/app/api/admin/changelog/ingest/route.ts` and add the `ChangelogEntry`
Prisma model listed in its header. This is the endpoint the
`changelog-on-release.yml` workflow POSTs to. Run the app's migration/`db push`
after adding the model.

## 2. Public changelog page (optional, DB-backed)

- Route: `src/app/(public)/changelog/page.tsx`, ISR (`export const revalidate =
  300`). Reads published entries: `where: { publishedAt: { not: null } }`,
  ordered `date desc`.
- Optional RSS at `changelog/rss.xml` built from the same query.
- The entries created by the ingest route are **drafts** (`publishedAt: null`)
  and do NOT appear here until a human publishes them.

## 3. Admin changelog manager (the human publish gate)

- Route: `src/app/admin/changelog/` — list all entries (drafts included),
  create/edit/publish/unpublish/delete. Publishing sets `publishedAt = now()`
  and calls `revalidatePath("/changelog")`.
- Gate behind the app's existing admin auth (role check). This is where a human
  reviews the auto-drafted release entry and hits Publish.

## 4. Dev Docs viewer (admin, read-only)

- Build-time manifest: install `templates/scripts/gen-docs-manifest.mjs.template`
  → `scripts/gen-docs-manifest.mjs`, add npm script `docs:manifest`, and run it
  in `prebuild` (or the build) so `src/generated/dev-docs-manifest.json` is fresh.
  Commit the manifest (production Docker builds without git reuse it).
- Route: `src/app/admin/dev-docs/` (index + `[slug]`). The index lists docs from
  the manifest (grouped, with git provenance: date · hash · subject). The
  `[slug]` page reads the markdown file from disk and renders it (use the app's
  existing markdown renderer; enable GFM tables). Read-only, admin-gated.
- A small `src/lib/dev-docs.ts` maps slug ↔ relPath and loads content, falling
  back to a live `docs/**` scan if the manifest is empty.

## 5. Help Centre (public, optional)

Only if the app wants public end-user help. Structure that ports well:
- Articles as typed data (`src/lib/help/articles/*.ts`) — one topic per article,
  with `slug`, `title`, `category`, `updated`, and markdown `body`.
- Categories registry (`src/lib/help/content.ts`).
- Routes: `src/app/help/` (index) + `[category]/[slug]` (article), GFM markdown,
  a search box, left nav + right TOC. Match the host design system.
- This is what the docs-drift agent keeps true when `{{HELP_ARTICLES_PATH}}` is
  one of the `{{DOCS_SURFACES}}`.

## Wiring summary

```
GitHub Release published
   → changelog-on-release.yml  (POST tag+notes)
      → /api/admin/changelog/ingest  (creates DRAFT ChangelogEntry)
         → admin/changelog manager  (human reviews → Publish)
            → public /changelog  (ISR revalidated)
```
