#!/usr/bin/env bash
# Renders every template with sample values, then checks the result the way a
# host repo's CI would: no leftover {{PLACEHOLDER}}s, workflows pass actionlint,
# JSON parses, scripts pass `node --check`. Usage: scripts/check-templates.sh [outdir]
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
T="$ROOT/plugins/docs-changelog-automation/skills/docs-changelog-automation/templates"
OUT=${1:-$(mktemp -d)}

render() {
  sed -e 's/{{APP_NAME}}/Acme/g' \
      -e 's/{{DEFAULT_BRANCH}}/main/g' \
      -e 's/{{RELEASE_BRANCH}}/main/g' \
      -e 's#{{DOCS_SURFACES}}#docs/**, README.md#g' \
      -e 's#{{PRODUCTION_URL}}#https://acme.example#g' \
      -e 's/{{DRIFT_MODEL}}/claude-sonnet-5-5/g' \
      -e 's#{{HELP_ARTICLES_PATH}}#src/lib/help/articles#g' \
      "$1"
}

mkdir -p "$OUT/.github/workflows" "$OUT/scripts" "$OUT/config" "$OUT/nextjs"
for f in "$T"/workflows/*.template; do render "$f" > "$OUT/.github/workflows/$(basename "${f%.template}")"; done
for f in "$T"/config/*.template;    do render "$f" > "$OUT/config/$(basename "${f%.template}")"; done
for f in "$T"/scripts/*.template;   do render "$f" > "$OUT/scripts/$(basename "${f%.template}")"; done
for f in "$T"/nextjs/*.template;    do render "$f" > "$OUT/nextjs/$(basename "${f%.template}")"; done
render "$T/agents-md/dev-docs-conventions.md" > "$OUT/AGENTS.md"

# 1. No leftover placeholders. (`${{ }}` GitHub expressions are not placeholders.)
if grep -rnE '\{\{[A-Z_]+\}\}' "$OUT"; then
  echo "::error::leftover {{PLACEHOLDER}} in rendered templates" >&2
  exit 1
fi

# 2. JSON parses.
for f in "$OUT"/config/*.json; do jq empty "$f"; done

# 3. Scripts parse.
for f in "$OUT"/scripts/*.mjs; do node --check "$f"; done

# 4. Workflows lint.
if command -v actionlint >/dev/null 2>&1; then
  actionlint "$OUT"/.github/workflows/*.yml
else
  echo "actionlint not installed — skipping workflow lint" >&2
fi

echo "templates OK → $OUT"
