# Fast delivery loop

1. Read `AGENTS.md`, relevant issue, open PRs, and current `main`. Claim an independent task in its issue before editing.
2. Create a small branch and PR linked to the issue. Avoid overlapping changes with other agents.
3. Run `npm test` and `npm run check` locally before merging. Hosted GitHub Actions is **temporarily deferred**: initial runs failed before any runner started (zero steps, no runner assigned), not because tests failed. Re-enable PR checks only after runner availability is verified. Never bypass an actual failing test.
4. Use the existing Cloudflare Pages GitHub integration for preview deployments when available; verify the actual preview URL and critical interactions. Do not add a duplicate deployment pipeline.
5. For display of the deployed version, the banner uses `deployment.json` generated during Cloudflare's install/build step. A manifest marks build time, **not** the precise completion time; Cloudflare's successful GitHub check run records the exact completion timestamp. If the metadata doesn't update because the build skips install scripts, use the existing Pages Build command `npm run build`, output dir `.`; do not add a parallel deployment pipeline. Never show the visitor's current time as a deployment time.
6. Merge after checks pass and applicable real-browser smoke tests are recorded. Cloudflare production deploy should follow `main`; verify the live URL after deployment rather than assuming success.
6. Record PR, commit, test results, preview/live URLs, browser/device evidence, and remaining gaps on the issue. Close only when acceptance is verified.

**Fast paths:** docs-only changes need CI but not a gameplay playthrough; gameplay, controls and physics changes need targeted desktop/touch browser testing. Urgent fixes use small checked PRs. Never force-push over concurrent work or auto-merge failing checks. Branch protection, hosted CI runner availability, and Cloudflare preview integration must be verified/configured in GitHub/Cloudflare settings; this document alone does not enforce them.

**World canon:** Sasquatches inhabit a Pacific Northwest **temperate rainforest**, not a jungle. Use cedar, hemlock, moss, ferns, rain and mist; no tropical jungle plants or fauna. This applies to character intros, backgrounds, lore, art prompts, website copy and issues. Preserve historical source material verbatim in archives.

**Separate migration lane:** Google Sites/DreamHost content, DNS and registrar transfer follow issue #28; do not block gameplay delivery or perform domain cutovers automatically.
