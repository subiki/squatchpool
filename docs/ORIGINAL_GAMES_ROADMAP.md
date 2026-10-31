# Squatch Pool — five-game finish line

## Immediate product direction (2026-10-30)
**Finish current games; do not add more yet.** The five existing playable pages are **But Wait, There's More**, **Caroms (Whacky Pool)**, **Coin-Op Cutthroat**, **Press Your Luck** and **Big Tuna Casserole**. A page/controller being present is not evidence of a complete match or production deployment. Preserve source-backed mechanics and treat unknown rule cases as provisional.

### Execution sequence
1. **P0 deployment integrity** — Resolve [#128](https://github.com/subiki/squatchpool/issues/128); confirm exact Cloudflare live commit through `deployment.json` and functional assets. GitHub Actions zero-step failures are not test output. Existing build output `.`; existing Pages Git integration only.
2. **P0 complete five modes** — [#15](https://github.com/subiki/squatchpool/issues/15), [#54](https://github.com/subiki/squatchpool/issues/54), [#55](https://github.com/subiki/squatchpool/issues/55), [#58](https://github.com/subiki/squatchpool/issues/58), [#127](https://github.com/subiki/squatchpool/issues/127). Each: break -> aim/call -> shoot/foul/turn -> win -> next rack/restart in real desktop and touch browsers.
3. **P1 shared compact fullscreen experience** — [#63](https://github.com/subiki/squatchpool/issues/63). Keep table and key controls together, reverse aim easy and persistent, advanced shots discoverable, no sprawling sliders.
4. **P1 all-five truthful statistics** — [#45](https://github.com/subiki/squatchpool/issues/45). Verify real D1 counts and measured popularity ranking without fictitious data.
5. **P1 offline mobile install** — [#131](https://github.com/subiki/squatchpool/issues/131). Offline playable after one preload including all five games; prove in a real Android browser.

The ordered details and shipping evidence live in [#159](https://github.com/subiki/squatchpool/issues/159) and [BACKLOG.md](BACKLOG.md). Keep implementation lean: **one meaningful playable vertical slice per PR**, small focused regressions, no process-only cycles. When blocked on a Cloudflare account/tool, record the exact blocker, then make progress on a separate gameplay issue. Don't merge truly failing tested changes or invent test/deploy evidence.

## Later: Squatch Pool Maker
[#151](https://github.com/subiki/squatchpool/issues/151) is a future vision to remix existing game rules like LEGO. Only after the five current games are working should we dissect **their tested rules** into reusable blocks. No abstract rule engine now.

## Product and content guardrails
No mandatory character biographies, episode narration or story screens in the immediate play flow. Preserve the original house-rule manuscripts, stories, licensed source, and media in the archive. Explain rules prominently and briefly, put details in collapsible content, and default to a full table view. Pacific Northwest **temperate rainforest**, never jungle. Prove shipped production rather than assuming it after merging.
