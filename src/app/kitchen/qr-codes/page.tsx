/**
 * 印刷用QR — URLは NEXT_PUBLIC_APP_URL / localStorage / 現在のオリジン（UIなし）
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { KitchenDesktopAside, KitchenMobileNav } from "@/components/kitchen/KitchenNav";
import { QrTableTile } from "@/components/kitchen/QrTableTile";
import { normalizePublicBaseUrl } from "@/lib/qr-order-url";
import { downloadAllMenuQrPngsAsZip } from "@/lib/kitchen-qr-batch-zip";
import { RESTAURANT_QR_TABLES } from "@/lib/restaurant-qr-tables";

const STORAGE_KEY = "remenshop-qr-public-base-url";

export default function QRCodesPage() {
  const [mounted, setMounted] = useState(false);
  const [publicBase, setPublicBase] = useState("");
  const [zipBusy, setZipBusy] = useState(false);

  const handleDownloadAllZip = useCallback(async () => {
    if (!publicBase.trim()) return;
    setZipBusy(true);
    try {
      await downloadAllMenuQrPngsAsZip(publicBase);
    } catch (e) {
      console.error("[qr-codes] ZIP failed", e);
      window.alert("ZIPの作成に失敗しました。しばらく待って再試行してください。");
    } finally {
      setZipBusy(false);
    }
  }, [publicBase]);

  useEffect(() => {
    const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = normalizePublicBaseUrl(env || saved || window.location.origin);
    setPublicBase(initial);
    setMounted(true);
  }, []);

  return (
    <main className="app-shell flex min-h-screen bg-[#FAF8F0] text-gray-800">
      <KitchenDesktopAside active="qr" />

      <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:px-8 lg:py-6">
        <KitchenMobileNav active="qr" />
        {!mounted ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600/70" aria-label="読み込み中" />
          </div>
        ) : (
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-100/90 bg-white/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg font-bold text-stone-900">卓用オーダーQR</h1>
                <p className="mt-1 text-sm text-stone-600">
                  1枚ずつ「印刷用PNG」でも保存できます。
                  <span className="block sm:inline sm:before:content-['_·_']">
                    まとめて使う場合はZIPを1回だけダウンロードしてください。
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleDownloadAllZip()}
                disabled={zipBusy || !publicBase.trim()}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-[#FAF8F0] px-4 py-3 text-sm font-bold text-stone-900 shadow-sm ring-1 ring-amber-100 transition hover:border-amber-300 hover:bg-amber-50/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {zipBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Download className="h-4 w-4" aria-hidden />
                )}
                全卓まとめてZIP
              </button>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {RESTAURANT_QR_TABLES.map((preset) => (
                <QrTableTile key={preset.id} preset={preset} baseUrl={publicBase} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
