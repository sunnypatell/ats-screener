import { json } from '@sveltejs/kit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { env as privateEnv } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// public deploy identity. lets uptime checkers, ops dashboards, and a
// future client-side "new version available" toast notice when a new
// build is live without storing anything user-related.
//
// readFileSync runs once at module load (per cold start), so the per-
// request cost is just a json serialization. cache-control further
// pushes most hits to the vercel cdn.

const VERSION = (() => {
	try {
		const raw = readFileSync(join(process.cwd(), 'package.json'), 'utf-8');
		const obj = JSON.parse(raw) as { version?: string };
		return obj.version ?? 'unknown';
	} catch {
		return 'unknown';
	}
})();

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
