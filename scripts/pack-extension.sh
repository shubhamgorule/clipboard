#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(python3 -c "import json; print(json.load(open('$ROOT/manifest.json'))['version'])")"
OUT_DIR="$ROOT/dist"
ZIP="$OUT_DIR/clipboard-v${VERSION}.zip"

mkdir -p "$OUT_DIR"
rm -f "$ZIP"

cd "$ROOT"
zip -r "$ZIP" \
  manifest.json \
  background \
  popup/index.html \
  popup/popup.js \
  popup/popup.css \
  popup/assets \
  popup/fonts/Asta_Sans/OFL.txt \
  popup/fonts/Asta_Sans/static/AstaSans-Medium.ttf \
  popup/fonts/Asta_Sans/static/AstaSans-Bold.ttf \
  shared \
  ui \
  store/icons/icon16.png \
  store/icons/icon48.png \
  store/icons/icon128.png \
  -x "*.DS_Store"

echo "Created $ZIP ($(du -h "$ZIP" | cut -f1))"
