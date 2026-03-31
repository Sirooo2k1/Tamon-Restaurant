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

/** 縦方向の幾何中央より「QR+卓名の塊ごと」下へずらす量（mm） */
const BLOCK_SHIFT_DOWN_MM = 1.5;

/**
 * QR の直下〜卓名までの距離（mm）。ここを大きくすると卓名だけ下に離れる。
 */
const LABEL_GAP_BELOW_QR_MM = 10;

/** 卓名の幅を QR の幅に合わせるときの内側余白（片側px） */
const LABEL_TEXT_INSET_FROM_QR_PX = Math.round(0.45 * PX_PER_MM);

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

  const labelGap = Math.max(22, Math.round(LABEL_GAP_BELOW_QR_MM * PX_PER_MM));
  /** 卓名は「QR と同じ横幅」を上限にできるだけ大きく（長文は縮小） */
  const fontMax = Math.min(64, Math.round(4.4 * PX_PER_MM));
  const fontMin = Math.max(17, Math.round(1.15 * PX_PER_MM));
  const vPad = Math.round(PX_PER_MM * 0.6);
  const textPad = LABEL_TEXT_INSET_FROM_QR_PX * 2;

  /** QR サイズと卓名フォントを連立：卓名の maxWidth = QR 幅に揃える */
  let qrSize = Math.max(
    120,
    Math.min(
      Math.floor(innerW * 0.86),
      innerH - labelGap - Math.ceil(fontMin * 1.35) - vPad
    )
  );
  let fontSize = fontMin;
  let labelBlockH = Math.ceil(fontMin * 1.28);

  for (let i = 0; i < 14; i++) {
    const textMaxW = Math.max(40, qrSize - textPad);
    fontSize = fitLabelFontSize(ctx, labelJa, textMaxW, fontMax, fontMin);
    labelBlockH = Math.ceil(fontSize * 1.28);
    const blockNeed = qrSize + labelGap + labelBlockH;
    if (blockNeed <= innerH) break;
    qrSize = Math.max(120, innerH - labelGap - labelBlockH - vPad);
  }

  const qrOpts: QRCodeToDataURLOptions = {
    ...MENU_QR_TO_PNG_OPTIONS,
    width: qrSize,
  };
  const qrDataUrl = await QRCode.toDataURL(targetUrl, qrOpts);
  const qrImg = await loadImage(qrDataUrl);

  const blockH = qrSize + labelGap + labelBlockH;
  const innerTop = INSET_PX_Y;
  const centeredTop = innerTop + Math.max(0, (innerH - blockH) / 2);
  const shiftDownPx = Math.round(BLOCK_SHIFT_DOWN_MM * PX_PER_MM);
  const maxBlockTop = innerTop + innerH - blockH;
  const blockTop = Math.min(maxBlockTop, centeredTop + shiftDownPx);
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
