#!/usr/bin/env bash
# Builds the marketplace ZIP (Agensi and other SKILL.md marketplaces): the
# skill folder with SKILL.md at the ZIP root, plus LICENSE and the plugin
# README. The installer skill is self-contained — templates/ and references/
# live inside it — so the ZIP works without the surrounding plugin.
#
# Usage: scripts/package-skill.sh            → dist/docs-autopilot-skill-<version>.zip
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
PLUGIN="$ROOT/plugins/docs-changelog-automation"
SKILL="$PLUGIN/skills/docs-changelog-automation"
VERSION=$(jq -r .version "$PLUGIN/.claude-plugin/plugin.json")
DIST="$ROOT/dist"
STAGE=$(mktemp -d)
NAME="docs-autopilot-skill-$VERSION"

mkdir -p "$DIST" "$STAGE/$NAME"
cp -R "$SKILL"/. "$STAGE/$NAME/"
cp "$ROOT/LICENSE" "$STAGE/$NAME/LICENSE"
cp "$PLUGIN/README.md" "$STAGE/$NAME/README.md"
# The /changelog command travels as a reference doc so the skill is complete
# on marketplaces that only ship SKILL.md folders.
cp "$PLUGIN/commands/changelog.md" "$STAGE/$NAME/references/changelog-command.md"

# Sanity: SKILL.md at root with name + description frontmatter.
grep -q '^name:' "$STAGE/$NAME/SKILL.md"
grep -q '^description:' "$STAGE/$NAME/SKILL.md"

OUT="$DIST/$NAME.zip"
rm -f "$OUT"
if command -v zip >/dev/null 2>&1; then
  (cd "$STAGE/$NAME" && zip -qr "$OUT" .)
else
  python3 - "$STAGE/$NAME" "$OUT" <<'PY'
import os, sys, zipfile
src, out = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for d, _, files in os.walk(src):
        for f in files:
            p = os.path.join(d, f)
            z.write(p, os.path.relpath(p, src))
PY
fi
rm -rf "$STAGE"
echo "built $OUT"
unzip -l "$OUT" 2>/dev/null | tail -n +4 | head -40 || true
