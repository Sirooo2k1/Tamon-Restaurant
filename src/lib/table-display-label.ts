/**
 * Maps `?table=` (QR payload) → short display label for guests and persisted orders.
 */
export function tableDisplayLabelFromQrCode(code: string): string {
  const c = code.trim();
  if (!c) return "";
  const upper = c.toUpperCase();
  if (upper === "MV") return "テイクアウト";

  const numbered = /^T(\d+)$/i.exec(c);
  if (numbered) return `テーブル${numbered[1]}`;

  if (/^[AB]$/i.test(c)) return `テーブル${c.toUpperCase()}`;

  return `テーブル${c}`;
}
