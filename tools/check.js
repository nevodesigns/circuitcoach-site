/* Self checks that need no network and no browser:
     node tools/check.js
   Covers the request validation and the rate limiter, which are the two pieces
   of real logic in this repository. */
import { take, _reset, LIMITS } from '../api/_ratelimit.js';

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  cond ? pass++ : fail++;
  console.log('  %s %s%s', cond ? 'ok  ' : 'FAIL', name, extra ? '  :: ' + extra : '');
}

console.log('\n== rate limiter ==========================================');
_reset();
const t0 = Date.now();
let allowed = 0;
for (let i = 0; i < LIMITS.PER_IP + 4; i++) {
  if (take('1.2.3.4', t0).ok) allowed++;
}
ok('one IP is capped at PER_IP', allowed === LIMITS.PER_IP, allowed + ' allowed');

const blocked = take('1.2.3.4', t0);
ok('further requests are refused', blocked.ok === false && blocked.scope === 'ip');
ok('a Retry-After is supplied', blocked.retryAfter > 0, blocked.retryAfter + 's');

_reset();
ok('a different IP is unaffected', take('9.9.9.9', t0).ok === true);

_reset();
let n = 0;
for (let i = 0; i < LIMITS.PER_INSTANCE + 20; i++) {
  if (take('ip-' + i, t0).ok) n++;
}
ok('the instance ceiling holds across IPs', n === LIMITS.PER_INSTANCE, n + ' allowed');

_reset();
take('5.5.5.5', t0);
const later = t0 + LIMITS.WINDOW_MS + 1000;
let after = 0;
for (let i = 0; i < LIMITS.PER_IP; i++) if (take('5.5.5.5', later).ok) after++;
ok('the window slides so quota returns', after === LIMITS.PER_IP, after + ' allowed later');

console.log('\n== request validation ====================================');
const mod = await import('../api/hint.js');
/* handler is the default export; the validators are module private, so drive
   them through the handler with a stubbed response and no API key set */
delete process.env.GEMINI_API_KEY;
function fakeRes() {
  const r = { code: 0, body: null, headers: {} };
  r.status = c => { r.code = c; return r; };
  r.json = b => { r.body = b; return r; };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.end = () => r;
  return r;
}
let r = fakeRes();
await mod.default({ method: 'GET', headers: {}, body: {} }, r);
ok('GET is rejected with 405', r.code === 405, 'got ' + r.code);

r = fakeRes();
await mod.default({ method: 'POST', headers: {}, body: { code: 'no_led', level: 2 } }, r);
ok('missing key reports 503, not a crash', r.code === 503, 'got ' + r.code);

console.log('\n' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail ? 1 : 0);
