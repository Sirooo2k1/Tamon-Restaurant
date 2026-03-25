/**
 * Giới hạn đăng nhập sai theo IP (in-memory).
 * Trên môi trường nhiều instance (serverless scale-out) mỗi instance có bộ đếm riêng —
 * vẫn giúp chặn brute force từng node; production nên cân nhắc Redis / edge rate limit.
 */

const WINDOW_MS = 15 * 60 * 1000;
/** Số lần thất bại tối đa trong cửa sổ trước khi khóa */
const MAX_FAILED_IN_WINDOW = 5;

type Entry = { attempts: number[] };

const store = new Map<string, Entry>();

function prune(now: number, timestamps: number[]): number[] {
  return timestamps.filter((t) => now - t < WINDOW_MS);
}

export function getClientIpFromRequest(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function checkKitchenLoginAllowed(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const entry = store.get(ip);
  const attempts = entry ? prune(now, entry.attempts) : [];
  if (attempts.length >= MAX_FAILED_IN_WINDOW) {
    const oldest = attempts[0]!;
    const retryAfterMs = WINDOW_MS - (now - oldest);
    const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}

export function recordKitchenLoginFailure(ip: string): void {
  const now = Date.now();
  const entry = store.get(ip);
  const attempts = prune(now, entry?.attempts ?? []);
  attempts.push(now);
  store.set(ip, { attempts });
}

export function clearKitchenLoginAttempts(ip: string): void {
  store.delete(ip);
}

/** Trễ ngẫu nhiên sau thất bại — làm khó đoán timing (không áp dụng khi rate limit 429) */
export async function kitchenLoginFailureDelay(): Promise<void> {
  const ms = 450 + Math.floor(Math.random() * 550);
  await new Promise((r) => setTimeout(r, ms));
}
