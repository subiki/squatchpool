# Squatch Pool — gameplay-first roadmap

## Product direction
Build weird, playable pool games. **No mandatory lore, character biographies, episode introductions, narration, or invented stories in the primary play flow.** Preserve original rule mechanics as reference, but do not promote story prose as gameplay or spend development time expanding it. Prioritize fun, understandable rules and complete matches over test infrastructure.

## Delivery order
1. **Fix release timestamp (#27):** Cloudflare must generate deployment.json at build time and display its actual build timestamp, or explicitly say unavailable. Never show a stale hardcoded date as current.
2. **Finish playable Caroms (#54, #77):** complete the existing browser game; bot opponent only after local play works.
3. **Ship three-player Coin-Op Cutthroat (#55):** group choice, turn progression, scratch claim/re-entry, elimination, winner, restart, desktop/touch.
4. **Ship Press Your Luck (#56, #58):** score, banking, final eight, and explicit provisional rules for unknown edge cases.
5. **Ship other weird games (#59–62)** only when rules can support a complete match; prioritize mechanics rather than recovering fictional stories.
6. **Improve game selection and playability (#53, #63):** clear rules at the top, collapsible guidance, touch controls, 7/8/9 ft tables, per-game stats.
7. **Lightweight release safeguards (#64, #45):** enough to prevent broken gameplay, no test-only delivery cycles.

## Content policy
- Remove story promotion and episode narration from the primary navigation and default play flow. Preserve existing stories, artwork, character material, and source references for future **optional, skippable** intro videos, tutorials, and explanations.
- Keep historical source files and media in the repository or existing archive for later reuse; do not delete lore, artwork, or game rules.
- Explain rules in short, practical instructions near the top of each game. Clearly mark provisional house-rule decisions. Default to a clean, playable table; put advanced details behind collapsible sections.
- Pacific Northwest styling may remain visual branding, not a requirement to invent lore.
- Ship one complete playable mode at a time. Game selection, rules, and Play must be obvious on mobile and desktop. Optional intro video must have Skip and remember the user's preference. Verify live deployment rather than equating GitHub merge with release.
