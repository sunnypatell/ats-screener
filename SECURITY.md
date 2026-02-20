# security policy

## reporting a vulnerability

if you discover a security vulnerability in ats screener, please report it responsibly.

**do not open a public issue.**

instead, email **security@sunnypatell.com** (or open a private advisory on GitHub) with:

- description of the vulnerability
- steps to reproduce
- potential impact
- suggested fix (if you have one)

i'll acknowledge receipt within 48 hours and work on a fix promptly.

## scope

this project processes resumes client-side in the browser. the only server-side component is a Cloudflare Worker that proxies requests to the Gemini API. security considerations include:

- **resume data privacy**: resumes are parsed entirely in the browser. only extracted text (not files) is sent to the LLM endpoint for semantic analysis
- **API key protection**: the Gemini API key is stored as a Cloudflare environment secret, never exposed to the client
- **rate limiting**: the LLM proxy endpoint implements per-IP rate limiting to prevent abuse
- **input sanitization**: all user inputs (resume text, job descriptions) are sanitized before processing

## supported versions

| version | supported |
|---|---|
| latest | yes |
| older | no |

## disclosure policy

- vulnerabilities will be patched in the latest version
- a security advisory will be published on GitHub after the fix is released
- credit will be given to the reporter (unless they prefer anonymity)
