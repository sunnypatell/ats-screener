---
title: Authentication
description: 'Choose how users sign in to your self-hosted ATS Screener: anonymous, Firebase, or Active Directory.'
---

ATS Screener picks one of three sign-in modes automatically from your environment. You don't toggle anything in code or in the UI; setting the relevant variables is what turns a mode on.

| Mode                 | Turn it on with                           | Sign-in                          | Scan history           | Best for                              |
| -------------------- | ----------------------------------------- | -------------------------------- | ---------------------- | ------------------------------------- |
| **Anonymous**        | leave Firebase and LDAP unset             | none, the scanner is open        | browser localStorage   | personal / single-user installs       |
| **Firebase**         | set `PUBLIC_FIREBASE_PROJECT_ID` (+ keys) | Google or email/password         | Firestore, synced      | a hosted-style instance with accounts |
| **Active Directory** | set `LDAP_URL` (+ service account)        | AD username + password (on-prem) | per user, localStorage | a company on its own network          |

If more than one is configured, the precedence is **Active Directory > Firebase > anonymous**. The public instance at `ats-screener.vercel.app` uses Firebase; it never sets `LDAP_URL`, so the Active Directory UI never appears there.

## Anonymous (no sign-in)

The default. Leave every `PUBLIC_FIREBASE_*` variable and `LDAP_URL` unset and the app runs fully local:

- The scanner is open, no account required.
- Scan history is saved to the browser's `localStorage` (capped at 5, newest first).
- The Sign In button and `/login` are hidden / redirect away, and the Firebase SDK is never imported.

This is the simplest way to self-host. Trade-off: history lives in one browser and isn't synced across devices.

## Firebase

Set the six `PUBLIC_FIREBASE_*` variables (from Firebase Console, see [Configuration](/docs/self-hosting/configuration)) to get Google and email/password sign-in plus cross-device history in Firestore. This mirrors the hosted instance. Detection is a single signal: a non-empty `PUBLIC_FIREBASE_PROJECT_ID`.

## Active Directory (LDAP)

For self-hosters on a corporate network: users sign in with their existing AD account, the scanner sits behind that login, and access can be restricted to a group. This is server-side and only activates when `LDAP_URL` is set. See the dedicated [Active Directory guide](/docs/self-hosting/active-directory) for setup.

## What stays the same across modes

The LLM provider chain (cloud Gemini/Groq, or local Ollama) is independent of which auth mode you pick. Configure providers in [Configuration](/docs/self-hosting/configuration); they work the same whether sign-in is anonymous, Firebase, or Active Directory.
