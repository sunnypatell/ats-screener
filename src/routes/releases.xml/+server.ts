import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RequestHandler } from './$types';

// rss 2.0 feed of releases parsed from CHANGELOG.md.
// helps developer audiences subscribe via feed readers without us
// needing to maintain a separate publishing pipeline. zero storage,
// zero new deps, parses on cold start and caches at the edge.
//
// link points at the canonical CHANGELOG location on github so
// readers can deep-link to a specific version's section.

const REPO = 'https://github.com/sunnypatell/ats-screener';
const CHANGELOG_URL = `${REPO}/blob/main/CHANGELOG.md`;

interface Release {
	version: string;
	date: string; // YYYY-MM-DD as it appears in changelog
	body: string; // raw markdown for the section, minus the heading
}

const VERSION_HEADER = /^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})\s*$/;

function parseChangelog(raw: string): Release[] {
	const lines = raw.split('\n');
	const releases: Release[] = [];
	let current: Release | null = null;
	const buffer: string[] = [];

	for (const line of lines) {
		const m = VERSION_HEADER.exec(line);
		if (m) {
			if (current) {
				current.body = buffer.join('\n').trim();
				releases.push(current);
			}
			current = { version: m[1], date: m[2], body: '' };
			buffer.length = 0;
			continue;
		}
		if (current) buffer.push(line);
	}
	if (current) {
		current.body = buffer.join('\n').trim();
		releases.push(current);
	}
	return releases;
}

function escapeXml(s: string): string {
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

// best-effort RFC 822 date for an ISO YYYY-MM-DD (assumed UTC midnight).
// rss readers care about the format, not sub-day precision, and changelog
// entries are dated in days, not timestamps.
function rfc822(isoDate: string): string {
	const d = new Date(`${isoDate}T00:00:00Z`);
	if (Number.isNaN(d.getTime())) return new Date().toUTCString();
	return d.toUTCString();
}

let cached: { xml: string; etag: string } | null = null;

function buildFeed(origin: string): { xml: string; etag: string } {
	if (cached) return cached;

	let raw: string;
	try {
		raw = readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf-8');
	} catch {
		raw = '';
	}
	const releases = parseChangelog(raw);
	const buildDate = new Date().toUTCString();

	const items = releases
		.map((r) => {
			const title = `ATS Screener v${r.version}`;
			const link = `${CHANGELOG_URL}#${r.version.replaceAll('.', '')}---${r.date}`;
			const pubDate = rfc822(r.date);
			const guid = `${REPO}/releases/v${r.version}`;
			const description = `<![CDATA[${r.body}]]>`;
			return `		<item>
			<title>${escapeXml(title)}</title>
			<link>${escapeXml(link)}</link>
			<guid isPermaLink="false">${escapeXml(guid)}</guid>
			<pubDate>${pubDate}</pubDate>
			<description>${description}</description>
		</item>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>ATS Screener releases</title>
		<link>${escapeXml(origin)}</link>
		<description>Release notes for ATS Screener, a free open-source resume screener.</description>
		<language>en-us</language>
		<lastBuildDate>${buildDate}</lastBuildDate>
		<atom:link href="${escapeXml(`${origin}/releases.xml`)}" rel="self" type="application/rss+xml" />
${items}
	</channel>
</rss>
`;
	// content-addressed-ish etag based on the version+date pairs. cheap to
	// compute, stable across cold starts as long as CHANGELOG.md is unchanged.
	const etag = `"rel-${releases.map((r) => `${r.version}@${r.date}`).join(',')}"`;
	cached = { xml, etag };
	return cached;
}

export const GET: RequestHandler = ({ url, request }) => {
	const feed = buildFeed(url.origin);
	const ifNoneMatch = request.headers.get('if-none-match');
	if (ifNoneMatch && ifNoneMatch === feed.etag) {
		return new Response(null, { status: 304, headers: { ETag: feed.etag } });
	}
	return new Response(feed.xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			ETag: feed.etag,
			// browser ttl 1h, edge ttl 1d, swr 7d. release cadence is far slower
			// than this, and a deploy invalidates the edge cache automatically.
			'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
		}
	});
};
