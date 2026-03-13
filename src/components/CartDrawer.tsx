"use client";

import { useCartStore } from "@/store/cart-store";
import Link from "next/link";

export function CartDrawer() {
  const { items, getSubtotal, removeItem, updateQuantity } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:right-6 sm:w-80">
        <Link
          href="/menu"
          className="block rounded-2xl border border-dashed border-stone-700/80 bg-stone-900/80 px-4 py-3 text-center text-xs text-stone-400 backdrop-blur"
        >
          Giỏ trống — chạm vào món trong menu để bắt đầu đặt hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:right-6 sm:w-96">
      <div className="glass-panel rounded-3xl bg-stone-950/95 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-stone-700/80 px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-amber-100">
              Giỏ hàng · {items.length} món
            </p>
            <p className="text-[11px] text-stone-500">
              Kiểm tra lại trước khi gửi cho bếp
            </p>
          </div>
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
            {getSubtotal().toLocaleString("vi-VN")}₫
          </span>
        </div>
        <div className="max-h-48 space-y-2 overflow-y-auto px-2 pt-2 pb-1">
          {items.map((line) => (
            <div
              key={line.id}
              className="flex gap-2 rounded-2xl bg-stone-900/90 p-2"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-amber-50">
                  {line.menuItem.nameVi ?? line.menuItem.name}
                </p>
                <p className="text-[11px] text-stone-500">
                  {line.unitPrice.toLocaleString("vi-VN")}₫ × {line.quantity}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateQuantity(line.id, line.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-xl bg-stone-800 text-xs text-amber-100 transition hover:bg-stone-700"
                >
                  −
                </button>
                <span className="w-6 text-center text-xs font-medium text-amber-50">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(line.id, line.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-xl bg-stone-800 text-xs text-amber-100 transition hover:bg-stone-700"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(line.id)}
                  className="p-1 text-xs text-red-400 transition hover:text-red-300"
                  aria-label="Xóa"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-3 pt-2">
          <Link
            href="/checkout"
            className="primary-btn block w-full justify-center text-sm"
          >
            Thanh toán — {getSubtotal().toLocaleString("vi-VN")}₫
          </Link>
        </div>
      </div>
    </div>
  );
}
