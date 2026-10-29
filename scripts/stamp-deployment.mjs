/**
 * Immutable deployment-build marker, generated inside Cloudflare Pages for
 * each deployment. The site is static and the repository is private: do not
 * expose a GitHub token or Cloudflare API token in browser JavaScript.
 *
 * Cloudflare provides CF_PAGES, CF_PAGES_COMMIT_SHA and CF_PAGES_BRANCH to
 * build processes. Both npm postinstall and npm run build can invoke this;
 * running locally must not overwrite the published metadata.
 */
import {writeFileSync} from 'node:fs';

export function createDeploymentManifest(env, now = new Date()) {
 // Cloudflare Pages may expose CF_PAGES as a boolean-like value or omit it\n // while still supplying its authoritative commit and branch variables.\n // Require BOTH metadata fields; never stamp ordinary local installs.\n if (!env.CF_PAGES_COMMIT_SHA || !env.CF_PAGES_BRANCH) return null;
 const commit = String(env.CF_PAGES_COMMIT_SHA || '');
 if (!/^[0-9a-f]{40}$/i.test(commit)) return null;
 if (!Number.isFinite(now.getTime())) throw new RangeError('Invalid deployment time');
 return {
  schemaVersion: 1,
  deploymentBuildAt: now.toISOString(),
  commit: commit.toLowerCase(),
  branch: String(env.CF_PAGES_BRANCH || ''),
  source: 'cloudflare-pages-build'
 };
}

const manifest = createDeploymentManifest(process.env);
if (manifest) {
 writeFileSync(new URL('../deployment.json', import.meta.url),
  JSON.stringify(manifest, null, 2) + '\n', 'utf8');
 console.log('Squatch Pool deployment stamp:', manifest.deploymentBuildAt, manifest.commit.slice(0, 7));
} else if (process.env.CF_PAGES || process.env.CF_PAGES_COMMIT_SHA) {
 console.warn('Cloudflare commit SHA unavailable; omitting deployment marker rather than inventing a date.');
}
