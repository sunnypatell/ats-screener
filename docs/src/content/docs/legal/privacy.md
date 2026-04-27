---
title: Privacy and Data Handling
description: How ATS Screener collects, uses, retains, and protects your data. A non-commercial student portfolio project run from Ontario, Canada, open to users worldwide.
lastUpdated: 2026-04-25
---

:::note
Plain language. No legalese. The author is not a lawyer. Last updated 2026-04-25.
:::

## What this is (and what it is not)

ATS Screener is a personal student portfolio project run by [Sunny Patel](https://sunnypatel.net) from Ontario, Canada. It is open source under the MIT license and free to use:

- No ads.
- No premium tier or paid features.
- No data sales.
- The author accepts voluntary donations via [Buy Me a Coffee](https://buymeacoffee.com/sunnypatell) and [GitHub Sponsors](https://github.com/sponsors/sunnypatell). Donating does not unlock features, remove limits, or change how your data is handled.

It is not a registered business or service, and there is no organization behind it. That framing matters for everything below.

## Where you fit in

Anyone, anywhere, can use ATS Screener. The author lives in Canada and built the project there, but the app is hosted on global infrastructure and accepts users from any country.

## Honest legal framing

Most commercial data-protection statutes are written for commercial activity. A non-commercial student project may not formally fall under their organizational obligations. Here is the author's good-faith reading, not legal advice:

- **PIPEDA (Canada)** applies to "commercial activity". The project itself charges nothing and gates no features behind payment. The donation links above are voluntary tip-jar style; under most readings they would not be treated as commercial activity flowing from the user, since the user receives no additional service or feature in return. PIPEDA's organizational requirements likely do not formally apply, although a regulator could view donation revenue differently if pushed.
- **CCPA / CPRA (California)** applies to businesses meeting revenue and data thresholds (annual revenue > $25M, or processing data from 100k+ Californians, or > 50% revenue from selling personal info). A free student project funded by occasional small donations does not come close to any of those thresholds.
- **GDPR (EU/EEA)** is broader. Its household exemption excludes purely personal activity, but a public-facing global service generally falls outside that exemption. So if you live in the EU/EEA and create an account, GDPR may technically apply to the way the author processes your data, regardless of monetization.

If you are unsure which laws apply to your situation, you should consult someone who actually does this for a living. The practical commitment in the next section applies to every user regardless of which statutes formally bind us.

## Practical commitment

Whether or not a given law strictly applies, we operate as if a baseline of good privacy hygiene does. Regardless of where you live:

- We do not sell your data.
- We do not run advertising trackers or behavioural-analytics pixels.
- You can ask for a copy of what we hold about you.
- You can ask us to delete your account and your scan history.
- We will tell you, on this page, what we collect and why.

## How you can use the app

- **Signed in.** Signing in is required to use the scanner. When you sign in, the app stores your account info plus your scan history (capped at the most recent 5 scans). The next section covers exactly what that includes.

## What we collect from signed-in users

**Account information**, from your sign-in provider:

- Your email address.
- Your display name.
- Your profile photo, if available.
- We never see or store your password.

**Scan history**, capped at your 5 most recent scans:

- Numeric scores per ATS profile.
- Lists of matched and missing keywords derived from your resume.
- The file name you uploaded.
- The scan timestamp and mode (general or targeted).
- A short snippet of the job description, up to 200 characters.

PDF and DOCX parsing happens entirely inside your browser. The binary file itself is never sent over the network.

## How we process scoring requests

When you run a scan, the extracted resume text (and, in targeted mode, the full job description text) is sent over TLS to one of our AI scoring providers via our serverless function. Two things to be honest about:

1. **The text passes through our serverless function** on the way to the AI provider. We do not write it to durable storage. A short-lived in-memory cache (per region, max 200 entries, 24-hour TTL, never written to disk) deduplicates identical repeat requests so the provider is not called twice for the same prompt. That cache disappears whenever the serverless instance recycles, which is usually within minutes.
2. **The AI providers receive your resume text.** Their privacy practices apply to data they receive. We choose providers whose terms permit transient processing without long-term retention, but they are independent third parties.

The full prompt and the raw provider response are not retained on our servers as durable data.

## What we do not collect

- We do not sell your data, full stop.
- We do not run third-party advertising trackers, marketing pixels, or session-replay tools.
- We do not store the full text of your resume or the full text of your job description as durable data. We do save the numeric scores and the matched / missing keyword lists derived from them, plus a short JD snippet (up to 200 characters), to your scan history.
- We do not store the binary contents of your uploaded PDF or DOCX file.
- We do not share your scan results with employers or recruiters.

## Where account data lives

Account info and scan history are stored in a managed cloud database operated by a well-known third-party provider, with access restricted to your account. Like most cloud services, that provider may store data in regions outside Canada and outside your home country. Data in transit is encrypted with TLS, and the provider encrypts data at rest.

## How long we keep it

- Scan history is capped at your 5 most recent scans. Older scans are deleted automatically on the next save.
- You can clear all of your scan history at any time from the History page in the app.
- Account information persists until you ask us to delete your account.
- Operational logs (request counts, error codes, response timings) are retained briefly by hosting infrastructure for diagnostics and rotate out automatically.

## Your practical rights, regardless of jurisdiction

- **Access.** Email us and we will send you whatever account and history data we hold about you.
- **Correct.** Email us if a stored field is wrong.
- **Delete.** Use the in-app "clear history" control to erase scan data, or email us to delete your full account.
- **Withdraw consent.** Sign out and ask us to delete your account.

If you live in a jurisdiction with a data-protection authority (Canada's [Office of the Privacy Commissioner](https://www.priv.gc.ca/), an EU/EEA national DPA, the UK ICO, etc.) and you believe we have not handled your data appropriately, you may also contact them.

## Cookies and similar technologies

The app uses only what is required for sign-in (the auth provider sets cookies and local storage to remember your session). We do not use cookies or local storage for behavioural tracking or advertising.

## Children

This app is not directed at children under 13, and we do not knowingly collect data from them.

## Changes to this notice

If something material changes, we will update the "Last updated" date at the top of this page. Worth checking back on occasion if you care about the details.

## Contact

Email [sunnypatel124555@gmail.com](mailto:sunnypatel124555@gmail.com) for any privacy question, data access request, correction, or deletion request. The author is based in Ontario, Canada.

This document is written in plain language because legalese hides accountability. If anything here is unclear or seems wrong, write in.
