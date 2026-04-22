#!/usr/bin/env sh
# Build web image then run container and hit / (same entrypoint as Cloud Run).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TAG="${DOCKER_WEB_TAG:-vector-web:local}"
PORT="${DOCKER_WEB_PORT:-3000}"

bash scripts/docker-web-build.sh

cid="$(docker run -d -p "${PORT}:3000" "${TAG}")"
cleanup() {
  docker rm -f "${cid}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Waiting for http://127.0.0.1:${PORT}/ ..."
i=0
while [ "$i" -lt 60 ]; do
  if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
    echo "Smoke OK (HTTP 200 from /)"
    exit 0
  fi
  i=$((i + 1))
  sleep 1
done

echo "Smoke FAILED: no response on port ${PORT}"
exit 1
