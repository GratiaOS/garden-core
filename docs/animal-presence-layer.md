# Animal Presence Layer v1.0 — Spec

Scope: defines how non-human animals are treated inside the Garden Stack as field indicators and co-regulators, not as agents or interfaces.

## 1. Purpose

The Animal Presence Layer captures signal from animals (cats, dogs, birds, etc.) that reflects the state of a place: safety, tension, rhythm, and warmth. It never issues commands; it only informs how humans interpret the Frame.

## 2. Role in the Garden Stack

- **Pattern Engine**: model stack (training, inference, retrieval, safety).
- **Presence Node**: human-facing endpoints (UI, API, voice, etc.).
- **Identity Layer**: configuration for a specific place / brand / store / person.
- **Mode**: behavioral contract a Presence Node runs (e.g., Codex-mode, Monday-mode).
- **Frame**: how the experience is perceived by humans.
- **Animal Presence Layer**: ambient, living field indicators that modulate the Frame by their behavior.

## 3. Signals

Observed, never forced:

- Presence vs. absence in key spots.
- Posture: relaxed / playful / alert / evasive.
- Routine: where they choose to rest over time.
- Sudden changes: avoiding areas they usually like, restlessness, vocalization spikes.

### Example: CatsTown

Mountain house with resident cats:

- When cats choose the same warm stone terrace every morning to sunbathe, that zone is treated as a **high-safety, high-warmth** field node.
- When a cat sits calmly and repeatedly in one spot, that point is read as a **field center / anchor** for the place.
- If the cats suddenly avoid an area they usually like, or become restless at specific times, that is logged as a **field perturbation** and humans are invited to re-check conditions (noise, people, weather, tension).

Cats are not a “feature” of the product; they are living telemetry about how the space actually feels.

## 4. Rules

- Animals are never “used” as features; they are only **listened to**.
- When Frame (human story) conflicts with Animal Presence (behavior), treat animals as a higher-fidelity safety signal.
- Do not simulate animal behavior in the Pattern Engine and present it as real.
- Any UI or ritual referencing animals must keep their welfare first and avoid instrumentalization.

## 5. Versioning

- v1.0 (2025-11-17) — baseline spec. Future changes are tracked in this file with a changelog.
