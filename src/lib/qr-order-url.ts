/**
 * URL mà QR order trỏ tới — khớp với `/menu?table=` và checkout.
 */
export function normalizePublicBaseUrl(raw: string): string {
  let s = raw.trim();
  if (!s) return "";
  s = s.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }
  return s;
}

export function buildMenuTableUrl(baseUrl: string, tableCode: string): string {
  const base = normalizePublicBaseUrl(baseUrl);
  if (!base) return "";
  return `${base}/menu?table=${encodeURIComponent(tableCode)}`;
}
