#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: $0 <env> <command> [args...]" >&2
  echo "  command   terraform subcommand, or: sync-images" >&2
  echo "examples:" >&2
  echo "  $0 nonprod init" >&2
  echo "  $0 nonprod plan" >&2
  echo "  $0 nonprod apply" >&2
  echo "  $0 nonprod sync-images   # write api_image/web_image into envs/<env>.tfvars from Cloud Run" >&2
  echo >&2
  echo "Public vars: envs/<env>.tfvars (committed). Secrets: envs/<env>.secrets.tfvars (gitignored); copy from *.secrets.tfvars.example" >&2
  echo "plan/apply/destroy/refresh/import: resolves Cloud Run images and passes -var overrides (set VECTOR_TF_NO_SYNC_IMAGES=1 or use --no-sync-images to skip)." >&2
  echo >&2
  echo "Tip: use ./tf.sh or ../scripts/tf so a shell alias named tf does not invoke terraform directly." >&2
  exit 1
}

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

read_tfvar() {
  local file=$1 key=$2
  grep -E "^[[:space:]]*${key}[[:space:]]*=" "$file" | head -1 | sed -E "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*\"([^\"]*)\".*/\1/"
}

fetch_cloud_run_image() {
  local project=$1 region=$2 service=$3
  gcloud run services describe "$service" \
    --project="$project" \
    --region="$region" \
    --format='value(spec.template.spec.containers[0].image)' 2>/dev/null || true
}

sync_cloud_run_images_to_tfvars() {
  local env=$1
  local tfvars="envs/${env}.tfvars"
  [[ -f "$tfvars" ]] || {
    echo "error: missing $tfvars" >&2
    exit 1
  }
  local project region api web
  project="$(read_tfvar "$tfvars" project_id)"
  region="$(read_tfvar "$tfvars" region)"
  [[ -n "$project" && -n "$region" ]] || {
    echo "error: could not read project_id/region from $tfvars" >&2
    exit 1
  }
  command -v gcloud >/dev/null 2>&1 || {
    echo "error: gcloud not found" >&2
    exit 1
  }
  api="$(fetch_cloud_run_image "$project" "$region" vector-api)"
  web="$(fetch_cloud_run_image "$project" "$region" vector-web)"
  [[ -n "$api" && -n "$web" ]] || {
    echo "error: could not read images from Cloud Run (check auth: gcloud auth login && gcloud config set project $project)" >&2
    exit 1
  }
  python3 -c "
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
api, web = sys.argv[2], sys.argv[3]
text = path.read_text()

def set_var(t, key, val):
    pat = rf'^(\\s*{re.escape(key)}\\s*=\\s*)\".*?\"(\\s*)\$'
    n_t, n = re.subn(pat, rf'\\g<1>\"{val}\"\\g<2>', t, flags=re.M)
    if n:
        return n_t
    if t and not t.endswith('\\n'):
        t += '\\n'
    return t + f'{key} = \"{val}\"\\n'

text = set_var(text, 'api_image', api)
text = set_var(text, 'web_image', web)
path.write_text(text)
print(f'Updated {path}: api_image, web_image')
" "$ROOT/$tfvars" "$api" "$web"
}

cd "$ROOT"

[[ $# -ge 2 ]] || usage

ENV="$1"
shift
TF_CMD="$1"
shift

TFVARS="envs/${ENV}.tfvars"
TFSECRETS="envs/${ENV}.secrets.tfvars"
BACKEND="envs/${ENV}.backend.hcl"

if [[ ! -f "$TFVARS" ]]; then
  echo "error: missing var-file $TFVARS (env '${ENV}'?)" >&2
  exit 1
fi
if [[ ! -f "$BACKEND" ]]; then
  echo "error: missing backend config $BACKEND" >&2
  exit 1
fi

if [[ "$TF_CMD" == "sync-images" ]]; then
  sync_cloud_run_images_to_tfvars "$ENV"
  exit 0
fi

SYNC_IMAGES=1
[[ "${VECTOR_TF_NO_SYNC_IMAGES:-}" == "1" ]] && SYNC_IMAGES=0

TERRAFORM_ARGS=()
while (($#)); do
  if [[ "$1" == "--no-sync-images" ]]; then
    SYNC_IMAGES=0
    shift
    continue
  fi
  TERRAFORM_ARGS+=("$1")
  shift
done

EXTRA=()
case "$TF_CMD" in
  init)
    EXTRA=(-backend-config="$BACKEND")
    ;;
  plan|apply|destroy|refresh|import)
    EXTRA=(-var-file="$TFVARS")
    [[ -f "$TFSECRETS" ]] && EXTRA+=(-var-file="$TFSECRETS")

    if [[ "$SYNC_IMAGES" == "1" ]] && command -v gcloud >/dev/null 2>&1; then
      PROJECT="$(read_tfvar "$TFVARS" project_id)"
      REGION="$(read_tfvar "$TFVARS" region)"
      if [[ -n "$PROJECT" && -n "$REGION" ]]; then
        API_IMAGE="$(fetch_cloud_run_image "$PROJECT" "$REGION" vector-api)"
        WEB_IMAGE="$(fetch_cloud_run_image "$PROJECT" "$REGION" vector-web)"
        if [[ -n "$API_IMAGE" && -n "$WEB_IMAGE" ]]; then
          EXTRA+=(-var="api_image=${API_IMAGE}" -var="web_image=${WEB_IMAGE}")
        else
          echo "warn: could not resolve Cloud Run images; using api_image/web_image from tfvars (may be empty)." >&2
        fi
      fi
    elif [[ "$SYNC_IMAGES" == "1" ]]; then
      echo "warn: gcloud not in PATH; skipping Cloud Run image sync (VECTOR_TF_NO_SYNC_IMAGES=1 silences this)." >&2
    fi
    ;;
  validate|console)
    EXTRA=(-var-file="$TFVARS")
    [[ -f "$TFSECRETS" ]] && EXTRA+=(-var-file="$TFSECRETS")
    ;;
  *)
    ;;
esac

exec terraform "$TF_CMD" "${EXTRA[@]}" "${TERRAFORM_ARGS[@]}"
