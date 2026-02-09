# cuib-quiet-node

Local audio ingester for Cuib Quiet Node (Pi 5 first target).

## Current scope

1. Captures microphone input with `cpal`.
2. Emits level telemetry per time window (RMS, peak, clip count).
3. Targets `16_000 Hz` by default to align with later YAMNet-style classification.

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
  --report-ms 1000
```

## Notes

- `--device` does substring matching on input device name.
- If `--sample-rate` is omitted, the ingester prefers `16000 Hz` when supported.
- `Ctrl+C` stops the stream cleanly.

## Next steps

1. Add Coral/YAMNet inference stage on buffered windows.
2. Add fade controller that attenuates abrupt event classes.
3. Add sunset trigger adapter (light sensor + phone DND bridge).
