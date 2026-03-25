/**
 * Ngăn open redirect: chỉ cho phép đường dẫn tương đối nội bộ (pathname + query + hash).
 */
export function kitchenSafeRelativeUrl(candidate: string | undefined | null): string {
  const fallback = "/kitchen";
  if (!candidate?.trim()) return fallback;
  const trimmed = candidate.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return fallback;
  }
  try {
    const u = new URL(trimmed, "https://internal.invalid");
    if (u.hostname !== "internal.invalid") return fallback;
    if (u.protocol !== "https:") return fallback;
    const path = `${u.pathname}${u.search}${u.hash}`;
    return path.length > 0 ? path : fallback;
  } catch {
    return fallback;
  }
}
