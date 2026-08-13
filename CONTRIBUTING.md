# Contributing to CircuitCoach Site

Thank you for your interest in contributing to the CircuitCoach hosting repository!

## Repository Role

This repository contains the **hosted site and deployment configuration** for CircuitCoach. The canonical simulator source code lives in a separate repository:

**https://github.com/nevodesigns/circuitcoach**

### Where to Contribute

- **Simulator logic, features, test suite**: Contribute to the [main CircuitCoach repository](https://github.com/nevodesigns/circuitcoach).
- **Hosting, deployment, site infrastructure, API tuning, security headers**: Contribute here.
- **Deployment-specific bug reports**: Use this repository's issues.

The `app/` directory contains a deployment-specific copy of the simulator. Do not redesign or refactor its application code here; changes to the simulator logic should flow through the canonical repository.

## Getting Started

### Local Development

```bash
npm run dev                # Python HTTP server on port 4000
npx vercel dev           # Full Vercel dev environment (includes serverless functions)
```

Tier 1–3 puzzles are fully playable without the API. The tutor requires `GEMINI_API_KEY` to be set.

### Pre-Submission Checks

Before opening a pull request, run the local checks:

```bash
npm run check
```

This validates the rate limiter and request sanitization without requiring network access.

## Code Guidelines

- **Never commit secrets**: `.env` is in `.gitignore`. Use `.env.example` to document required variables.
- **Preserve security posture**: Hardening exists in `api/hint.js` (prompt injection defense), `api/_ratelimit.js` (abuse prevention), and `vercel.json` (security headers). Do not weaken these.
- **Document deployment changes**: If you modify `vercel.json`, API handlers, or environment variables, describe the intent in your PR.
- **Test your changes**: Run `npm run check` and verify the site loads at `http://localhost:4000` or `localhost:3000` (Vercel dev).

## Pull Request Checklist

Before submitting:

- [ ] Changes follow the guidelines above
- [ ] `npm run check` passes
- [ ] No secrets or `.env` files are staged
- [ ] Deployment impact is documented (if any)
- [ ] Simulator changes (if any) are actually for the [main repository](https://github.com/nevodesigns/circuitcoach)

## Reporting Issues

- **Hosting, deployment, API, or site bugs**: Open an issue here.
- **Simulator behavior**: Check the [main repository](https://github.com/nevodesigns/circuitcoach) first, then open an issue there.
- **Security concerns**: See [SECURITY.md](./SECURITY.md).

## License

Contributions are made under the [MIT License](./LICENSE). By submitting a pull request, you agree that your contributions are licensed under the MIT License.
