import type { RequestHandler } from './$types';

// minimal liveness probe for uptime checkers (cron-job.org, betterstack, etc).
// returns 200 unconditionally; if the runtime is broken, the probe will time
// out or return 5xx via the platform layer
export const GET: RequestHandler = () => {
	return new Response(
		JSON.stringify({
			status: 'ok',
			timestamp: new Date().toISOString()
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
