"use client";

import Link from "next/link";
import { Ban, LayoutDashboard, QrCode, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";

export type KitchenNavActive = "overview" | "orders" | "qr" | "stock";

type KitchenNavProps = {
  active: KitchenNavActive;
  /** YYYY-MM-DD for overview / orders links; omit on pages without a selected day (e.g. QR). */
  dateParam?: string;
  ordersAttentionCount?: number;
};

function useKitchenHrefs(dateParam?: string) {
  const q = dateParam ? `?date=${encodeURIComponent(dateParam)}` : "";
  return {
    overview: `/kitchen${q}`,
    orders: `/kitchen/orders${q}`,
    qr: "/kitchen/qr-codes",
    stock: "/kitchen/menu-availability",
  };
}

/** Desktop left rail — visible from `lg` up (matches previous `aside`). */
export function KitchenDesktopAside({
  active,
  dateParam,
  ordersAttentionCount = 0,
}: KitchenNavProps) {
  const hrefs = useKitchenHrefs(dateParam);
  const inactive =
    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-gray-600 hover:bg-[#FAF8F0]/70 hover:text-gray-900";
  const activeCls =
    "flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-[#FAF8F0] px-3 py-2 text-[11px] font-medium text-gray-900 shadow-sm ring-1 ring-amber-100";

  return (
    <aside className="hidden w-60 flex-col border-r border-amber-200/80 bg-white px-4 py-5 text-sm lg:flex">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-lg font-semibold text-amber-800">
          🍜
        </div>
        <span className="text-xs font-semibold tracking-[0.14em] uppercase text-gray-800">
          Ramen Admin
        </span>
      </div>

      <nav className="space-y-1 text-xs font-medium" aria-label="キッチン">
        {active === "overview" ? (
          <div className={activeCls}>
            <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
            <span>Overview</span>
          </div>
        ) : (
          <Link href={hrefs.overview} className={inactive}>
            <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
            <span>Overview</span>
          </Link>
        )}

        {active === "orders" ? (
          <div className="relative flex w-full items-center gap-2 rounded-xl border border-amber-200/60 bg-[#FAF8F0] px-3 py-2 text-[11px] font-medium text-gray-900 shadow-sm ring-1 ring-amber-50/80">
            <ReceiptText className="h-3.5 w-3.5" aria-hidden />
            <span>Orders</span>
            {ordersAttentionCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-white ring-2 ring-[#FAF8F0]">
                {ordersAttentionCount > 99 ? "99+" : ordersAttentionCount}
              </span>
            )}
          </div>
        ) : (
          <Link href={hrefs.orders} className={inactive}>
            <ReceiptText className="h-3.5 w-3.5" aria-hidden />
            <span>Orders</span>
            {ordersAttentionCount > 0 && (
              <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-200/90 px-1 text-[10px] font-bold text-amber-950">
                {ordersAttentionCount > 99 ? "99+" : ordersAttentionCount}
              </span>
            )}
          </Link>
        )}

        {active === "qr" ? (
          <div className={activeCls}>
            <QrCode className="h-3.5 w-3.5" aria-hidden />
            <span>QR Codes</span>
          </div>
        ) : (
          <Link href={hrefs.qr} className={inactive}>
            <QrCode className="h-3.5 w-3.5" aria-hidden />
            <span>QR Codes</span>
          </Link>
        )}

        {active === "stock" ? (
          <div className={activeCls}>
            <Ban className="h-3.5 w-3.5" aria-hidden />
            <span>Sold out</span>
          </div>
        ) : (
          <Link href={hrefs.stock} className={inactive}>
            <Ban className="h-3.5 w-3.5" aria-hidden />
            <span>Sold out</span>
          </Link>
        )}
      </nav>
    </aside>
  );
}

/** Compact tab bar for phones / small tablets — sticky at top of the main scroll area. */
export function KitchenMobileNav({
  active,
  dateParam,
  ordersAttentionCount = 0,
}: KitchenNavProps) {
  const hrefs = useKitchenHrefs(dateParam);

  const tabBtn = (isActive: boolean) =>
    cn(
      "relative flex min-h-[44px] min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 text-center text-[9px] font-semibold leading-tight transition sm:px-1.5 sm:text-[11px]",
      isActive
        ? "border border-amber-300/80 bg-white text-gray-900 shadow-sm ring-1 ring-amber-100"
        : "border border-transparent text-gray-600 hover:bg-white/70 hover:text-gray-900"
    );

  return (
    <div
      className={cn(
        "lg:hidden sticky top-0 z-40 -mx-4 mb-4 border-b border-amber-200/70 bg-[#FAF8F0]/95 px-2 py-2",
        "backdrop-blur-md supports-[backdrop-filter]:bg-[#FAF8F0]/88 sm:-mx-6"
      )}
    >
      <nav
        className="mx-auto grid max-w-3xl grid-cols-4 gap-1 sm:gap-1.5"
        aria-label="キッチン画面の切り替え"
      >
        {active === "overview" ? (
          <span className={tabBtn(true)}>
            <LayoutDashboard className="h-4 w-4 shrink-0 text-amber-800" aria-hidden />
            <span>Overview</span>
          </span>
        ) : (
          <Link href={hrefs.overview} className={tabBtn(false)} prefetch={false}>
            <LayoutDashboard className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span>Overview</span>
          </Link>
        )}

        {active === "orders" ? (
          <span className={tabBtn(true)}>
            <span className="relative inline-flex">
              <ReceiptText className="h-4 w-4 shrink-0 text-amber-800" aria-hidden />
              {ordersAttentionCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[8px] font-bold text-white ring-2 ring-[#FAF8F0]">
                  {ordersAttentionCount > 99 ? "99+" : ordersAttentionCount}
                </span>
              )}
            </span>
            <span>Orders</span>
          </span>
        ) : (
          <Link href={hrefs.orders} className={tabBtn(false)} prefetch={false}>
            <span className="relative inline-flex">
              <ReceiptText className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              {ordersAttentionCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-400 px-0.5 text-[8px] font-bold text-amber-950 ring-2 ring-[#FAF8F0]">
                  {ordersAttentionCount > 99 ? "99+" : ordersAttentionCount}
                </span>
              )}
            </span>
            <span>Orders</span>
          </Link>
        )}

        {active === "qr" ? (
          <span className={tabBtn(true)}>
            <QrCode className="h-4 w-4 shrink-0 text-amber-800" aria-hidden />
            <span>QR</span>
          </span>
        ) : (
          <Link href={hrefs.qr} className={tabBtn(false)} prefetch={false}>
            <QrCode className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span>QR</span>
          </Link>
        )}

        {active === "stock" ? (
          <span className={tabBtn(true)}>
            <Ban className="h-4 w-4 shrink-0 text-amber-800" aria-hidden />
            <span className="leading-tight">Sold out</span>
          </span>
        ) : (
          <Link href={hrefs.stock} className={tabBtn(false)} prefetch={false}>
            <Ban className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span className="leading-tight">Sold out</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
