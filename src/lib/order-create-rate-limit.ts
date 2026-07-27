/**
 * Giới hạn tạo/gộp đơn theo IP (in-memory per instance).
 */
import { getClientIpFromRequest } from "@/lib/kitchen-login-rate-limit";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_IN_WINDOW = 30;

type Entry = { hits: number[] };
const store = new Map<string, Entry>();

function prune(now: number, hits: number[]): number[] {
  return hits.filter((t) => now - t < WINDOW_MS);
}

export { getClientIpFromRequest };

export function checkOrderCreateAllowed(
  ip: string
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const entry = store.get(ip);
  const hits = entry ? prune(now, entry.hits) : [];
  if (hits.length >= MAX_IN_WINDOW) {
    const oldest = hits[0]!;
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}

export function recordOrderCreate(ip: string): void {
  const now = Date.now();
  const entry = store.get(ip);
  const hits = prune(now, entry?.hits ?? []);
  hits.push(now);
  store.set(ip, { hits });
}
