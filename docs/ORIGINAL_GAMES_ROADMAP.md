# Squatch Pool — gameplay-first roadmap

## Product direction
Build weird, playable pool games. **No fictional lore, character biographies, episode introductions, narration, or invented stories.** Preserve original rule mechanics as reference, but do not promote story prose as gameplay or spend development time expanding it. Prioritize fun, understandable rules and complete matches over test infrastructure.

## Delivery order
1. **Fix release timestamp (#27):** Cloudflare must generate deployment.json at build time and display its actual build timestamp, or explicitly say unavailable. Never show a stale hardcoded date as current.
2. **Finish playable Caroms (#54, #77):** complete the existing browser game; bot opponent only after local play works.
3. **Ship three-player Coin-Op Cutthroat (#55):** group choice, turn progression, scratch claim/re-entry, elimination, winner, restart, desktop/touch.
4. **Ship Press Your Luck (#56, #58):** score, banking, final eight, and explicit provisional rules for unknown edge cases.
5. **Ship other weird games (#59–62)** only when rules can support a complete match; prioritize mechanics rather than recovering fictional stories.
6. **Improve game selection and playability (#53, #63):** clear rules at the top, collapsible guidance, touch controls, 7/8/9 ft tables, per-game stats.
7. **Lightweight release safeguards (#64, #45):** enough to prevent broken gameplay, no test-only delivery cycles.

## Content policy
- Remove fictional story promotion, biographies, and episode narration from active navigation, homepage, and tutorials.
- Keep historical source files in the repository for provenance until archival decisions are explicit; do not delete game rules.
- Explain rules in short, practical instructions. Clearly mark provisional house-rule decisions.
- Pacific Northwest styling may remain visual branding, not a requirement to invent lore.
- Ship one complete playable mode at a time. Verify live deployment rather than equating GitHub merge with release.
