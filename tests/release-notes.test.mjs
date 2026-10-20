// Pins the public release-note renderer that changelog-on-release.yml runs.
// Run: node --test tests/
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(
  here,
  "..",
  "plugins/docs-changelog-automation/skills/docs-changelog-automation/templates/scripts/public-release-notes.mjs.template",
);
const RENDERED = path.join(here, ".rendered-public-release-notes.mjs");

// Render the template the way the installer does, then import it.
fs.writeFileSync(RENDERED, fs.readFileSync(TEMPLATE, "utf8").replaceAll("{{APP_NAME}}", "Acme"));
const mod = await import(RENDERED);
const { renderPublicReleaseNotes, isReleasePleaseBody, isPublicReleaseNote } = mod;

const body = fs.readFileSync(path.join(here, "fixtures/release-please-body.md"), "utf8");

test("recognises release-please output and the public format", () => {
  assert.equal(isReleasePleaseBody(body), true);
  assert.equal(isPublicReleaseNote(body), false);
  assert.equal(isReleasePleaseBody("Hand-written note.\n\n- with a bullet"), false);
});

test("renders the one public format from a release-please body", () => {
  const out = renderPublicReleaseNotes("v2.1.2", body);
  assert.match(out, /^# Acme v2\.1\.2\n/);
  assert.match(out, /## Breaking changes\n\n- The v1 export endpoint is removed/);
  assert.match(out, /## What’s new\n\n- Issue completion certificates per organisation\n- Export assessments as PDF\n/);
  assert.match(out, /## Improvements\n\n- Classify large inventories twice as fast/);
  assert.match(out, /## Fixes\n\n- Harden training completion integrity\n- Dashboard tiles no longer overlap on narrow screens\n/);
  assert.doesNotMatch(out, /[0-9a-f]{7}\]/, "commit SHAs must not leak");
  assert.doesNotMatch(out, /#12\d\d/, "PR numbers must not leak");
  assert.doesNotMatch(out, /pin the unit-test runner/, "internal ci scope is hidden");
  assert.doesNotMatch(out, /fix install command/, "docs section is hidden");
  assert.equal((out.match(/Harden training completion integrity/g) ?? []).length, 1, "duplicates collapse");
  assert.match(out, /## Notes\n\nQuestions about this release\?/);
});

test("is idempotent and never rewrites a hand-written note", () => {
  const once = renderPublicReleaseNotes("2.1.2", body);
  assert.equal(renderPublicReleaseNotes("2.1.2", once), once);
  const human = "We rebuilt the exporter.\n\nMigration: run `acme migrate` first.\n";
  assert.equal(renderPublicReleaseNotes("3.0.0", human), human);
});

test("a maintenance-only release says so", () => {
  const only = "## [2.1.3](u) (2026-10-02)\n\n### Chores\n\n* **deps:** bump things ([aaaaaaa](u))\n";
  const out = renderPublicReleaseNotes("2.1.3", only);
  assert.match(out, /maintenance and reliability work only/);
  assert.doesNotMatch(out, /## Fixes|## What’s new/);
});

after(() => fs.rmSync(RENDERED, { force: true }));
