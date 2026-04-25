// build-time sync: copies the repo-root CHANGELOG.md into the docs content
// tree as src/content/docs/release-notes/changelog.md, with starlight
// frontmatter prepended.
//
// runs as a `prebuild` step so the docs build always picks up the latest
// CHANGELOG without manual mirroring. CHANGELOG.md remains the single
// source of truth at the repo root; this script is the only thing that
// writes to release-notes/changelog.md, and that path is gitignored to
// prevent accidental dual-commits.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, '../../CHANGELOG.md');
const TARGET_DIR = resolve(__dirname, '../src/content/docs/release-notes');
const TARGET = join(TARGET_DIR, 'changelog.md');

if (!existsSync(SOURCE)) {
	console.error(`[sync-changelog] source not found: ${SOURCE}`);
	process.exit(1);
}

const raw = readFileSync(SOURCE, 'utf-8');

// strip the leading "# Changelog" heading from CHANGELOG.md so we do not
// emit a duplicate H1 (starlight already renders the frontmatter title).
// keep everything from the next blank line onward.
const stripped = raw.replace(/^#\s+Changelog\s*\n+/, '');

const frontmatter = `---
title: Release Notes
description: Versioned release notes for ATS Screener. Auto-synced from CHANGELOG.md at build time.
---

`;

mkdirSync(TARGET_DIR, { recursive: true });
writeFileSync(TARGET, frontmatter + stripped, 'utf-8');

console.log(`[sync-changelog] ${SOURCE} -> ${TARGET}`);
