#!/usr/bin/env bash
# =============================================================================
#  GrafCenter — ATUALIZADOR AUTOMÁTICO
#  Uso:  bash scripts/update.sh  [--no-backup] [--no-git]
#  Faz: backup do banco -> git pull -> deps -> migração -> build
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

B='\033[1;34m'; G='\033[1;32m'; Y='\033[1;33m'; R='\033[1;31m'; C='\033[1;36m'; N='\033[0m'
say()  { echo -e "${C}▸${N} $*"; }
ok()   { echo -e "${G}✔${N} $*"; }
warn() { echo -e "${Y}!${N} $*"; }
err()  { echo -e "${R}✖${N} $*" >&2; }

DO_BACKUP=1
DO_GIT=1
for arg in "$@"; do
  case "$arg" in
    --no-backup) DO_BACKUP=0 ;;
    --no-git)    DO_GIT=0 ;;
  esac
done

OLD_VERSION="$(cat VERSION 2>/dev/null || echo '0.0.0')"

echo -e "${B}╔══════════════════════════════════════════════╗${N}"
echo -e "${B}║   GrafCenter — Atualizador                   ║${N}"
echo -e "${B}╚══════════════════════════════════════════════╝${N}"
echo -e "  Versão atual: ${C}v${OLD_VERSION}${N}\n"

# carrega env
set +u
export $(grep -E '^DATABASE_URL=' .env 2>/dev/null | xargs) 2>/dev/null || true
set -u

# ---------- 1. Backup do banco ----------
if [ "$DO_BACKUP" -eq 1 ]; then
  if command -v pg_dump >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
    say "Criando backup do banco de dados..."
    mkdir -p backups
    STAMP="$(date +%Y%m%d_%H%M%S)"
    BACKUP_FILE="backups/grafcenter_${OLD_VERSION}_${STAMP}.sql"
    if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
      gzip -f "$BACKUP_FILE" 2>/dev/null || true
      ok "Backup salvo: ${BACKUP_FILE}.gz"
    else
      warn "pg_dump falhou — seguindo sem backup"
    fi
  else
    warn "pg_dump indisponível — pulando backup"
  fi
else
  warn "Backup desativado (--no-backup)"
fi

# ---------- 2. Git pull ----------
if [ "$DO_GIT" -eq 1 ] && [ -d .git ]; then
  say "Buscando atualizações do repositório..."
  if git diff --quiet && git diff --cached --quiet; then
    git pull --ff-only 2>&1 | tail -3 || warn "git pull falhou (siga manualmente)"
    ok "Repositório atualizado"
  else
    warn "Há alterações locais não commitadas — pulando git pull"
    warn "Faça commit/stash antes de atualizar para evitar conflitos."
  fi
else
  say "Pulando git (não é repositório ou --no-git)"
fi

NEW_VERSION="$(cat VERSION 2>/dev/null || echo "$OLD_VERSION")"

# ---------- 3. Dependências ----------
say "Atualizando dependências..."
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund 2>&1 | tail -3 || npm install --no-audit --no-fund 2>&1 | tail -3
else
  npm install --no-audit --no-fund 2>&1 | tail -3
fi
ok "Dependências atualizadas"

# ---------- 4. Migração do schema ----------
say "Aplicando alterações de schema..."
npx drizzle-kit push 2>&1 | tail -3
ok "Schema atualizado"

# ---------- 5. Build ----------
say "Recompilando aplicação..."
npm run build 2>&1 | tail -5
ok "Build concluído"

# ---------- 6. Registra ----------
mkdir -p .grafcenter
cat > .grafcenter/install.json <<EOF
{
  "version": "${NEW_VERSION}",
  "previousVersion": "${OLD_VERSION}",
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "node": "$(node -v)"
}
EOF

echo ""
echo -e "${G}════════════════════════════════════════════════════${N}"
if [ "$OLD_VERSION" != "$NEW_VERSION" ]; then
  echo -e "${G}  ✔ Atualizado: v${OLD_VERSION} → v${NEW_VERSION}${N}"
else
  echo -e "${G}  ✔ Sistema atualizado (v${NEW_VERSION})${N}"
fi
echo -e "${G}════════════════════════════════════════════════════${N}"
echo ""
echo -e "  Reinicie o servidor:  ${C}npm run start${N}"
echo -e "  Com PM2:              ${C}pm2 restart grafcenter${N}"
echo ""
