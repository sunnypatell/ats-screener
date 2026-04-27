import { env as privateEnv } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// liveness probe for uptime checkers (cron-job.org, betterstack, etc).
// returns 200 unconditionally; if the runtime is broken, the probe will time
// out or return 5xx via the platform layer.
//
// payload also embeds build-identity fields (version, commit, env) so a
// single probe confirms both "is the function alive" AND "is the right build
// deployed". version is inlined at build time via vite's `define` from
// package.json (see vite.config.ts) so the bundled function does not need
// to read package.json from disk at runtime.

const VERSION = __APP_VERSION__;

export const GET: RequestHandler = () => {
	const commit = privateEnv.VERCEL_GIT_COMMIT_SHA;
	const commitShort = typeof commit === 'string' ? commit.slice(0, 7) : 'dev';
	const env = privateEnv.VERCEL_ENV ?? 'development';

	return new Response(
		JSON.stringify({
			status: 'ok',
			timestamp: new Date().toISOString(),
			version: VERSION,
			commit: commitShort,
			env
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'no-store'
			}
		}
	);
};
