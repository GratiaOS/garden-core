# cuib-quiet-node

Local audio ingester for Cuib Quiet Node (Pi 5 first target).

## Current scope

1. Captures microphone input with `cpal`.
2. Emits level telemetry per time window (RMS, peak, clip count).
3. Converts interleaved input to mono and emits fixed windows (default `0.975s`, 15600 samples @ 16k).
4. Runs startup auto-calibration (default `300s`) to learn local baseline.
5. Flags abrupt-event candidates after calibration using baseline-aware thresholding.
6. Runs optional local TFLite inference and returns top-k labels per window.
7. Marks top classes into `organic | fade | neutral` categories.
8. Applies a fade state machine (`DeepQuiet | GentleFilter | Normal`) with quiet-hour sensitivity.

Calibration threshold:

`threshold_rms = max(mean_rms + abrupt_sigma * std_rms, mean_rms * db_to_linear(min_margin_db))`

## Assets

Expected paths:

- Model: `assets/yamnet.tflite`
- Labels: `assets/yamnet_class_map.csv`

Inference backends:

- `v2` (recommended): `tflite-dyn` + system `libtensorflowlite_c` runtime.
- `legacy` (rollback only): `tflite` crate `0.9.8`.

To build with v2 runtime:

```bash
cargo run --release --features tflite-runtime-v2 -- ...
```

## Run

```bash
cd cuib-quiet-node
cargo run --release
```

Options:

```bash
cargo run --release -- \
  --device "USB" \
  --sample-rate 16000 \
  --channels 1 \
  --report-ms 1000 \
  --window-secs 0.975 \
  --calibration-secs 300 \
  --abrupt-sigma 3.0 \
  --min-margin-db 6.0 \
  --model-path assets/yamnet.tflite \
  --labels-path assets/yamnet_class_map.csv \
  --top-k 3 \
  --fade-deep-threshold 0.70 \
  --fade-gentle-threshold 0.35 \
  --fade-night-factor 0.70 \
  --fade-night-start 20 \
  --fade-night-end 6
```

Inference-enabled run (v2):

```bash
cargo run --release --features tflite-runtime-v2 -- \
  --sample-rate 16000 \
  --window-secs 0.975 \
  --model-path assets/yamnet.tflite \
  --labels-path assets/yamnet_class_map.csv \
  --inference-backend v2
```

Strict startup (fail if inference cannot initialize):

```bash
cargo run --release --features tflite-runtime-v2 -- \
  --sample-rate 16000 \
  --window-secs 0.975 \
  --model-path assets/yamnet.tflite \
  --labels-path assets/yamnet_class_map.csv \
  --inference-backend v2 \
  --require-inference
```

## Notes

- `--device` does substring matching on input device name.
- If `--sample-rate` is omitted, the ingester prefers `16000 Hz` when supported.
- Auto-calibration can be disabled with `--calibration-secs 0`.
- Inference is enabled only when both `--model-path` and `--labels-path` are provided.
- If inference init fails and `--require-inference` is not passed, the node continues in audio-only mode.
- `--inference-backend` supports `legacy | v2 | auto` (default: `legacy` for now).
- Fade thresholds can be tuned from CLI without code changes.
- `Ctrl+C` stops the stream cleanly.

## Fetch YAMNet assets

Download and verify canonical assets:

```bash
./scripts/fetch-yamnet-assets.sh
```

Manual source references:

- Model URL: `https://tfhub.dev/google/lite-model/yamnet/classification/tflite/1?lite-format=tflite`
- Labels URL: `https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/yamnet_class_map.csv`

Expected SHA-256:

- `yamnet.tflite`: `10c95ea3eb9a7bb4cb8bddf6feb023250381008177ac162ce169694d05c317de`
- `yamnet_class_map.csv`: `cdf24d193e196d9e95912a2667051ae203e92a2ba09449218ccb40ef787c6df2`

If you see `Op builtin_code out of range`, the model requires newer TensorFlow Lite than the bundled runtime in `tflite` crate `0.9.8`.

Use `v2` backend to avoid that incompatibility.

## Pi TFLite Runtime Setup

Install `libtensorflowlite_c` on Pi before running `--inference-backend v2`:

```bash
./scripts/setup-tflite-runtime-pi.sh
```

Modes:

```bash
./scripts/setup-tflite-runtime-pi.sh auto
./scripts/setup-tflite-runtime-pi.sh coral
./scripts/setup-tflite-runtime-pi.sh manual
```

## Pi Runner Bootstrap (Unattended)

Use this when you want reproducible GitHub Actions self-hosted setup on Pi.

1. Create an ephemeral registration token:

```bash
gh api -X POST repos/GratiaOS/garden-core/actions/runners/registration-token --jq .token
```

2. Run unattended setup on Pi:

```bash
RUNNER_URL="https://github.com/GratiaOS/garden-core" \
RUNNER_TOKEN="<paste_token_here>" \
./cuib-quiet-node/scripts/setup-gh-runner-unattended.sh
```

3. Confirm runner state (from any machine with `gh` auth):

```bash
gh api repos/GratiaOS/garden-core/actions/runners \
  --jq '.runners[] | [.name,.status,.busy] | @tsv'
```

## Next steps

1. Add EdgeTPU delegate wiring (`libedgetpu`) for Coral execution path.
2. Replace candidate warnings with class-aware fade controller.
3. Add sunset trigger adapter (light sensor + phone DND bridge).
