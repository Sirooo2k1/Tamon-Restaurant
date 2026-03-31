import JSZip from "jszip";
import { saveAs } from "file-saver";
import { buildMenuTableUrl } from "@/lib/qr-order-url";
import { buildMenuQrPrintablePngDataUrl } from "@/lib/menu-qr-printable-image";
import { RESTAURANT_QR_TABLES } from "@/lib/restaurant-qr-tables";

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const i = dataUrl.indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let j = 0; j < bin.length; j++) out[j] = bin.charCodeAt(j);
  return out;
}

/** 全卓の menu QR を1つのZIPにまとめて保存（印刷店に渡す・一括印刷の下準備用） */
export async function downloadAllMenuQrPngsAsZip(baseUrl: string): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder("menu-qr");

  for (const preset of RESTAURANT_QR_TABLES) {
    const targetUrl = buildMenuTableUrl(baseUrl, preset.code);
    if (!targetUrl) continue;
    const dataUrl = await buildMenuQrPrintablePngDataUrl(targetUrl, preset.labelJa);
    const bytes = dataUrlToUint8Array(dataUrl);
    const safeName = `menu-qr-${preset.code.replace(/[^\w.-]+/g, "_")}.png`;
    folder?.file(safeName, bytes);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const stamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `remenshop-menu-qr-${stamp}.zip`);
}
