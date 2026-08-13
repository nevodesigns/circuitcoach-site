# Security Policy

## Reporting Vulnerabilities

**Do not open public issues for security vulnerabilities.**

If you discover a security issue, please report it privately using [GitHub Security Advisories](https://github.com/nevodesigns/circuitcoach-site/security/advisories). This allows the maintainers to address the issue before public disclosure.

### Scope for Private Reporting

Use private reporting for vulnerabilities involving:

- API abuse or public endpoint exposure
- `/api/hint` rate-limit bypass or quota exhaustion
- Prompt injection via fault codes or other client-controlled inputs across the server boundary
- Server-side logic flaws or unsafe defaults
- Deployment configuration leaking credentials or enabling abuse
- Unsafe dependency vulnerabilities with practical exploit paths

### Non-Security Issues

General bugs, feature requests, and usability issues should be reported as [public issues](../../issues) instead.

## Security Practices

### Credentials

- **Never publish credentials publicly.** `GEMINI_API_KEY` must be set only in the Vercel deployment environment, never in code or version control.
- `.env` is in `.gitignore` and will be rejected by pre-commit checks.
- Use `.env.example` to document required secrets without values.

### Key Hardening

- The `GEMINI_API_KEY` is **server-side only**. It never reaches the client.
- Request payloads are validated and sanitized in `api/hint.js` before the key is used:
  - Fault codes are matched against `^[a-z_]{1,40}$` to prevent prompt injection.
  - Readings and hints are capped by count and length.
  - User input is never interpolated directly into system prompts.
- Upstream errors are logged server-side; the client receives only a generic message.

### Rate Limiting

- `/api/hint` is public and rate-limited to prevent API quota exhaustion.
- Per-IP and per-instance ceilings are enforced in `api/_ratelimit.js`.
- For production deployments with high traffic, back the rate limiter with Vercel KV or Upstash for global guarantees.

### Security Headers

`vercel.json` enforces strict security headers:

- `Content-Security-Policy`: Restricts resource loading to same-origin, fonts via Google CDN.
- `X-Frame-Options: SAMEORIGIN`: Prevents clickjacking.
- `X-Content-Type-Options: nosniff`: Prevents MIME sniffing.
- `Permissions-Policy`: Disables camera, microphone, geolocation.

Do not weaken these headers without security review.

### Third-Party Services

This deployment uses external services:

- **Google Gemini API** for the hint tutor (optional, requires API key).
- **Vercel** for hosting, deployment, and CDN.
- **Google Fonts** for typography.

These services are not covered by this repository's MIT license and are subject to their own terms of service.

## Deployment Checklist

Before deploying to production:

1. ✓ `GEMINI_API_KEY` is set in Vercel environment (not in `.env` or `.env.example`).
2. ✓ `.env` is never committed or deployed.
3. ✓ `npm run check` passes.
4. ✓ Security headers in `vercel.json` are intact.
5. ✓ Rate limiter is operational (or backed by Vercel KV for high-volume deployments).

## Dependencies

Keep dependencies up to date using Dependabot and GitHub Actions (via `.dependabot.yml`).
