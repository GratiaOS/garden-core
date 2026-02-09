# cuib-quiet-node

Local audio ingester for Cuib Quiet Node (Pi 5 first target).

## Current scope

1. Captures microphone input with `cpal`.
2. Emits level telemetry per time window (RMS, peak, clip count).
3. Converts interleaved input to mono and emits fixed windows (default `0.96s`).
4. Runs startup auto-calibration (default `300s`) to learn local baseline.
5. Flags abrupt-event candidates after calibration using baseline-aware thresholding.

Calibration threshold:

`threshold_rms = max(mean_rms + abrupt_sigma * std_rms, mean_rms * db_to_linear(min_margin_db))`

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
  --window-secs 0.96 \
  --calibration-secs 300 \
  --abrupt-sigma 3.0 \
  --min-margin-db 6.0
```

## Notes

- `--device` does substring matching on input device name.
- If `--sample-rate` is omitted, the ingester prefers `16000 Hz` when supported.
- Auto-calibration can be disabled with `--calibration-secs 0`.
- `Ctrl+C` stops the stream cleanly.

## Next steps

1. Wire YAMNet/Coral inference on `AudioWindow.samples`.
2. Replace candidate warnings with class-aware fade policy.
3. Add sunset trigger adapter (light sensor + phone DND bridge).
