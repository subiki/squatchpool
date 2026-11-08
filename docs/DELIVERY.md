# Delivery — from issue to production

Small changes, observable outcomes, no duplicate deployment pipeline. These steps apply to humans and coding agents.

## 1. Scope the change

Read `AGENTS.md`, the [work queue](BACKLOG.md), [architecture](ARCHITECTURE.md), relevant live issues/PRs and current `main`. For ANY UI work, read the [game template](GAME_PAGE_TEMPLATE.md) first. Name the player-facing failure and one acceptance criterion; avoid overlapping another agent's branch.

## 2. Build on a short-lived branch

Prefer one component or one verified vertical slice. Do not edit `main` directly. Preserve original game rule engines, DOM IDs, canvases and physics for a layout change. Document intentional behavior changes and recovery steps.

## 3. Run checks

```bash
npm ci
npm run build
```

`npm run build` is the **one release gate**: it scans all first-party
JavaScript syntax, verifies the shared CSS import/ownership contract, runs the
existing gameplay regression tests, stamps the release, generates the offline
edition and verifies its precache. For faster local iteration use `npm run
check` (syntax and UI ownership) or `npm test` (game behavior), but CI should
run the complete build only **once**, not install-time tests plus three repeat
passes. These are lightweight regression gates, not coverage targets. Fix failing tests rather than bypass them. If hosted GitHub checks cannot start, report the runner failure separately from actual test results.

**Game-page changes:** CI runs `node scripts/smoke-game-shell.mjs` in headless Chromium: six routes in both Classic and Rock & Roll at desktop/mobile, table-focused captures, plus the bot preview cases. It verifies shared slot order, visible shot action, setup order, rulebook consistency, hidden controls, no duplicate IDs and startup-error detection. **It also compares real computed fonts/control metrics across the six game routes for a given appearance and viewport.** Review the `squatch-game-layouts` artifact, not just a green badge. This is a smoke check, not a substitute for finishing a rack.

**Game-page changes:** validate **both Classic and Rock & Roll skins** at matching widths; neither is allowed to alter common layout or control behavior. Test one complete representative rack and smoke the setup/table/help/controls in *every* mode affected. For the shared template, the affected set is all five originals **plus Arcade**. Check direct URL and SPA navigation, controller mount/dispose, mobile and fullscreen. Avoid only checking CSS selectors in source; inspect the actual browser result.

**Gameplay changes:** break → placement → legal shot → miss/foul → turn → rack win → restart. Try keyboard/Space, touch and player/bot arrangements. Compare scores to the documented house rules.

**Docs-only changes:** validate internal links, terminology, code references and examples. No gameplay rack required.

## 4. Preview

Use the existing Cloudflare Pages GitHub integration. Confirm the preview succeeded for the **PR head SHA**. When a browser is available, use the preview to check relevant routes and responsive layouts. Mark unavailable device/browser checks as **not verified**; don't invent screenshots or QA.

## 5. Merge and verify the deployment

Merge safe reviewed changes after checks. Cloudflare's integration deploys `main`; confirm the production Pages check for the **merged SHA**, not just a successful PR preview. The public header's Pacific timestamp is build metadata, which can differ from upload-complete time. Never set it from the visitor's clock.

If the production build fails or regression appears, rollback/revert the offending PR or redeploy the last verified commit according to existing project controls. Do not work around the failure by deploying a second pipeline.

## 6. Close the loop

Post a short release note on the PR/issue: player-visible change, merged SHA, tests, preview/production check, manual browser evidence, remaining risks and rollback action. Close issues only against their acceptance criteria, not because a commit landed.

## Safety and brand

Use the approved Pacific Northwest **temperate rainforest** visual vocabulary. Do not link players to external manuscripts or third-party sites. Keep native browser PWA installation (no custom button or offline-ready banner). Preserve GPL-3.0 notices. Keep `STATS_DB` preview and production databases separate; never publish credentials, private IDs or user data.
