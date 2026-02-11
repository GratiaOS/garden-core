#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-auto}"
TF_VERSION="2.14.0"

install_via_coral() {
  echo "[tflite] installing runtime via Coral apt repo"
  echo "deb https://packages.cloud.google.com/apt coral-edgetpu-stable main" \
    | sudo tee /etc/apt/sources.list.d/coral-edgetpu.list >/dev/null

  curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg \
    | sudo apt-key add - >/dev/null

  sudo apt-get update
  sudo apt-get install -y libedgetpu1-std
}

install_manual() {
  echo "[tflite] installing runtime manually from TensorFlow release"

  local tmp_dir
  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' RETURN

  local url="https://github.com/tensorflow/tensorflow/releases/download/v${TF_VERSION}/libtensorflowlite_c-linux-aarch64.tar.gz"
  local archive="$tmp_dir/libtensorflowlite_c.tar.gz"

  curl -fL "$url" -o "$archive"
  tar -xzf "$archive" -C "$tmp_dir"

  local so_file
  so_file="$(find "$tmp_dir" -name 'libtensorflowlite_c.so*' | head -n1 || true)"
  if [[ -z "$so_file" ]]; then
    echo "[tflite] libtensorflowlite_c.so not found in downloaded archive" >&2
    exit 1
  fi

  sudo cp "$so_file" /usr/local/lib/libtensorflowlite_c.so
  echo '/usr/local/lib' | sudo tee /etc/ld.so.conf.d/tflite-runtime.conf >/dev/null
  sudo ldconfig
}

verify_runtime() {
  if ldconfig -p | grep -q 'libtensorflowlite_c'; then
    echo "[tflite] runtime available"
    ldconfig -p | grep 'libtensorflowlite_c'
  else
    echo "[tflite] runtime missing after installation" >&2
    exit 1
  fi
}

if [[ "$(uname -m)" != "aarch64" ]]; then
  echo "[tflite] warning: expected aarch64 host, got $(uname -m)"
fi

if ldconfig -p | grep -q 'libtensorflowlite_c'; then
  echo "[tflite] runtime already present"
  verify_runtime
  exit 0
fi

case "$MODE" in
  coral)
    install_via_coral
    ;;
  manual)
    install_manual
    ;;
  auto)
    if install_via_coral; then
      :
    else
      echo "[tflite] coral install failed, falling back to manual"
      install_manual
    fi
    ;;
  *)
    echo "usage: $0 [auto|coral|manual]" >&2
    exit 2
    ;;
esac

verify_runtime
