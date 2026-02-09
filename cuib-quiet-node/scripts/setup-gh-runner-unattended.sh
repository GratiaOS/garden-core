#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   RUNNER_URL="https://github.com/GratiaOS/garden-core" \
#   RUNNER_TOKEN="<ephemeral_registration_token>" \
#   ./cuib-quiet-node/scripts/setup-gh-runner-unattended.sh
#
# Optional env:
#   RUNNER_VERSION=2.331.0
#   RUNNER_ROOT=/opt/actions-runner
#   RUNNER_USER=<linux_user>
#   RUNNER_UNIX_GROUP=<linux_group_for_chown>
#   RUNNER_NAME=<hostname-based-name>
#   RUNNER_LABELS="self-hosted,linux,ARM64,pi5,cuib"
#   RUNNER_GROUP=Default
#   RUNNER_WORK=_work
#   RUNNER_SHA256=<sha256_for_tarball>

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

require_cmd curl
require_cmd tar
require_cmd sudo
require_cmd sha256sum

os_name="$(uname -s)"
if [[ "${os_name}" != "Linux" ]]; then
  echo "unsupported OS: ${os_name}" >&2
  echo "this script targets Linux (Pi). Run it on the Raspberry Pi host." >&2
  exit 1
fi

if [[ -z "${RUNNER_URL:-}" ]]; then
  echo "RUNNER_URL is required (example: https://github.com/GratiaOS/garden-core)" >&2
  exit 1
fi

if [[ -z "${RUNNER_TOKEN:-}" ]]; then
  echo "RUNNER_TOKEN is required (ephemeral registration token from GitHub)" >&2
  exit 1
fi

arch="$(uname -m)"
case "$arch" in
  aarch64|arm64) runner_arch="arm64" ;;
  x86_64|amd64) runner_arch="x64" ;;
  *)
    echo "unsupported architecture: $arch" >&2
    exit 1
    ;;
esac

RUNNER_VERSION="${RUNNER_VERSION:-2.331.0}"
RUNNER_ROOT="${RUNNER_ROOT:-/opt/actions-runner}"
RUNNER_USER="${RUNNER_USER:-$USER}"
RUNNER_UNIX_GROUP="${RUNNER_UNIX_GROUP:-$(id -gn "${RUNNER_USER}" 2>/dev/null || true)}"
RUNNER_NAME="${RUNNER_NAME:-$(hostname)-cuib}"
RUNNER_LABELS="${RUNNER_LABELS:-self-hosted,linux,ARM64,pi5,cuib}"
RUNNER_GROUP="${RUNNER_GROUP:-Default}"
RUNNER_WORK="${RUNNER_WORK:-_work}"
RUNNER_SHA256="${RUNNER_SHA256:-}"

tarball="actions-runner-linux-${runner_arch}-${RUNNER_VERSION}.tar.gz"
download_url="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${tarball}"

echo "Preparing runner in ${RUNNER_ROOT}"
sudo mkdir -p "${RUNNER_ROOT}"
if [[ -n "${RUNNER_UNIX_GROUP}" ]]; then
  sudo chown "${RUNNER_USER}:${RUNNER_UNIX_GROUP}" "${RUNNER_ROOT}"
else
  sudo chown "${RUNNER_USER}" "${RUNNER_ROOT}"
fi

cd "${RUNNER_ROOT}"

if [[ ! -f "${tarball}" ]]; then
  echo "Downloading ${tarball}"
  curl -fsSL -o "${tarball}" "${download_url}"
else
  echo "Using existing tarball ${tarball}"
fi

if [[ -n "${RUNNER_SHA256}" ]]; then
  echo "${RUNNER_SHA256}  ${tarball}" | sha256sum -c -
fi

if [[ ! -f "./config.sh" ]]; then
  echo "Extracting runner package"
  tar xzf "./${tarball}"
fi

echo "Configuring runner (name=${RUNNER_NAME}, labels=${RUNNER_LABELS})"
./config.sh \
  --unattended \
  --replace \
  --url "${RUNNER_URL}" \
  --token "${RUNNER_TOKEN}" \
  --name "${RUNNER_NAME}" \
  --runnergroup "${RUNNER_GROUP}" \
  --labels "${RUNNER_LABELS}" \
  --work "${RUNNER_WORK}"

echo "Installing and starting system service"
sudo ./svc.sh install "${RUNNER_USER}"
sudo ./svc.sh start
sudo ./svc.sh status || true

echo "Runner setup complete."
echo "Verify in GitHub: Settings -> Actions -> Runners (status should become Online/Idle)."
