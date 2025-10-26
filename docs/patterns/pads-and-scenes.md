# 🪴 Pads & Scenes Pattern

In the Garden UX, **Pads** are the interactive pitstops along the Track, each offering a unique space to pause and engage. Within every Pad lie **Scenes** — the micro-realities that compose the rich, layered experiences inside each stop. Together, Pads and Scenes shape the rhythm and texture of the journey, inviting exploration and flow.

## 🎯 Purpose

Pads & Scenes exist to structure the user’s experience into meaningful, manageable moments along the Track. While the Track guides the overall journey, Pads serve as intentional stops where focused interaction happens. Scenes, nested within Pads, provide micro-environments that break down complex tasks or narratives into digestible, immersive segments. This layering fosters clarity, momentum, and emotional resonance throughout the user’s path.

## 🧠 Mental Model

Imagine the Track as a winding journey, a continuous path of discovery. Along this path, Pads are the welcoming stops — scenic overlooks, rest areas, or workshops — where travelers pause to engage deeply. Inside each Pad, Scenes are the rooms or moments that reveal distinct facets of the stop’s purpose, offering varied perspectives and interactions. This nested metaphor helps users orient themselves: the Track is the voyage, Pads are the destinations, and Scenes are the stories lived within.

## 🧬 Anatomy

- **Pad**: The primary container representing a stop on the Track. Each Pad has metadata such as `id`, `kind`, `title`, and `state` (open, closed, completed). Pads orchestrate the Scenes they contain and manage transitions between them.
- **Scene**: A subunit within a Pad that encapsulates a focused experience or interaction. Scenes have properties like `id`, `padId`, `kind`, `state` (entered, completed), and contextual data. They represent the micro-realities that collectively form the Pad’s narrative.

## 🔄 Lifecycle

1. **Creation**: Pads and their Scenes are instantiated based on user actions or system triggers, often reflecting the evolving needs of the Track journey.
2. **Opening a Pad**: When a Pad is opened (`dispatchPadOpen`), it becomes the active focus, revealing its Scenes.
3. **Entering a Scene**: Users enter a Scene (`dispatchSceneEnter`) to engage with its specific interaction or content.
4. **Completing a Scene**: Upon finishing a Scene’s task, it is marked complete (`dispatchSceneComplete`), allowing progression to subsequent Scenes.
5. **Completing a Pad**: Once all Scenes within a Pad are completed, the Pad itself is marked complete, signaling readiness to advance along the Track.
6. **Track Interaction**: Pads coordinate with the Track’s state, enabling smooth transitions and preserving flow momentum.

## 📡 Events

- `onPadRouteChange`: Triggered when the user navigates between Pads.
- `dispatchPadOpen`: Opens a Pad, making it active and visible.
- `dispatchSceneEnter`: User enters a specific Scene within a Pad.
- `dispatchSceneComplete`: Marks a Scene as completed.
- `dispatchPadComplete`: Marks a Pad as completed.
- `onSceneStateChange`: Listens for changes in Scene state.
- `onPadStateChange`: Listens for changes in Pad state.

## 🎛️ UX Principles

- **Frictionless Entry**: Pads and Scenes open seamlessly to minimize barriers and maintain flow.
- **Elastic Focus**: The interface flexibly adapts to the active Pad and Scene, expanding or contracting to suit the moment.
- **Remembered Momentum**: Progress and context persist, allowing users to pick up exactly where they left off.
- **Collaborative Presence**: Real-time indicators and shared states foster a sense of togetherness and co-creation.

## 🤝 Collaboration

Presence dots shimmer over Pads and Scenes, signaling who is currently visiting or interacting. Ghost trails trace recent movements, revealing paths taken by collaborators. Invitations enable seamless joining, creating a vibrant, connected experience where users move as a community along the Track.

## 🛠️ Implementation Notes

The Pads & Scenes pattern is tightly integrated with Pad Core, leveraging its type definitions, action creators, and real-time synchronization mechanisms. This ensures consistent state management and collaborative updates across clients. Actions such as `dispatchPadOpen` and `dispatchSceneEnter` are dispatched through the Pad Core system, while real-time presence and state sync enable fluid multi-user experiences.

## 🎨 Design Tokens

- `--track-glow` — accent highlight for the chalk ribbon (mood tuned automatically).
- `--track-shadow` — ambient shadow used behind the track.
- `--pad-hero-start` / `--pad-hero-end` — gradient stops for the pad header chrome.
- `--scene-highlight` — accent color applied to active or focused Scenes.
- `--presence-dot-color` — hue for live presence indicators.
- `--ghost-trail-color` — tone for collaborator trail overlays.

## 🗂️ Default Scenes by Pad Kind

| Pad Kind           | Default Scenes                       |
| ------------------ | ------------------------------------ |
| Gas / Refuel       | FuelInput, EnergyCheck, Confirmation |
| Repair / Integrate | Diagnostics, FixIt, TestRun          |
| Rest / Inspire     | Meditation, Journaling, Reflection   |
| Race / Create      | Sprint, Review, Publish              |
| Custom             | CustomScene1, CustomScene2           |
