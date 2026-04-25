---
title: Privacy and Data Handling
description: How ATS Screener collects, uses, retains, and protects your data. Operated as a student project from Richmond Hill, Ontario, Canada.
lastUpdated: 2026-04-25
---

:::note
Plain language. No legalese. Last updated 2026-04-25.
:::

## Who runs this

ATS Screener is a personal student project run by [Sunny Patel](https://sunnypatel.net) from Richmond Hill, Ontario, Canada. It is not a commercial service and there is no company behind it. The aim is to follow the spirit of Canadian privacy law (PIPEDA) and similar guidance, but the obligations of a commercial operator do not all map cleanly onto a non-revenue student project. The policy below describes, in plain language, what we actually do.

## What we collect

Two categories, both opt-in by signing in.

**Account information** from your sign-in provider:

- Your email address.
- Your display name.
- Your profile photo, if available.
- We do not see or store your password.

**Scan history** tied to your account, capped at your 5 most recent scans:

- Numeric scores per ATS profile.
- Lists of matched and missing keywords derived from your resume.
- The file name you uploaded.
- The scan timestamp and mode (general or targeted).
- A short snippet of the job description, up to 200 characters.

The full text of your resume is never sent to, or stored on, our servers. PDF and DOCX parsing happens entirely inside your browser.

If you use the app **without signing in**, no scan data is saved anywhere. The result lives in your browser tab and is gone when you close it.

## How we process scoring requests

Scoring is performed by third-party AI providers. When you run a scan, the relevant prompt (which includes your resume text and, in targeted mode, the job description) is sent to one of those providers over TLS so it can return a score.

We do not retain the raw prompt or the raw response on our servers as durable storage. A short-lived in-memory cache is used to deduplicate identical repeat requests and reduce cost. That cache is per region, never written to disk, and disappears when the serverless instance recycles.

The third-party AI providers have their own privacy practices, which apply to data they receive. We choose providers whose terms permit transient processing without long-term retention.

## What we do not collect

- We do not sell your data, full stop.
- We do not run third-party advertising trackers, marketing pixels, or session-replay tools.
- We do not store the raw text of your resume, the full text of your job description, or the binary contents of your uploaded file.
- We do not share your scan results with employers or recruiters.

## Where it lives

Account info and scan history are stored in a managed cloud database operated by a well-known third-party provider, with access restricted to your account. Like most cloud services, that provider may store data in regions outside Canada. Data in transit is encrypted with TLS, and the provider encrypts data at rest.

## How long we keep it

- Scan history is automatically capped at your 5 most recent scans. Older scans are deleted on the next save.
- You can clear all of your scan history at any time from the History page in the app.
- Account information persists until you ask us to delete your account (see [Your rights](#your-rights)).
- Operational logs (request counts, error codes, response timings) are retained briefly by hosting infrastructure for diagnostics and then rotate out automatically.

## Your rights

Under PIPEDA you have, broadly, the right to:

- **Access** the personal information we hold about you. Your stored scan history is visible in the History page. For anything else, email us and we will send a copy.
- **Correct** inaccurate personal information. Email us if a stored field is wrong.
- **Delete** your data. Use the in-app "clear history" control to erase scan data, or email us to delete your full account and any associated records.
- **Withdraw consent** by signing out and asking us to delete your account.

You may also contact the [Office of the Privacy Commissioner of Canada](https://www.priv.gc.ca/) if you believe a complaint has not been resolved.

## Cookies and similar technologies

We use only what is required for sign-in and to remember whether you are signed in across page loads. We do not use cookies or local storage for behavioural tracking or advertising.

## Children

This app is not directed at children under 13, and we do not knowingly collect data from them.

## Changes to this notice

If something material changes, we will update the "Last updated" date at the top of this page. Substantial changes (a new category of data, a new third-party provider) will also be called out in the project [changelog](https://github.com/sunnypatell/ats-screener/blob/main/CHANGELOG.md).

## Contact

Email [sunnypatel124555@gmail.com](mailto:sunnypatel124555@gmail.com) for any privacy question, data access request, correction, or deletion request. The author is based in Richmond Hill, Ontario, Canada.

This document is written in plain language because legalese hides accountability. If anything here is unclear or seems wrong, write in.
