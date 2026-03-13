"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { menuItems, categories } from "@/lib/menu-data";
import { AddToCartModal } from "@/components/AddToCartModal";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartStore } from "@/store/cart-store";
import type { MenuItem } from "@/lib/types";
import Link from "next/link";

function MenuContent() {
  const searchParams = useSearchParams();
  const setTableLabel = useCartStore((s) => s.setTableLabel);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("ramen");

  useEffect(() => {
    const table = searchParams.get("table");
    if (table) setTableLabel(table);
  }, [searchParams, setTableLabel]);

  const byCategory = categories.map((cat) => ({
    ...cat,
    items: menuItems.filter((m) => m.category === cat.id),
  }));

  return (
    <main className="app-shell pb-40">
      <header className="sticky top-0 z-30 border-b border-[#f1e4d6] bg-[rgba(255,247,236,0.96)] backdrop-blur">
        <div className="app-container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--ramen-primary)] text-lg font-semibold text-white shadow-[0_10px_24px_rgba(226,122,50,0.5)]"
            >
              🍜
            </Link>
            <div className="text-xs">
              <p className="font-semibold text-[color:var(--ramen-brown)]">
                Ramen Menu
              </p>
              <p className="text-[11px] text-[color:var(--ramen-muted)]">
                Quét QR trên bàn để gọi món
              </p>
            </div>
          </div>
          <div className="hidden text-right text-[11px] text-[color:var(--ramen-muted)] sm:block">
            <p className="font-medium text-[color:var(--ramen-primary-strong)]">
              Trải nghiệm mobile-first
            </p>
            <p>Thiết kế cho mọi thiết bị</p>
          </div>
        </div>
        <div className="app-container pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`pill shrink-0 ${
                  activeCategory === cat.id
                    ? "bg-[var(--ramen-primary)] text-stone-950 shadow-sm shadow-[rgba(226,122,50,0.4)]"
                    : "bg-[var(--ramen-surface-strong)] text-[color:var(--ramen-muted)] border border-[#e2d2bf] hover:border-[var(--ramen-primary)]/70"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="app-container py-5 space-y-6">
        <section className="rounded-2xl bg-[var(--ramen-surface)] p-4 shadow-[0_10px_30px_rgba(163,113,59,0.15)]">
          <p className="text-xs font-semibold text-[color:var(--ramen-primary-strong)]">
            Chọn món theo sở thích
          </p>
          <p className="mt-1 text-[11px] text-stone-400">
            Chạm vào món để tùy chỉnh độ cay, độ dai mì và thêm topping. Giao diện
            được tối ưu cho màn hình điện thoại.
          </p>
        </section>

        {byCategory.map(
          (section) =>
            section.items.length > 0 && (
              <section
                key={section.id}
                id={section.id}
                className={activeCategory !== section.id ? "hidden" : ""}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[color:var(--ramen-brown)]">
                    {section.label}
                  </h2>
                  <span className="text-xs text-stone-500">
                    {section.items.length} món
                  </span>
                </div>
                <ul className="space-y-3">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="group flex w-full items-stretch gap-3 rounded-2xl bg-white p-3 text-left shadow-[0_8px_24px_rgba(15,23,42,0.12)] ring-1 ring-[#f4e5d7] transition hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(15,23,42,0.22)] hover:ring-[var(--ramen-primary)]/80"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#fde9d4] to-[#f8d5af]">
                          <div className="absolute inset-0 opacity-40 group-hover:opacity-60">
                            <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(248,250,252,0.12),transparent),radial-gradient(circle_at_80%_80%,rgba(234,88,12,0.3),transparent)]" />
                          </div>
                          <div className="relative flex h-full w-full items-center justify-center text-[10px] text-[color:var(--ramen-muted)]">
                            ảnh món
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col justify-between gap-1">
                          <div>
                            <p className="text-sm font-semibold text-[color:var(--ramen-brown)]">
                              {item.nameVi ?? item.name}
                            </p>
                            {item.description && (
                              <p className="mt-0.5 line-clamp-2 text-[11px] text-[color:var(--ramen-muted)]">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="rounded-full bg-[var(--ramen-surface-strong)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[color:var(--ramen-muted)]">
                              Chạm để chọn &amp; tùy chỉnh
                            </span>
                            <span className="text-sm font-semibold text-[color:var(--ramen-primary-strong)]">
                              {item.price.toLocaleString("vi-VN")}₫
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
        )}
      </div>

      {selectedItem && (
        <AddToCartModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
      <CartDrawer />
    </main>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-500">Đang tải menu...</div>}>
      <MenuContent />
    </Suspense>
  );
}
