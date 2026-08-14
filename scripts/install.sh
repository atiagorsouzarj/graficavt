#!/usr/bin/env bash
# =============================================================================
#  GrafCenter — INSTALADOR AUTOMÁTICO
#  Uso:  bash scripts/install.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERSION="$(cat VERSION 2>/dev/null || echo '0.0.0')"

# ---------- cores ----------
B='\033[1;34m'; G='\033[1;32m'; Y='\033[1;33m'; R='\033[1;31m'; C='\033[1;36m'; N='\033[0m'
say()  { echo -e "${C}▸${N} $*"; }
ok()   { echo -e "${G}✔${N} $*"; }
warn() { echo -e "${Y}!${N} $*"; }
err()  { echo -e "${R}✖${N} $*" >&2; }

banner() {
cat <<'EOF'
   ____            __ ____           _
  / ___|_ __ __ _ / _/ ___|___ _ __ | |_ ___ _ __
 | |  _| '__/ _` | |_| |   / _ \ '_ \| __/ _ \ '__|
 | |_| | | | (_| |  _| |__|  __/ | | | ||  __/ |
  \____|_|  \__,_|_|  \____\___|_| |_|\__\___|_|
        ERP + CRM para Gráfica Rápida
EOF
echo -e "${B}        Instalador v${VERSION}${N}\n"
}

banner

# ---------- 1. Pré-requisitos ----------
say "Verificando pré-requisitos..."

if ! command -v node >/dev/null 2>&1; then
  err "Node.js não encontrado. Instale Node.js 20+ (https://nodejs.org)"
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  err "Node.js 20+ é necessário (atual: $(node -v))"
  exit 1
fi
ok "Node.js $(node -v)"

if ! command -v npm >/dev/null 2>&1; then
  err "npm não encontrado."
  exit 1
fi
ok "npm $(npm -v)"

if command -v psql >/dev/null 2>&1; then
  ok "PostgreSQL client encontrado"
else
  warn "psql não encontrado — o banco precisa estar acessível via DATABASE_URL"
fi

# ---------- 2. Arquivo .env ----------
say "Configurando ambiente..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    ok "Criado .env a partir de .env.example"
    warn "Edite o .env e configure DATABASE_URL antes de continuar!"
  else
    echo "DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db" > .env
    ok "Criado .env padrão"
  fi
else
  ok ".env já existe (mantido)"
fi

# carrega DATABASE_URL
set +u
# shellcheck disable=SC1091
export $(grep -E '^DATABASE_URL=' .env | xargs) 2>/dev/null || true
set -u

if [ -z "${DATABASE_URL:-}" ]; then
  err "DATABASE_URL não definido no .env"
  exit 1
fi
ok "DATABASE_URL configurado"

# ---------- 3. Dependências ----------
say "Instalando dependências (isso pode levar alguns minutos)..."
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund 2>&1 | tail -3 || npm install --no-audit --no-fund 2>&1 | tail -3
else
  npm install --no-audit --no-fund 2>&1 | tail -3
fi
ok "Dependências instaladas"

# ---------- 4. Testa conexão com o banco ----------
say "Testando conexão com o banco de dados..."
if node -e "
const {Pool}=require('pg');
const p=new Pool({connectionString:process.env.DATABASE_URL, connectionTimeoutMillis:5000});
p.query('select 1').then(()=>{console.log('ok');p.end();}).catch(e=>{console.error(e.message);process.exit(1);});
" >/dev/null 2>&1; then
  ok "Banco de dados acessível"
else
  err "Não foi possível conectar ao banco. Verifique o DATABASE_URL no .env"
  err "Exemplo: postgresql://usuario:senha@localhost:5432/grafcenter"
  exit 1
fi

# ---------- 5. Schema ----------
say "Aplicando schema do banco (Drizzle)..."
npx drizzle-kit push 2>&1 | tail -3
ok "Schema aplicado"

# ---------- 6. Seed (opcional) ----------
echo ""
read -r -p "$(echo -e "${Y}?${N} Popular o banco com dados de demonstração? [s/N] ")" SEED_ANSWER || SEED_ANSWER="n"
if [[ "${SEED_ANSWER,,}" == "s" || "${SEED_ANSWER,,}" == "y" ]]; then
  say "Populando dados de demonstração..."
  node seed.mjs
  ok "Dados de demonstração inseridos"
else
  say "Pulando seed (banco permanece vazio)."
fi

# ---------- 7. Build ----------
say "Compilando aplicação para produção..."
npm run build 2>&1 | tail -5
ok "Build concluído"

# ---------- 8. Registra versão instalada ----------
mkdir -p .grafcenter
cat > .grafcenter/install.json <<EOF
{
  "version": "${VERSION}",
  "installedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "node": "$(node -v)"
}
EOF

echo ""
echo -e "${G}════════════════════════════════════════════════════${N}"
echo -e "${G}  ✔ Instalação concluída com sucesso! (v${VERSION})${N}"
echo -e "${G}════════════════════════════════════════════════════${N}"
echo ""
echo -e "  Iniciar em produção:  ${C}npm run start${N}"
echo -e "  Modo desenvolvimento: ${C}npm run dev${N}"
echo -e "  Atualizar o sistema:  ${C}bash scripts/update.sh${N}"
echo ""
echo -e "  Acesse: ${B}http://localhost:${PORT:-3000}${N}"
echo ""
