---
title: Active Directory (LDAP)
description: Sign in self-hosted ATS Screener with on-premise Active Directory accounts over LDAP.
---

ATS Screener can authenticate users against your **Active Directory** domain over LDAP. This is for self-hosters running the app **inside their own network**, on a host that can reach a domain controller (a domain-joined Windows Server, or any Linux box on the LAN). The hosted instance at `ats-screener.vercel.app` never uses this; it stays on Firebase.

When Active Directory is enabled, users sign in with their normal AD username and password, the scanner sits behind that login, and each user's scan history is kept separate on their browser.

## Authentication modes

ATS Screener picks exactly one auth mode at startup, from the environment:

| Mode         | Enabled when                        | Sign-in                         | History         |
| ------------ | ----------------------------------- | ------------------------------- | --------------- |
| **LDAP/AD**  | `LDAP_URL` is set                   | AD username + password (server) | per user, local |
| **Firebase** | `PUBLIC_FIREBASE_PROJECT_ID` is set | Google / email (client)         | Firestore       |
| **None**     | neither is set                      | anonymous (no sign-in)          | local           |

If both `LDAP_URL` and Firebase are set, **LDAP wins**. Leave `LDAP_URL` unset and nothing in this page applies, the app behaves exactly as it did before.

## Prerequisites

- A host that can reach your domain controller over the network (LDAP `389`, or LDAPS `636`).
- A **read-only service account** in AD. ATS Screener binds as this account to look up the person signing in, then verifies their password by binding as them. The service account needs only "read" on the user objects you want to sign in.
- The base DN your users live under (for example `DC=corp,DC=example,DC=com`).
- A long random `SESSION_SECRET`. Sessions are signed with it; rotating it signs everyone out.

