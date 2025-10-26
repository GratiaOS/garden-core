# @gratiaos/pad-core

## 0.2.0

### Minor Changes

- 079a984: feat: Realtime registry + Scene P2P bridge

  - add `setRealtimePort/getRealtimePort/getRealtimeCircleId`
  - publish `scene:*` (enter/complete) over the active realtime adapter
  - mirror incoming `scenes` topic back into local DOM events
  - export `onSceneEnter/onSceneComplete` and dispatch helpers
  - prepare Sim/WebRTC adapters via Realtime Port contract
