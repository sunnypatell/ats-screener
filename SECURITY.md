# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ATS Screener, please report it responsibly.

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
- **Authentication**: Firebase Authentication handles user sign-in (Google + email/password). Auth tokens are managed by the Firebase SDK.
- **Data storage**: Scan history (scores and metadata) is stored in Cloud Firestore. Each user can only read/write their own data via Firestore security rules.
- **API key protection**: Server-side API keys (Gemini, etc.) are stored as environment variables and never exposed to the client.
- **Rate limiting**: The LLM proxy endpoint implements per-IP rate limiting to prevent abuse.
- **Input sanitization**: All user inputs (resume text, job descriptions) are validated and length-capped before processing.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest  | Yes       |
| Older   | No        |

## Disclosure Policy

- Vulnerabilities will be patched in the latest version
- A security advisory will be published on GitHub after the fix is released
- Credit will be given to the reporter (unless they prefer anonymity)
