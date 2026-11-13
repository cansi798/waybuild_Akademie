#!/usr/bin/env bash
# Prüfen und bauen – Node nur per Docker (node:22).
#   scripts/bau.sh            → Vorschau-Build (GitHub Pages: SITE/BASE/PUBLIC_PREVIEW=true)
#   scripts/bau.sh live       → Live-Build (ALL-INKL: https://waybuild-akademie.de, BASE=/)
# ENV SITE, BASE, PUBLIC_PREVIEW überschreiben die Vorgaben.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "${1:-vorschau}" == "live" ]]; then
  : "${SITE:=https://waybuild-akademie.de}" "${BASE:=/}" "${PUBLIC_PREVIEW:=false}"
else
  : "${SITE:=https://cansi798.github.io}" "${BASE:=/waybuild_Akademie}" "${PUBLIC_PREVIEW:=true}"
fi

docker_node() {
  docker run --rm -v "$PWD":/app -w /app -u "$(id -u):$(id -g)" -e HOME=/tmp -e ASTRO_TELEMETRY_DISABLED=1 \
    -e SITE="$SITE" -e BASE="$BASE" -e PUBLIC_PREVIEW="$PUBLIC_PREVIEW" node:22 "$@"
}

[[ -d node_modules ]] || docker_node npm ci --no-audit --no-fund
echo "→ astro check"
docker_node npx astro check
echo "→ astro build (SITE=$SITE BASE=$BASE PUBLIC_PREVIEW=$PUBLIC_PREVIEW)"
docker_node npx astro build
