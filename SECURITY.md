# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ATS Screener, please report it responsibly. The canonical disclosure channel is also published as a [`/.well-known/security.txt`](https://ats-screener.vercel.app/.well-known/security.txt) per [RFC 9116](https://www.rfc-editor.org/rfc/rfc9116).

**Do not open a public issue.**

Instead, email **sunnypatel124555@gmail.com** (or open a private advisory on GitHub) with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

I'll acknowledge receipt within 48 hours and work on a fix promptly.

## Scope

This project has both client-side and server-side components. Security considerations include:

- **Resume file privacy**: Resume files (PDF/DOCX) are parsed entirely in the browser using Web Workers. The original file is never uploaded to any server.
- **Text transmission**: Extracted text from your resume is sent to Google Gemini for AI-powered scoring analysis. Only the text content is transmitted, not the file itself.
- **Authentication**: Firebase Authentication handles user sign-in (Google + email/password). Auth tokens are managed by the Firebase SDK. Email is normalized (trim + lowercase) at signup/signin to prevent duplicate-account creation from casing variants.
- **Data storage**: Scan history (scores and metadata) is stored in Cloud Firestore. Each user can only read/write their own data via Firestore security rules.
- **API key protection**: Server-side API keys (Gemini, etc.) are stored as environment variables and never exposed to the client.
- **Rate limiting**: The LLM proxy endpoint implements per-IP rate limiting (10 RPM, 200 RPD) and emits a standard `Retry-After` header on `429`. The cleanup sweep is throttled so an over-threshold map cannot stall request handling.
- **Input sanitization**: All user inputs (resume text, job descriptions, OG / share query params) are validated and length-capped before processing. Tampered share parameters are clamped (e.g. `pass <= total`) so a crafted URL cannot render impossible state.
- **Security headers**: All responses set HSTS (1y, includeSubDomains, preload), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` opting out of `camera`, `microphone`, `geolocation`, `payment`, `usb`, plus `interest-cohort` (FLoC) and `browsing-topics` (Topics API), `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.
- **Content Security Policy**: Currently shipped in `Content-Security-Policy-Report-Only` mode with violations posted to `/api/csp-report` (logged to Vercel logs only, no persistent storage). The directives cover SvelteKit hydration, Google Fonts, Firebase Auth + Firestore, and the LLM proxies.
- **Static-file path traversal**: The `/docs/[...slug]` catchall validates that every resolved file path stays under `static/docs/` (resolve + `startsWith` check, plus `realpath` check against symlink escapes).

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest  | Yes       |
| Older   | No        |

## Disclosure Policy

- Vulnerabilities will be patched in the latest version
- A security advisory will be published on GitHub after the fix is released
- Credit will be given to the reporter (unless they prefer anonymity)
