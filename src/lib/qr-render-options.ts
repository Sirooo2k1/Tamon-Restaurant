import type { QRCodeToDataURLOptions } from "qrcode";

/** Tuỳ chọn in QR — đồng bộ tile + ZIP */
export const MENU_QR_TO_PNG_OPTIONS: QRCodeToDataURLOptions = {
  width: 280,
  margin: 2,
  color: {
    dark: "#0f172a",
    light: "#ffffff",
  },
  errorCorrectionLevel: "M",
};
