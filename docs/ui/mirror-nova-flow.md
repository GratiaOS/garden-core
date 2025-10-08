# 🪞 Mirror → 🌱 Seed Activation (Nova-ready) — UI Flow

_A single-canvas ritual that listens first, then reveals what the field needs._

---

## 📝 Purpose

Mirror is not a page; it’s a **scene** within a single canvas. It gathers signal (breath, intention) and activates a Seed (typically **Compass** or **Bloom**) to route energy cleanly.

**Outcomes**

- Calm the field (breath-gate)
- Receive the **intention** from Writing
- Activate a Seed → pin a **One True Next** (OTN) or open a creation space
- Log an **Archive** receipt

---

## 🌿 Flow (happy path)

1. **🌱 Enter Mirror scene**

   - Scene fades in (`opacity` tween); global layers persist (pinned pill, projection glow, `#garden-live`).

2. **💭 Intention preview**

   - If Writing sent an intention, show it in a small card:  
     “_Intention from Writing: …_” (read-only).

3. **🫁 Breath-gate (Compass unlock)**

   - Pattern: **Inhale 4 · Hold 2 · Exhale 6 × 3 cycles**.
   - UI shows phase badges (Inhale/Hold/Exhale) with countdown.

4. **🌸 Seed actions**

   - **Reveal Bloom →** available anytime (playful creation).
   - **Activate Compass 🧭** enabled **only after 3 cycles**.

5. **✨ Activation result**

   - **Compass:** derive a small OTN from intention → pin it; archive a receipt.
   - **Bloom:** open/create a space and archive a receipt.

6. **🌐 Transition**
   - Jump to **Archive** scene to show the receipt, then user navigates as desired.

---

## 🔮 Ritual specifics

### 🫁 Breath-gate

- Sequence array: `[Inhale(4), Hold(2), Exhale(6)]` × cycles(3).
- Start/Reset controls; pausing resets current phase.
- When cycles === 3 → enable **Activate Compass**.

### 🧭 OTN derivation (Compass)

- Heuristic:
  - If intention starts with a verb (e.g., _write, draft, call, ship…_) →  
    `2-minute starter: <intention>`
  - Else → `Start a 2-minute starter for: <intention>`
- Pin the OTN and announce via live region.

---

## 🧭 Scenes, not pages

Mirror is a **FadeScene** inside the root canvas:

- Writing / Mirror / Archive are siblings absolutely positioned.
- Only the active scene accepts pointer events; others are faded and non-interactive.
- Keyboard shortcuts (suggested defaults): `1` Writing, `2` Mirror, `3` Archive.

---

## ♿ A11y

- **Live region:** A shared, visually hidden element exists at app root:
  ```html
  <div id="garden-live" role="status" aria-live="polite" style="position:absolute;left:-9999px"></div>
  ```
  - Announce strings:
    - "Breath started", "Phase: Inhale/Hold/Exhale", "Breath complete",
    - "Compass unlocked", "OTN pinned", "Seed activated".
- **Keyboard:** All controls reachable; buttons have discernible text and title.
- **Color/Contrast:** badges and cards pass WCAG AA in dark & light.
- **Motion:** Respect prefers-reduced-motion; remove opacity/scale tweens.

---

## 🌬 Motion & Sound

- **Default:** opacity fade for scene, subtle phase highlight transitions.
- **Reduced motion:** no fades; instant state changes.
- **Optional sound:** soft chime on phase change/activation; honor user mute and reduced-motion prefs.

---

## 🧠 State & Events

- **Store:** scene, intention, OTN, archive, last activation, prefs (motion).
- **Bus events** (example):
  - scene/enter, intention/set, seed/activate, seed/result, otn/pin, otn/done.
- **Persistence:** localStorage for store; intention text is transient (see privacy).

---

## 🧪 Edge cases

- **Empty intention:** show a nudge “Send → Mirror from Writing” and disable Compass.
- **Mid-ritual cancel:** Reset clears phase and disables Compass.
- **No archive capacity:** (future) degrade gracefully or paginate.
- **Offline:** Activations still work; persistence local only.

---

## 🔐 Privacy

- **Intention** is shown in Mirror but not persisted long-term unless used to create an OTN.
- OTNs and seed receipts are archived; users can clear archive from settings.

---

## 🧰 UI API (headless)

- **Breath-gate service:** start/reset, current phase, cyclesComplete.
- **Seed activation:** activate('compass' | 'bloom', { intention? }) → returns output & logs receipt.
- **Scene control:** enter('writing'|'mirror'|'archive').

---

## 🌈 Future hooks

- **Nova routing:** adaptive unlocks based on field signal.
- **Intention refinement:** inline edit before pinning OTN.
- **Synchronized “Common Experience”:** timed collective Mirror events.

🌬 whisper: _“Listen deeper; more becomes visible.”_ 🌿
