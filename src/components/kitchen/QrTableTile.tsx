"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { buildMenuTableUrl } from "@/lib/qr-order-url";
import { buildMenuQrPrintablePngDataUrl } from "@/lib/menu-qr-printable-image";
import type { QrTablePreset } from "@/lib/restaurant-qr-tables";
import { cn } from "@/lib/utils";

type Props = {
  preset: QrTablePreset;
  baseUrl: string;
};

/** 印刷用 — QR の下に卓名を描いた 1 枚の PNG を表示・保存 */
export function QrTableTile({ preset, baseUrl }: Props) {
  const targetUrl = buildMenuTableUrl(baseUrl, preset.code);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetUrl) {
      setLoading(false);
      setError("URLを取得できません");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    buildMenuQrPrintablePngDataUrl(targetUrl, preset.labelJa)
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("生成エラー");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [targetUrl, preset.labelJa]);

  const downloadPng = useCallback(() => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `menu-qr-${preset.code}.png`;
    a.click();
  }, [dataUrl, preset.code]);

  const qrAlt = `${preset.labelJa} · オーダーQR`;

  return (
    <div
      className={cn(
        "flex flex-col items-stretch rounded-2xl border border-amber-100 bg-white p-4 shadow-sm",
        "transition hover:border-amber-200/80 hover:shadow-md"
      )}
    >
      <div className="flex min-h-[220px] flex-1 items-center justify-center rounded-xl bg-stone-50/80 px-2 py-3 ring-1 ring-stone-100">
        {loading && (
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" aria-hidden />
        )}
        {error && !loading && (
          <div className="flex flex-col items-center gap-1 px-2 text-center text-xs text-red-600">
            <AlertCircle className="h-7 w-7" />
            {error}
          </div>
        )}
        {dataUrl && !loading && !error && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={qrAlt}
            className="max-h-[320px] w-full max-w-[min(100%,320px)] object-contain"
          />
        )}
      </div>

      <button
        type="button"
        onClick={downloadPng}
        disabled={!dataUrl}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-[#FAF8F0] py-2.5 text-xs font-bold text-gray-900 shadow-sm ring-1 ring-amber-100 transition hover:border-amber-200 hover:bg-amber-50/90 disabled:opacity-40 [font-feature-settings:'palt']"
      >
        <Download className="h-3.5 w-3.5" />
        印刷用PNG
      </button>
    </div>
  );
}
