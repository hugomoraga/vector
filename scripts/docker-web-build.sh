#!/usr/bin/env bash
# Build the web image like CI (.github/workflows/deploy.yml).
# Loads apps/web/.env.local if present (Next convention), then applies defaults only for unset keys.
# Override: NEXT_PUBLIC_API_URL=... npm run docker:web
# Custom env file: WEB_ENV_FILE=./path/.env npm run docker:web
set -eo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

load_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  echo "Loading build args from: $f"
  set -a
  # shellcheck disable=SC1090
  source "$f"
  set +a
}

if [[ -n "${WEB_ENV_FILE:-}" ]]; then
  load_env_file "$WEB_ENV_FILE"
elif [[ -f apps/web/.env.local ]]; then
  load_env_file apps/web/.env.local
fi

: "${NEXT_PUBLIC_API_URL:=http://localhost:3001}"
: "${NEXT_PUBLIC_FIREBASE_API_KEY:=local-placeholder}"
: "${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:=local-placeholder.firebaseapp.com}"
: "${NEXT_PUBLIC_FIREBASE_PROJECT_ID:=vector-app-nonprod}"
: "${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:=local-placeholder.appspot.com}"
: "${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:=000000000000}"
: "${NEXT_PUBLIC_FIREBASE_APP_ID:=1:000000000000:web:0000000000000000}"

TAG="${DOCKER_WEB_TAG:-vector-web:local}"

echo "Building ${TAG} (override image with DOCKER_WEB_TAG=...)"
docker build \
  -f apps/web/Dockerfile \
  --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
  --build-arg "NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}" \
  --build-arg "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}" \
  --build-arg "NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
  --build-arg "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}" \
  --build-arg "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}" \
  --build-arg "NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}" \
  -t "${TAG}" \
  .

echo "OK: ${TAG}"