:::tip
Use LDAPS (`ldaps://...:636`) whenever you can. A plain `ldap://` bind sends the password in clear text on the wire. See [Securing the connection](#securing-the-connection-ldaps) below.
:::

## Configuration

All of these are **server-side** variables (never prefixed `PUBLIC_`, so they never reach the browser). Set them in your `.env`.

| Variable                       | Required          | Default                            | Description                                                                                           |
| ------------------------------ | ----------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `LDAP_URL`                     | enables LDAP mode | —                                  | `ldaps://dc.corp.example.com:636` (or `ldap://...:389`). Presence turns it on.                        |
| `LDAP_BIND_DN`                 | yes               | —                                  | DN of the read-only service account.                                                                  |
| `LDAP_BIND_PASSWORD`           | yes               | —                                  | Service-account password.                                                                             |
| `LDAP_SEARCH_BASE`             | yes               | —                                  | Base DN to search for users, e.g. `DC=corp,DC=example,DC=com`.                                        |
| `SESSION_SECRET`               | yes               | —                                  | 32+ random chars. Generate with `openssl rand -base64 32`.                                            |
| `LDAP_USERNAME_ATTRIBUTES`     | no                | `sAMAccountName,userPrincipalName` | Attributes a username is matched against (comma-separated).                                           |
| `LDAP_DEFAULT_DOMAIN`          | no                | —                                  | If set, a bare `jdoe` is also tried as `jdoe@<default-domain>`.                                       |
| `LDAP_ALLOWED_GROUP_DN`        | no                | —                                  | Restrict sign-in to members of this group (see [Restricting access](#restricting-access-to-a-group)). |
| `LDAP_NAME_ATTRIBUTE`          | no                | `displayName`                      | Attribute used for the display name.                                                                  |
| `LDAP_EMAIL_ATTRIBUTE`         | no                | `mail`                             | Attribute used for the email.                                                                         |
| `LDAP_TLS_CA_PATH`             | no                | —                                  | Path to your internal CA certificate (PEM) for LDAPS validation.                                      |
| `LDAP_TLS_REJECT_UNAUTHORIZED` | no                | `true`                             | Set to `false` only in a lab to accept self-signed certs (not recommended).                           |
| `SESSION_MAX_AGE`              | no                | `28800` (8h)                       | Session lifetime in seconds.                                                                          |

:::caution
If `LDAP_URL` is set but a required companion (`LDAP_BIND_DN`, `LDAP_BIND_PASSWORD`, `LDAP_SEARCH_BASE`, `SESSION_SECRET`) is missing or `SESSION_SECRET` is too short, sign-in fails closed with a server-side error rather than running in a half-configured state.
:::

### Minimal example

```bash
# in your .env
LDAP_URL=ldaps://dc.corp.example.com:636
LDAP_BIND_DN=CN=svc-ats,OU=Service Accounts,DC=corp,DC=example,DC=com
LDAP_BIND_PASSWORD=the-service-account-password
LDAP_SEARCH_BASE=DC=corp,DC=example,DC=com
SESSION_SECRET=replace-with-openssl-rand-base64-32

# you still need at least one LLM provider (see Configuration):
GEMINI_API_KEY=...
# leave all PUBLIC_FIREBASE_* unset so LDAP is the active mode
```

## How users sign in

The login form accepts the three usual AD logon formats, so users can type whatever they're used to:

- **UPN**: `jdoe@corp.example.com`
- **Down-level**: `CORP\jdoe`
- **Bare username**: `jdoe` (matched against `sAMAccountName`; if you set `LDAP_DEFAULT_DOMAIN`, it's also tried as a UPN)

A wrong username and a wrong password return the **same** message on purpose, so the form can't be used to discover which accounts exist. Disabled, expired, and locked accounts get a specific message. Repeated failures from one address are rate-limited.

## Restricting access to a group

By default any account that can bind is allowed in. To limit sign-in to one group, set its DN:

```bash
LDAP_ALLOWED_GROUP_DN=CN=ATS Users,OU=Groups,DC=corp,DC=example,DC=com
```

Membership is evaluated **including nested groups**, so a user who belongs to a group that is itself a member of `ATS Users` is allowed in. Users outside the group get an "not authorized" message after their password is verified.

## Securing the connection (LDAPS)

Use `ldaps://` on port `636`. If your domain controller's certificate is issued by an internal CA that the host doesn't already trust, point ATS Screener at the CA certificate:

```bash
LDAP_URL=ldaps://dc.corp.example.com:636
LDAP_TLS_CA_PATH=/etc/ssl/certs/corp-internal-ca.pem
```

:::caution
`LDAP_TLS_REJECT_UNAUTHORIZED=false` turns off certificate validation entirely. Only use it on a throwaway lab domain, never in production. Trust the internal CA with `LDAP_TLS_CA_PATH` instead.
:::

## Sessions

After a successful sign-in, ATS Screener sets a signed, `httpOnly` session cookie. There is no server-side session store, the cookie is self-contained, so sessions survive restarts and work across multiple instances. To force everyone to sign in again, rotate `SESSION_SECRET`. Adjust `SESSION_MAX_AGE` to change how long a session lasts.

:::caution
Behind a TLS-terminating reverse proxy (nginx, Caddy, Traefik in front of the node adapter, the common AD topology), the app receives plain HTTP internally, so the session cookie's `Secure` flag depends on the proxy forwarding the original scheme. The login action honours `X-Forwarded-Proto`, but you should also tell your SvelteKit adapter to trust the proxy (for `@sveltejs/adapter-node`, set `PROTOCOL_HEADER=x-forwarded-proto` and `HOST_HEADER=x-forwarded-host`) so `Secure` is set correctly and the cookie is never sent over plain HTTP.
:::

## Scan history

In AD mode, scan history is stored in the browser's `localStorage`, namespaced per signed-in user so two people sharing a machine don't see each other's scans. As with the other self-host modes, history is per-browser and not synced across devices. Server-side, cross-device history would need a database; it's tracked as a possible future enhancement on the issue tracker.

## Troubleshooting

| Message a user sees                               | Likely cause                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Incorrect username or password                    | Wrong username, wrong password, or the user isn't under the search base.                     |
| Your account is disabled / locked / expired       | The AD account is in that state. Fix it in AD.                                               |
| You must reset your password                      | AD requires a password change before the next sign-in.                                       |
| You are not authorized to access this application | `LDAP_ALLOWED_GROUP_DN` is set and the user isn't a member (directly or nested).             |
| Cannot reach the directory server                 | `LDAP_URL` is wrong/unreachable, or LDAPS cert validation failed (check `LDAP_TLS_CA_PATH`). |
| Server authentication is misconfigured            | `LDAP_URL` is set but a required companion var is missing, or `SESSION_SECRET` is too short. |
| Too many attempts                                 | Failed-login rate limit; wait and try again.                                                 |

## Not in scope (yet)

Single-forest LDAP is what ships today. The following are intentionally out of scope and tracked as future work:

- Multi-forest / cross-domain trusts and Global Catalog lookups
- Kerberos / integrated single sign-on
- OIDC and SAML (Entra ID, Okta, Keycloak)

The sign-in layer is built around a small provider interface, so these can be added later without disturbing the LDAP path.
