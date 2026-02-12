#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-auto}"
CORAL_KEYRING="/usr/share/keyrings/coral-edgetpu-archive-keyring.gpg"
CORAL_LIST="/etc/apt/sources.list.d/coral-edgetpu.list"
TFLITE_RE='libtensorflowlite_c|libtensorflowlite\.so|libtensorflow-lite\.so'

ensure_coral_repo() {
  if ! command -v gpg >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y gnupg
  fi

  curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg \
    | gpg --dearmor \
    | sudo tee "$CORAL_KEYRING" >/dev/null

  echo "deb [signed-by=$CORAL_KEYRING] https://packages.cloud.google.com/apt coral-edgetpu-stable main" \
    | sudo tee "$CORAL_LIST" >/dev/null
}

install_via_coral() {
  echo "[tflite] installing runtime via Coral apt repo"
  ensure_coral_repo
  sudo apt-get update
  sudo apt-get install -y libedgetpu1-std
  ensure_compat_symlinks
}

install_via_apt_candidates() {
  echo "[tflite] trying distro packages for libtensorflowlite_c"
  sudo apt-get update

  local candidates=(
    libtensorflowlite0
    libtensorflowlite2
    libtensorflowlite2.14
    libtensorflow-lite2.14.1
    libtensorflowlite-dev
    libtensorflow-lite-dev
    libtensorflow-lite2
    python3-tflite-runtime
  )

  local pkg
  for pkg in "${candidates[@]}"; do
    if apt-cache show "$pkg" >/dev/null 2>&1; then
      echo "[tflite] installing candidate package: $pkg"
      sudo apt-get install -y "$pkg" || true
      sudo ldconfig
      if ldconfig -p | grep -Eq "$TFLITE_RE"; then
        return 0
      fi
    fi
  done

  return 1
}

ensure_compat_symlinks() {
  local hyphen_path=""
  hyphen_path="$(ldconfig -p | awk '/libtensorflow-lite\.so/{print $NF; exit}')"

  if [[ -n "$hyphen_path" && -f "$hyphen_path" ]]; then
    sudo ln -sf "$hyphen_path" /usr/local/lib/libtensorflowlite.so
    sudo ln -sf "$hyphen_path" /usr/local/lib/libtensorflowlite.so.2
    sudo ldconfig
  fi
}

verify_runtime() {
  if ldconfig -p | grep -Eq "$TFLITE_RE"; then
    echo "[tflite] runtime available"
    ldconfig -p | grep -E "$TFLITE_RE"
    return 0
  else
    echo "[tflite] runtime missing after installation" >&2
    return 1
  fi
}

if [[ "$(uname -m)" != "aarch64" ]]; then
  echo "[tflite] warning: expected aarch64 host, got $(uname -m)"
fi

if ldconfig -p | grep -Eq "$TFLITE_RE"; then
  echo "[tflite] runtime already present"
  verify_runtime
  exit 0
fi

case "$MODE" in
  coral)
    install_via_coral
    ;;
  manual)
    install_via_apt_candidates
    ensure_compat_symlinks
    ;;
  auto)
    install_via_coral || true
    ensure_compat_symlinks
    if verify_runtime; then
      exit 0
    fi

    echo "[tflite] coral path did not expose runtime, trying distro fallback"
    install_via_apt_candidates || true
    ensure_compat_symlinks

    if verify_runtime; then
      exit 0
    fi

    echo "[tflite] coral + distro fallback both failed" >&2
    echo "[tflite] please install libtensorflowlite_c/libtensorflowlite/libtensorflow-lite manually on this host" >&2
    exit 1
    ;;
  *)
    echo "usage: $0 [auto|coral|manual]" >&2
    exit 2
    ;;
esac

verify_runtime
