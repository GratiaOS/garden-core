# ✅ Mirror Nova Flow — Verification Checklist

Use this checklist to make sure **docs, code, and ritual** for the Mirror → Seed Activation flow are aligned.  
Run it regularly when making UI or architecture changes related to Mirror, Compass, Bloom, or scene routing.

---

## 🌿 Scene structure

- [ ] Mirror scene mounts **within single canvas**, not as separate page.
- [ ] Writing / Mirror / Archive are siblings with `FadeScene` or equivalent.
- [ ] Only the **active scene** accepts pointer events.
- [ ] Keyboard shortcuts (1,2,3) navigate scenes cleanly.

---

## 🌬 Intention Handling

- [ ] Entering Mirror after Writing shows **intention preview card** if available.
- [ ] If no intention, Compass remains disabled and nudge text shows.
- [ ] Intention is **not persisted** unless turned into an OTN.

---

## 🫁 Breath-gate Ritual

- [ ] Breath-gate UI shows Inhale 4 / Hold 2 / Exhale 6 phases ×3 cycles.
- [ ] Countdown badges transition smoothly.
- [ ] Cancelling mid-ritual resets phase & disables Compass again.
- [ ] After 3 cycles, **Compass unlocks** visually & functionally.

---

## 🧭 Seed Activation

- [ ] Bloom is available anytime, triggers playful creation flow.
- [ ] Compass activation derives correct **OTN** from intention using heuristic.
- [ ] After activation → OTN pinned + archive receipt logged.
- [ ] Seed activation emits proper bus events (`seed/activate`, `seed/result`, etc.).

---

## 🌐 Transition & Archive

- [ ] After successful activation, scene transitions to Archive cleanly.
- [ ] The **Archive** scene displays the newly pinned OTN or seed receipt.
- [ ] User can navigate back to Writing/Mirror without residual state glitches.

---

## ♿ Accessibility

- [ ] `#garden-live` element exists at root with proper `role="status"`.
- [ ] Live region announces breath phases, unlock, activation, pinning.
- [ ] All buttons have keyboard focus and discernible text.
- [ ] Color/contrast passes WCAG AA in dark & light.
- [ ] **prefers-reduced-motion** disables fades gracefully.
- [ ] Sound cues (if enabled) respect user settings.

---

## 🧠 State & Events

- [ ] `FieldStore` reflects correct scene, intention, otn, archive entries.
- [ ] Bus events fire consistently on scene enter/exit & seed actions.
- [ ] Local persistence works for archive, not for raw intention text.
- [ ] Resetting the store returns Mirror to initial breath state.

---

## 🧪 Edge cases

- [ ] Empty intention → nudge text shows, Compass disabled.
- [ ] Mid-ritual cancel works, no ghost activations.
- [ ] Offline mode still allows seed activation & archive.
- [ ] Rapid scene switching doesn’t break breath-gate UI.

---

## 🌾 Future Hooks (Optional Check)

- [ ] Nova routing points could be plugged in (e.g. adaptive unlock).
- [ ] Intention refinement UI placeholder is clear.
- [ ] Common Experience timed event is conceptually pluggable.

---

### 📝 Tips

- Do at least **one full happy-path run** (Writing → Mirror → Compass → Archive).
- Do at least **one cancel/reset run** mid-breath.
- Try keyboard-only navigation.
- Toggle reduced motion in dev tools to test a11y path.
- Bonus: try it on mobile once — breath-gate timing should still feel smooth.
