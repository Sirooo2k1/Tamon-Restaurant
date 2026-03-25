/**
 * 印刷用QR — URLは NEXT_PUBLIC_APP_URL / localStorage / 現在のオリジン（UIなし）
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, ReceiptText, QrCode, Loader2 } from "lucide-react";
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
      <aside className="hidden w-60 flex-col border-r border-amber-200/80 bg-white px-4 py-5 text-sm lg:flex">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-lg font-semibold text-amber-800">
            🍜
          </div>
          <span className="text-xs font-semibold tracking-[0.14em] uppercase text-gray-800">
            Ramen Admin
          </span>
        </div>

        <nav className="space-y-1 text-xs font-medium">
          <Link
            href="/kitchen"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-gray-600 hover:bg-[#FAF8F0]/70 hover:text-gray-900"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Overview</span>
          </Link>
          <Link
            href="/kitchen/orders"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-gray-600 hover:bg-[#FAF8F0]/70 hover:text-gray-900"
          >
            <ReceiptText className="h-3.5 w-3.5" />
            <span>Orders</span>
          </Link>
          <div className="flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-[#FAF8F0] px-3 py-2 text-[11px] font-medium text-gray-900 shadow-sm ring-1 ring-amber-100">
            <QrCode className="h-3.5 w-3.5" />
            <span>QR Codes</span>
          </div>
        </nav>
      </aside>

      <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:px-8 lg:py-6">
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
