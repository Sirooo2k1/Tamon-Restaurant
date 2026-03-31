import QRCode from "qrcode";
import type { QRCodeToDataURLOptions } from "qrcode";
import { MENU_QR_TO_PNG_OPTIONS } from "@/lib/qr-render-options";

/** 卓QR印刷の目安（mm）— 用紙・フレーム 63×88 と同じ縦横比で 1 枚出力 */
export const MENU_QR_PRINT_FRAME_MM = { w: 63, h: 88 } as const;

/** 1mm あたりのピクセル（印刷時にフレーム全体を埋めやすい解像度。例: 15 → 945×1320px） */
const PX_PER_MM = 15;

const FONT_STACK =
  'system-ui, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Meiryo", sans-serif';

const CANVAS_W = MENU_QR_PRINT_FRAME_MM.w * PX_PER_MM;
const CANVAS_H = MENU_QR_PRINT_FRAME_MM.h * PX_PER_MM;

/** 枠（63×88mm）の辺までの余白 — 上下左右ともに広めに取り、QR 塊を中央にのせる */
const INSET_MM_X = 4;
const INSET_MM_Y = 4.5;
const INSET_PX_X = Math.round(INSET_MM_X * PX_PER_MM);
const INSET_PX_Y = Math.round(INSET_MM_Y * PX_PER_MM);

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("QR image load failed"));
    img.src = dataUrl;
  });
}

function fitLabelFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxPx: number,
  minPx: number
): number {
  let size = maxPx;
  while (size >= minPx) {
    ctx.font = `600 ${size}px ${FONT_STACK}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  ctx.font = `600 ${minPx}px ${FONT_STACK}`;
  return minPx;
}

/**
 * 印刷・ZIP用 — 63×88mm と同じ縦横比のキャンバスに QR + 卓名を縦方向センターで配置した PNG（data URL）
 * ブラウザ専用（canvas）
 */
export async function buildMenuQrPrintablePngDataUrl(
  targetUrl: string,
  labelJa: string
): Promise<string> {
  if (typeof document === "undefined") {
    throw new Error("buildMenuQrPrintablePngDataUrl is browser-only");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  const innerW = CANVAS_W - INSET_PX_X * 2;
  const innerH = CANVAS_H - INSET_PX_Y * 2;

  const labelGap = Math.max(14, Math.round(1.8 * PX_PER_MM));
  const fontMax = Math.min(50, Math.round(3.4 * PX_PER_MM));
  const fontMin = Math.max(15, Math.round(1.1 * PX_PER_MM));

  const labelMaxW = innerW - Math.round(1.2 * PX_PER_MM);
  const fontSize = fitLabelFontSize(ctx, labelJa, labelMaxW, fontMax, fontMin);
  const labelBlockH = Math.ceil(fontSize * 1.22);

  const qrSize = Math.max(
    120,
    Math.min(
      Math.floor(innerW * 0.86),
      innerH - labelGap - labelBlockH - Math.round(PX_PER_MM * 0.6)
    )
  );

  const qrOpts: QRCodeToDataURLOptions = {
    ...MENU_QR_TO_PNG_OPTIONS,
    width: qrSize,
  };
  const qrDataUrl = await QRCode.toDataURL(targetUrl, qrOpts);
  const qrImg = await loadImage(qrDataUrl);

  const blockH = qrSize + labelGap + labelBlockH;
  const blockTop = INSET_PX_Y + Math.max(0, (innerH - blockH) / 2);
  const qrX = (CANVAS_W - qrSize) / 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.drawImage(qrImg, qrX, blockTop, qrSize, qrSize);

  ctx.fillStyle = MENU_QR_TO_PNG_OPTIONS.color?.dark ?? "#0f172a";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `600 ${fontSize}px ${FONT_STACK}`;
  ctx.fillText(labelJa, CANVAS_W / 2, blockTop + qrSize + labelGap);

  return canvas.toDataURL("image/png");
}
