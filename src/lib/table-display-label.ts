/**
 * Chuyển giá trị `?table=` (mã trong QR) → nhãn hiển thị cho khách / đơn hàng.
 */
export function tableDisplayLabelFromQrCode(code: string): string {
  const c = code.trim();
  if (!c) return "";
  const upper = c.toUpperCase();
  if (upper === "MV") return "Mang về";

  const numbered = /^T(\d+)$/i.exec(c);
  if (numbered) return `Bàn ${numbered[1]}`;

  if (/^[AB]$/i.test(c)) return `Bàn ${c.toUpperCase()}`;

  return `Bàn ${c}`;
}
