"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { fetchTrackedOrderId, TRACKED_ORDER_UPDATED_EVENT } from "@/lib/recent-order-tracking";

/** Giỏ lưu đơn vị nội bộ 円×200 (cùng `Y()` trong menu-data), không phải số yen thô. */
function formatYenJaFromInternal(internalTotal: number) {
  return `¥${Math.round(internalTotal / 200).toLocaleString("ja-JP")}`;
}

/** Màu & nền gốc của app: gradient mint–kem, viền emerald nhạt */
const cartDockWrap =
  "w-full overflow-hidden rounded-2xl border border-emerald-100/80 shadow-md sm:rounded-[1.375rem]";
const cartDockStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 50%, #fffbeb 100%)",
  boxShadow: "0 -2px 12px rgba(6, 95, 70, 0.08)",
};

/**
 * - Thanh giỏ: Link /checkout, tổng ¥ sau khi quy từ đơn vị nội bộ
 * - Tiến độ: FAB góc phải trên → đi thẳng /order/[id] (không mở sheet trung gian)
 */
export function CartDrawer() {
  const pathname = usePathname();
  const hideCartBar = pathname === "/checkout";

  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const itemCount = useCartStore((s) => s.items.reduce((n, l) => n + l.quantity, 0));

  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);

  const refreshTracked = useCallback(async () => {
    setTrackedOrderId(await fetchTrackedOrderId());
  }, []);

  useEffect(() => {
    void refreshTracked();
    const onUp = () => void refreshTracked();
    window.addEventListener(TRACKED_ORDER_UPDATED_EVENT, onUp);
    return () => window.removeEventListener(TRACKED_ORDER_UPDATED_EVENT, onUp);
  }, [refreshTracked]);

  const subtotal = getSubtotal();

  if (!trackedOrderId && itemCount === 0) return null;

  const progressShort = trackedOrderId ? trackedOrderId.slice(0, 6).toUpperCase() : "";
  const hideProgressFab =
    Boolean(trackedOrderId) && pathname === `/order/${trackedOrderId}`;

  return (
    <>
      {/* Tiến độ: FAB → /order/[id] */}
      {trackedOrderId && !hideProgressFab && (
        <div
          className="pointer-events-none fixed left-0 right-0 top-0 z-[100] flex justify-end p-3 sm:p-4"
          style={{
            paddingTop: "max(0.75rem, env(safe-area-inset-top))",
            paddingRight: "max(0.75rem, env(safe-area-inset-right))",
          }}
        >
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <Link
              href={`/order/${trackedOrderId}`}
              className="group relative flex h-[3.25rem] min-w-[3.25rem] items-center justify-center rounded-2xl border border-amber-300/90 bg-gradient-to-br from-amber-50 to-white px-3 shadow-[0_8px_30px_rgba(180,83,9,0.12)] backdrop-blur-md transition hover:border-amber-400 sm:h-14 sm:min-w-[3.5rem] sm:rounded-[1.1rem]"
              aria-label="ご注文の進捗を全画面で見る"
            >
              <ClipboardList
                className="h-6 w-6 text-amber-800 transition group-hover:text-amber-900 sm:h-7 sm:w-7"
                strokeWidth={2.2}
              />
              <span className="absolute -right-1 -top-1 rounded-md bg-amber-500 px-1 py-0.5 text-[8px] font-bold leading-none text-white ring-2 ring-white sm:text-[9px]">
                #{progressShort}
              </span>
            </Link>
          </div>
        </div>
      )}

      {!hideCartBar && itemCount > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100]">
          <div
            className="pointer-events-auto mx-auto max-w-2xl px-3 pt-1 sm:px-6"
            style={{
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            }}
          >
            <div className={cartDockWrap} style={cartDockStyle}>
              <Link
                href="/checkout"
                className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition hover:opacity-95 active:opacity-90 sm:gap-5 sm:px-6 sm:py-4"
                aria-label={`VIEW CART、${itemCount}点、${formatYenJaFromInternal(subtotal)}`}
              >
                <span className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  <span className="inline-flex size-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-emerald-200/80 bg-emerald-100 text-center text-sm font-bold tabular-nums leading-none text-emerald-950 sm:size-10 sm:text-[0.9375rem]">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800 sm:text-[11px]">
                      VIEW CART
                    </span>
                    <span className="mt-0.5 block text-[15px] font-bold leading-[1.15] tracking-tight text-gray-900 sm:text-[17px]">
                      注文手続きへ
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-base font-bold tabular-nums tracking-tight text-gray-900 sm:text-lg">
                  {formatYenJaFromInternal(subtotal)}
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
