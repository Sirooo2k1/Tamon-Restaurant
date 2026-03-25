/**
 * 印刷用QR — URLは NEXT_PUBLIC_APP_URL / localStorage / 現在のオリジン（UIなし）
 */
"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { KitchenDesktopAside, KitchenMobileNav } from "@/components/kitchen/KitchenNav";
import { QrTableTile } from "@/components/kitchen/QrTableTile";
import { normalizePublicBaseUrl } from "@/lib/qr-order-url";
import { RESTAURANT_QR_TABLES } from "@/lib/restaurant-qr-tables";

const STORAGE_KEY = "remenshop-qr-public-base-url";

export default function QRCodesPage() {
  const [mounted, setMounted] = useState(false);
  const [publicBase, setPublicBase] = useState("");

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
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {RESTAURANT_QR_TABLES.map((preset) => (
              <QrTableTile key={preset.id} preset={preset} baseUrl={publicBase} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
