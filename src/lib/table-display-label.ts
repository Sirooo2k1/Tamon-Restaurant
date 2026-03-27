import { displayLabelFromTableCode } from "@/lib/restaurant-qr-tables";

/**
 * Maps `?table=` (QR payload) → 卓QRカードの `labelJa` と同じ表示名（`restaurant-qr-tables`）。
 */
export function tableDisplayLabelFromQrCode(code: string): string {
  return displayLabelFromTableCode(code);
}
