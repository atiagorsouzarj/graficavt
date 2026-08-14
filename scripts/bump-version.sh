#!/usr/bin/env bash
# =============================================================================
#  GrafCenter — Versionamento semântico
#  Uso: bash scripts/bump-version.sh [patch|minor|major]
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

G='\033[1;32m'; C='\033[1;36m'; R='\033[1;31m'; N='\033[0m'

KIND="${1:-patch}"
CURRENT="$(cat VERSION 2>/dev/null || echo '0.0.0')"

IFS='.' read -r MA MI PA <<< "$CURRENT"

case "$KIND" in
  major) MA=$((MA+1)); MI=0; PA=0 ;;
  minor) MI=$((MI+1)); PA=0 ;;
  patch) PA=$((PA+1)) ;;
  *) echo -e "${R}Uso: bash scripts/bump-version.sh [patch|minor|major]${N}"; exit 1 ;;
esac

NEW="${MA}.${MI}.${PA}"
echo "$NEW" > VERSION

# sincroniza com package.json (sem quebrar formatação)
node -e "
const fs=require('fs');
const p=JSON.parse(fs.readFileSync('package.json','utf8'));
p.version='${NEW}';
fs.writeFileSync('package.json', JSON.stringify(p,null,2)+'\n');
"

echo -e "${G}✔${N} Versão: ${C}v${CURRENT}${N} → ${C}v${NEW}${N}"
echo ""
echo "Próximos passos:"
echo "  1. Atualize o CHANGELOG.md com as mudanças da v${NEW}"
echo "  2. git add -A && git commit -m \"chore: release v${NEW}\""
echo "  3. git tag -a v${NEW} -m \"v${NEW}\""
