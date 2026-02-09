#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="${1:-$SCRIPT_DIR/../assets}"

MODEL_URL="https://tfhub.dev/google/lite-model/yamnet/classification/tflite/1?lite-format=tflite"
LABELS_URL="https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/yamnet_class_map.csv"

MODEL_SHA256="10c95ea3eb9a7bb4cb8bddf6feb023250381008177ac162ce169694d05c317de"
LABELS_SHA256="cdf24d193e196d9e95912a2667051ae203e92a2ba09449218ccb40ef787c6df2"

MODEL_PATH="$ASSETS_DIR/yamnet.tflite"
LABELS_PATH="$ASSETS_DIR/yamnet_class_map.csv"

mkdir -p "$ASSETS_DIR"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

hash_file() {
  local file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file" | awk '{print $1}'
  else
    echo "missing sha256 tool (need sha256sum or shasum)" >&2
    return 1
  fi
}

check_tflite_magic() {
  local file="$1"
  local magic
  magic="$(dd if="$file" bs=1 skip=4 count=4 status=none 2>/dev/null || true)"
  if [[ "$magic" != "TFL3" ]]; then
    echo "invalid TFLite file: missing TFL3 magic in $file" >&2
    return 1
  fi
}

echo "Downloading YAMNet model..."
curl -fsSL "$MODEL_URL" -o "$TMP_DIR/yamnet.tflite"
check_tflite_magic "$TMP_DIR/yamnet.tflite"

actual_model_sha="$(hash_file "$TMP_DIR/yamnet.tflite")"
if [[ "$actual_model_sha" != "$MODEL_SHA256" ]]; then
  echo "model hash mismatch" >&2
  echo "expected: $MODEL_SHA256" >&2
  echo "actual:   $actual_model_sha" >&2
  exit 1
fi

echo "Downloading YAMNet labels..."
curl -fsSL "$LABELS_URL" -o "$TMP_DIR/yamnet_class_map.csv"

actual_labels_sha="$(hash_file "$TMP_DIR/yamnet_class_map.csv")"
if [[ "$actual_labels_sha" != "$LABELS_SHA256" ]]; then
  echo "labels hash mismatch" >&2
  echo "expected: $LABELS_SHA256" >&2
  echo "actual:   $actual_labels_sha" >&2
  exit 1
fi

mv "$TMP_DIR/yamnet.tflite" "$MODEL_PATH"
mv "$TMP_DIR/yamnet_class_map.csv" "$LABELS_PATH"

echo "Assets ready:"
ls -lh "$MODEL_PATH" "$LABELS_PATH"
