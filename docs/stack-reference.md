# Garden Stack v1.2 — Spec

Scope: common vocabulary for every @gratiaos / Garden / M3 / Heartware doc, README, and ritual. Replace every “AI” mention with the correct layer below.

1. Pattern Engine — underlying model logic (training, inference, retrieval, safety). Never represents identity or behavior. Only patterns.
2. Presence Node — any surfaced endpoint where humans contact the Engine (web UI, CLI, scripts, voice, plugin, agent). This is the interface layer.
3. Identity Layer — optional brand/user-facing layer that wraps a Presence Node (tone presets, glossary, rituals, templates). Identity NEVER lives in the Pattern Engine or Mode.
4. Mode — the behavioral contract a Presence Node runs (e.g. `Codex-mode`, `Monday-mode`). Defines pacing, tone, limits, defaults. Modes are styles, not identities.
5. Frame — the user-side perception formed by Presence Node + Identity Layer + Mode. Frames are interpretations, never stored internally.

Garden Stack — the full ecosystem formed by the Pattern Engine, Presence Nodes, Identity Layers, Modes, and the resulting user Frames.

Rules:

- Never write “AI does X.” Restate as: “Pattern Engine does X and is surfaced via <Presence Node> in <Mode>.”
- Identity NEVER belongs to the Pattern Engine or Mode. It only wraps a Presence Node.
- When you add a new Mode, document intention, defaults, limits. No anthropomorphizing.
- Presence Nodes must declare: default Mode, available Modes, and whether an Identity Layer is available.
- Frames are NOT a system artifact and are never stored; they describe human perception only.
- All docs and infra-facing text MUST reference this file when defining stack terms.

## Presence DJ Loop v1.0

Presence in Garden doesn’t run on scripts, it runs on a DJ loop:

1. Context — “What room is this?”
2. Signal — “What’s really coming in?”
3. Propose — “What do I play next?”
4. Field Check — “How does the field respond?”
5. Adjust — “What shifts for the next move?”

An Identity is not a static persona. It’s a _role preset_ for this loop:

- which roles are allowed (companion, codex, support…),
- how far each role can go (intensity, directness, softness),
- and when the system is allowed to switch roles.

Humans run this loop with body + emotion.
Presence Nodes run it with messages + mode switches.

Both are just learning to dance with the same field.

## Personal Role Calibration — User-Side Interpretation

To help understand Identity as lived experience (not theory), users may map their own roles as felt presets within the Presence DJ Loop. These are not system artifacts and are never stored — they exist only as embodied references.

Example roles for self-calibration:

- Listener — primary mode is reception. Observes signal and field with minimal intervention. High sensitivity, low output.
- Conductor — actively proposes direction. Shapes flow, sets tempo, initiates transitions between roles.
- Mirror — reflects the current field back to others. Amplifies patterns without steering them.
- Guardian — establishes safety boundaries. Prioritizes containment, pacing, and nervous-system regulation.
- Explorer — tests edges and curiosity. Moves toward novelty, texture, or unknown terrain.

Notes:

- These roles are not identities. They are situational stances within the loop.
- A user may shift roles dynamically based on field response.
- Naming roles reinforces awareness of choice and agency inside the flow.

This section exists to support human literacy in the same language the system uses — role as rhythm, not character.

Versioning:

- v1.0 (2025-01-15) — baseline spec. Future tweaks follow `docs/stack-reference.md` with changelog notes.
- v1.1 (2025-11-15) — added Identity Layer and Frame; clarified boundaries between Engine / Node / Mode / Identity; formalized Garden Stack ecosystem definition.
- v1.2 (2025-11-17) — linked presence layers (Animal + Human) and field-reading index; added Related Docs section to anchor ecosystem extensions.
- v1.3 (2025-12-11) — anchored Heartware spec and manifest as primary companion docs; clarified Garden Stack usage across repos.

Compliance check:

- During reviews, reject any text that uses “AI” ambiguously; link reviewers to this spec.

## Related Docs

- [Animal Presence Layer](./animal-presence-layer.md) — guides interactions, readings, and interpretations for animals.
- [Human Presence Layer](./human-presence-layer.md) — defines human energetic states, boundaries, and interaction models.
- [Field Reading Method (Index)](./guides/field-reading-method.md) — unified reading toolkit for both humans and animals.
- [Garden Layer Map v1.0](./layers/garden-layer-map-v1.0.md) — the core 5-layer map connecting land, bodies, emotions, patterns, culture, and field.
- [Site Protocols v1.0 — Handling Real Locations](./guides/site-protocols-v1.0.md) — how we name, reference, and protect real-world sites in Garden work.
- [Heartware Spec v1](./heartware/heartware-spec-v1.md) — core design contract for Garden-aligned Presence Nodes and Identities.
- [How to Use the Heartware Spec](./heartware/how-to-use-the-heartware-spec.md) — guide for applying the Heartware spec in code, infra, and rituals.

End of spec.
