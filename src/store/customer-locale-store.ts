import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CustomerLocale = "ja" | "en" | "zh" | "ko";

const STORAGE_KEY = "tamon-customer-locale";

interface CustomerLocaleState {
  locale: CustomerLocale;
  setLocale: (locale: CustomerLocale) => void;
}

function isCustomerLocale(v: unknown): v is CustomerLocale {
  return v === "ja" || v === "en" || v === "zh" || v === "ko";
}

export const useCustomerLocaleStore = create<CustomerLocaleState>()(
  persist(
    (set) => ({
      locale: "ja",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: STORAGE_KEY,
      merge: (persisted, current) => {
        const p = persisted as Partial<CustomerLocaleState> | undefined;
        const locale = isCustomerLocale(p?.locale) ? p.locale : current.locale;
        return { ...current, ...p, locale };
      },
    }
  )
);

export function useCustomerLocale(): CustomerLocale {
  return useCustomerLocaleStore((s) => s.locale);
}

/** Locale dùng bản dịch tên món Latin/English (nameVi) khi có */
export function usesTranslatedMenuNames(locale: CustomerLocale): boolean {
  return locale === "en" || locale === "zh" || locale === "ko";
}
