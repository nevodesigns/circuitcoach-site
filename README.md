# CircuitCoach site

Marketing site and hosted build of the CircuitCoach breadboard simulator, built
for the 2026 IEEE Metaverse Grand Challenge for Simulation-Based Learning.

Live: https://circuitcoach.vercel.app

## Layout

```
index.html            the landing page
styles/site.css       design tokens and all styling
app/                  vendored copy of the simulator, served at /app
api/hint.js           serverless port of the Flask hint proxy
api/health.js         tells the front end whether a tutor is configured
assets/               demo video, poster, screenshots, transcript, favicon
vercel.json           cache and security headers
```

The simulator under `app/` is a copy. The source of truth, along with the full
test suite, lives in the main repository:
https://github.com/nevodesigns/circuitcoach

The only change made to the vendored copy is in `app/js/app.js`: the tutor
endpoint discovery probes same-origin `/api` and no longer falls back to
`127.0.0.1:5000`, since there is no local Flask server on a hosted deploy.

## Running it locally

```
npm run dev          # python3 -m http.server 4000
```

That serves the static site, so Tiers 1 through 3 are fully playable. The AI
tutor needs the serverless functions, which a plain static server does not run,
so the tutor panel will correctly report OFFLINE.

To exercise the tutor locally, use the Vercel dev server instead:

```
npx vercel dev
```

## The AI tutor

`api/hint.js` is a faithful port of `server/app.py` from the main repository.
The escalation decision stays deterministic in the browser; this endpoint only
words the hint. It carries the same hardening:

- the key is read from the environment and never returned to the client
- the fault code is matched against `^[a-z_]{1,40}$`, so no prompt injection
  survives into the prompt
- readings and previous hints are capped in both count and length
- upstream provider errors are logged server side, and the client gets a short
  generic message
- the model list falls through on a 404 or 429, because free tier per model
  quotas move around

### Environment

| Variable | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | for the tutor | Without it `/api/hint` answers 503 and the tutor shows as offline. Tiers 1 to 3 are unaffected. |
| `GEMINI_MODEL` | no | Pins a single model instead of the fallback chain. |

Set them on Vercel with:

```
vercel env add GEMINI_API_KEY production
```

## Deploying

```
npx vercel --prod
```

The site is static plus two Node functions, so it needs no build step.

## The demo video

`assets/demo.mp4` is the silent cut, 6:20, recorded against the live
application. The AI hints in it are real generated output. It is intended to be
replaced with the narrated edit; the timed voiceover script is in
`assets/demo-transcript.md`.
