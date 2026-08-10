/* Best effort rate limiting for the public hint endpoint.
 *
 * This is deliberately dependency free, which means the counters live in the
 * memory of one warm serverless instance. Vercel may run several instances, so
 * treat these as per instance ceilings rather than a global guarantee. That is
 * still enough to stop a single visitor, or a single hot instance, from draining
 * the API quota. For a hard global cap, back this with Vercel KV or Upstash and
 * swap the two Map lookups for a shared counter.
 *
 * Files in /api that begin with an underscore are not routed by Vercel, so this
 * is a helper rather than an endpoint.
 */

const WINDOW_MS = 10 * 60 * 1000;   // ten minutes
const PER_IP = 8;                   // hints per IP per window
const PER_INSTANCE = 60;            // hints per warm instance per window

const hits = new Map();             // ip -> array of timestamps
let instanceHits = [];

function prune(list, now) {
  const cut = now - WINDOW_MS;
  let i = 0;
  while (i < list.length && list[i] <= cut) i++;
  return i ? list.slice(i) : list;
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length) return String(fwd[0]).trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/* Returns { ok } or { ok: false, scope, retryAfter } in seconds. */
export function take(ip, now = Date.now()) {
  instanceHits = prune(instanceHits, now);
  if (instanceHits.length >= PER_INSTANCE) {
    return { ok: false, scope: 'instance', retryAfter: retryIn(instanceHits, now) };
  }

  const mine = prune(hits.get(ip) || [], now);
  if (mine.length >= PER_IP) {
    hits.set(ip, mine);
    return { ok: false, scope: 'ip', retryAfter: retryIn(mine, now) };
  }

  mine.push(now);
  hits.set(ip, mine);
  instanceHits.push(now);

  /* keep the map from growing without bound on a long lived instance */
  if (hits.size > 500) {
    for (const [key, list] of hits) {
      if (prune(list, now).length === 0) hits.delete(key);
    }
  }
  return { ok: true, remaining: PER_IP - mine.length };
}

function retryIn(list, now) {
  return Math.max(1, Math.ceil((list[0] + WINDOW_MS - now) / 1000));
}

export const LIMITS = { WINDOW_MS, PER_IP, PER_INSTANCE };

/* test seam: lets the self check start from a clean slate */
export function _reset() { hits.clear(); instanceHits = []; }
