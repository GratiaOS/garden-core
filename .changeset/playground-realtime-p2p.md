---
"playground": minor
---

feat: Realtime & P2P Pads

- Sim/WebRTC toggle with live connection status
- signaling URL input + persistence (`garden:signalUrl`)
- reuse active realtime port across `/ux` and `/pad`
- Scene Event Monitor on both pages; pads dispatch `scene:*`
- full circuit: local events ↔ P2P mirroring
