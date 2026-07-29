"use client";

import { cn } from "@/lib/utils";
import {
  useCustomerLocaleStore,
  type CustomerLocale,
} from "@/store/customer-locale-store";

const OPTIONS: { id: CustomerLocale; label: string }[] = [
  { id: "ja", label: "日本語" },
  { id: "en", label: "EN" },
  { id: "zh", label: "中文" },
  { id: "ko", label: "한국어" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useCustomerLocaleStore((s) => s.locale);
  const setLocale = useCustomerLocaleStore((s) => s.setLocale);

  return (
    <div
      className={cn(
        "inline-flex max-w-full flex-wrap justify-end rounded-full border border-emerald-200/80 bg-white/90 p-0.5 shadow-sm",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {OPTIONS.map((opt) => {
        const active = locale === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLocale(opt.id)}
            className={cn(
              "rounded-full px-2 py-1 text-[10px] font-semibold transition sm:px-2.5 sm:text-[11px]",
              active
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-900/70 hover:bg-emerald-50 hover:text-emerald-950"
            )}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
