import { json } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// public deploy identity. lets uptime checkers, ops dashboards, and a
// future client-side "new version available" toast notice when a new
// build is live without storing anything user-related.
//
// version is inlined at build time via vite's `define` from package.json
// (see vite.config.ts). reading package.json from disk at runtime did not
// resolve reliably under the vercel adapter's bundled function, so the
// build-time inline is the right path.

const VERSION = __APP_VERSION__;

export const GET: RequestHandler = () => {
	const commit = privateEnv.VERCEL_GIT_COMMIT_SHA;
	const commitShort = typeof commit === 'string' ? commit.slice(0, 7) : 'dev';
	const branch = privateEnv.VERCEL_GIT_COMMIT_REF ?? null;
	const env = privateEnv.VERCEL_ENV ?? 'development';

	return json(
		{
			version: VERSION,
			commit: commitShort,
			branch,
			env
		},
		{
			headers: {
				// short browser ttl so the toast can spot a new deploy quickly,
				// long cdn ttl so deploy-identity reads do not cost function
				// invocations after the first hit per region.
				'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
			}
		}
	);
};
