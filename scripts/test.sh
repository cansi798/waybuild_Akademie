#!/usr/bin/env bash
# Playwright-Tests gegen dist/ (vorher scripts/bau.sh). Docker-Image passend zu @playwright/test 1.48.2.
#   scripts/test.sh [playwright-argumente]   z. B. scripts/test.sh --project=webkit
set -euo pipefail
cd "$(dirname "$0")/.."
docker run --rm -v "$PWD":/app -w /app -e BASE="${BASE:-/waybuild_Akademie}" -e HOME=/tmp \
  mcr.microsoft.com/playwright:v1.48.2-jammy npx playwright test "$@"
