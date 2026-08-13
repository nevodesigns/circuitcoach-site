# CircuitCoach Site

Hosted site and deployment configuration for CircuitCoach.

**Live**: https://circuitcoach.vercel.app

**Canonical simulator repository**: https://github.com/nevodesigns/circuitcoach

---

## Repositories

This is the **hosting and deployment repository** for CircuitCoach, containing the live site and serverless tutor backend.

- **[CircuitCoach](https://github.com/nevodesigns/circuitcoach)** (canonical): The primary simulator repository with full source code, test suite, and circuit logic.
- **CircuitCoach Site** (this repository): Hosting configuration, marketing site, deployment setup, and serverless API.

**Simulator logic changes should normally happen in the canonical repository.** This repository maintains only a deployment-specific copy of the simulator (`app/` directory).

---

## Layout

```
.github/                     GitHub workflows and templates
.dependabot.yml              Dependabot configuration
api/
  hint.js                    Serverless tutor endpoint (Gemini proxy)
  health.js                  Tutor availability check
  _ratelimit.js              Rate limiter for public API
app/                         Deployment copy of the simulator (served at /app)
  index.html
  js/                        app.js, board.js, challenges.js, circuit.js
  css/                       main.css
assets/                      Demo media, transcript, screenshots, favicon
styles/
  site.css                   Marketing site styling
tools/
  check.js                   Local validation and rate limiter tests
index.html                   Marketing landing page
vercel.json                  Cache headers, security policies, routing
package.json                 Project metadata and scripts
README.md                    This file
CONTRIBUTING.md              Contribution guidelines
SECURITY.md                  Security policy and hardening
CODE_OF_CONDUCT.md           Community standards
THIRD_PARTY_NOTICES.md       License and attribution for third-party assets
CITATION.cff                 Citation metadata
```

---

## Local Development

### Prerequisites

- Node.js 18+
- Python 3 (for simple HTTP server)

### Running the Site

```bash
npm run dev                  # Starts Python HTTP server on http://localhost:4000
```

This serves the static site completely. Tiers 1–3 of the simulator work offline. The AI tutor requires serverless functions:

```bash
npx vercel dev              # Full Vercel dev environment (includes /api)
```

---

## Environment

The tutor endpoint (`/api/hint`) is optional and requires configuration:

| Variable | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | for tutor | Without it, `/api/hint` returns 503 and the tutor shows as offline. Puzzles 1–3 remain playable. **Must stay server-side.** |
| `GEMINI_MODEL` | no | Pins a single model. Defaults to a fallback chain (`gemini-flash-lite-latest`, `gemini-flash-latest`, `gemini-2.0-flash`, `gemini-pro-latest`). |

### Setting Environment Variables on Vercel

```bash
vercel env add GEMINI_API_KEY production
vercel env add GEMINI_MODEL production
```

Or set directly in the [Vercel Dashboard](https://vercel.com) under Project Settings → Environment Variables.

---

## Checks

Local validation (no network required):

```bash
npm run check
```

This runs:
- Request sanitization and validation tests
- Rate limiter tests
- No-op checks if `GEMINI_API_KEY` is missing

---

## The API Tutor

### Architecture

`api/hint.js` is a faithful serverless port of `server/app.py` from the canonical repository. The browser makes deterministic escalation decisions; this endpoint only generates the hint wording.

### Security Hardening

- **Key isolation**: `GEMINI_API_KEY` is read from the environment and never returned to the client.
- **Prompt injection defense**: Fault codes are validated against `^[a-z_]{1,40}$` before reaching the prompt.
- **Input capping**: Readings and previous hints are limited by count and length.
- **Error handling**: Upstream errors are logged server-side; clients receive only generic messages.
- **Model fallthrough**: If a model hits 404 or 429, the endpoint tries the next model in the chain.
- **Rate limiting**: Public endpoint is rate-limited to prevent quota exhaustion.

### Rate Limiting

`api/_ratelimit.js` enforces two ceilings on `/api/hint`:

- **Per-IP limit**: 8 hints per IP per 10-minute window
- **Per-instance limit**: 60 hints per warm serverless instance per 10-minute window

When either limit is reached, the endpoint returns `429 Too Many Requests` with a `Retry-After` header. The front end degrades gracefully, showing the tutor as unreachable.

**Note**: Counters live in instance memory, so these are per-instance ceilings. For multi-instance deployments or high traffic, back the counters with Vercel KV or Upstash for true global guarantees.

### Simulator Changes

Two changes were made to the `app/` simulator copy for hosting:

1. **`app/js/app.js`**: Tutor endpoint discovery probes same-origin `/api` instead of falling back to `127.0.0.1:5000`.
2. **`app/index.html`**: Added `<base href="/app/">` for correct relative path resolution.

---

## Deployment

### Prerequisites for Production

- `GEMINI_API_KEY` configured in Vercel environment (if tutor is desired)
- `.env` must never be committed
- All checks pass: `npm run check`
- Security headers in `vercel.json` are intact

### Deploy to Vercel

```bash
vercel --prod
```

Or connect this repository to Vercel for automatic deployments on `main` branch.

---

## Open Source

This repository is released under the [MIT License](./LICENSE).

### License Summary

- **Source code**: MIT licensed.
- **Third-party assets**: Remain under their own licenses (see [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)).
- **External services**: Google Gemini, Vercel, and Google Fonts are not covered by the MIT license and are subject to their own terms.

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines and [SECURITY.md](./SECURITY.md) for security policies.

---

## Relationship to CircuitCoach

- **This repository**: Hosting, deployment, serverless API, and marketing site for CircuitCoach.
- **[Canonical simulator](https://github.com/nevodesigns/circuitcoach)**: Full source, test suite, and circuit logic. The authority for simulator behavior.

Do not assume this repository independently contains the canonical simulator. Always refer to the main repository for simulator logic questions, bug reports, and feature requests.

---

## Optional: Gemini Configuration

The tutor is **optional**. The simulator and all three tiers are fully playable without it.

To disable the tutor (e.g., to avoid API costs):
- Leave `GEMINI_API_KEY` unset in the Vercel environment.
- The `/api/health` endpoint will report `keyLoaded: false`.
- The front end will show the tutor as offline, and the user can still solve all puzzles.
```

The site is static plus two Node functions, so it needs no build step.

## The demo video

`assets/demo.mp4` is the silent cut, 6:20, recorded against the live
application. The AI hints in it are real generated output. It is intended to be
replaced with the narrated edit; the timed voiceover script is in
`assets/demo-transcript.md`.
