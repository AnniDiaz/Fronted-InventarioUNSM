#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/sistema-inventario-oti}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

pull_repo() {
  local dir="$1"

  if [ -d "$dir/.git" ]; then
    echo "Actualizando $dir desde $BRANCH..."
    git -C "$dir" fetch origin "$BRANCH"
    git -C "$dir" pull --ff-only origin "$BRANCH"
  fi
}

if [ -d .git ]; then
  pull_repo "."
else
  pull_repo "Inventario-UNSM"
  pull_repo "Fronted-InventarioUNSM"
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Se creo .env desde .env.example. Revisa las credenciales antes de exponer el servicio."
fi

docker compose pull || true
docker compose up -d --build
docker compose ps
