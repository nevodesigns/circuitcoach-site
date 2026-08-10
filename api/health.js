/* Lets the front end discover whether this deployment has a tutor configured.
   Reports only whether a key is present, never the key itself. */
const MODELS = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.0-flash',
     'gemini-pro-latest'];

export default function handler(req, res) {
  const ok = Boolean(process.env.GEMINI_API_KEY);
  res.status(ok ? 200 : 503).json({
    ok,
    keyLoaded: ok,
    model: MODELS[0],
    models: MODELS
  });
}
