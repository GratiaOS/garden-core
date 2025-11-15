# Shopify Presence Node — v1.0 Spec (Draft)

## 1. Purpose

The Shopify Presence Node is a Garden Stack–compliant app that gives each store a branded, behavior-controlled interface to the Pattern Engine. It is not “AI” in generic form; it is the store’s own Presence Node, running explicit Modes and wrapped in a store-specific Identity Layer.

## 2. Garden Stack mapping

- **Pattern Engine**  
  Underlying LLM + retrieval + guardrails. Handles pattern generation only (answers, suggestions, classifications). No persona, no tone, no brand logic.

- **Presence Node (this app)**  
  The Shopify app (backend + Admin UI) where merchants connect their store. Handles:
  - Shopify auth and shop scoping  
  - endpoints (`/respond`, `/analyze`, `/configure`)  
  - message routing and prompt dispatch to the Pattern Engine

- **Identity Layer**  
  Store-specific configuration, stored per shop:
  - tone presets (e.g. friendly, minimal, premium)  
  - glossary (product names, store-specific terms)  
  - rituals (greeting/closing patterns, policy stance)  
  - templates (shipping, returns, announcement skeletons)  
  Identity never lives in the Pattern Engine or Mode; it only wraps this Presence Node.

- **Modes**  
  Runtime behavior contracts the Node can run:
  - `Support-mode` — customer-facing answers; uses Identity tone; respects configured policies; constrained promises.  
  - `Merchant-Codex-mode` — merchant-facing assistant; direct, structured; explains and suggests next steps.  
  Modes define pacing, tone, defaults, and limits. They are styles, not identities.

- **Frames**  
  User-side perception, never stored:
  - Merchant Frame: “my branded helper that actually saves me time.”  
  - Customer Frame: “this store replies in a clear, consistent voice.”

## 3. Data flow (overview)

1. Input (customer or merchant) hits the Shopify Presence Node.  
2. Node loads shop-scoped Identity Layer.  
3. Node selects Mode (`Support-mode` or `Merchant-Codex-mode`).  
4. Node builds a structured prompt and calls the Pattern Engine.  
5. Pattern Engine returns raw text/structure.  
6. Node applies Identity Layer (tone, rituals, templates) as post-processing.  
7. Response is delivered (to customer channel or merchant UI).

## 4. Non-goals

- No generic “AI chatbot” framing.  
- No hidden personas or emergent “character”.  
- No implicit identity in the Pattern Engine or Mode.  
- No storing or modeling of user Frames; Frames describe perception only.

## 5. Versioning

- v1.0 (draft) — initial spec for Engine/Node/Identity/Modes/Frames mapping. Future changes extend this file with concrete Mode specs and Identity schema.
