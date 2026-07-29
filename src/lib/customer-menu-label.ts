import type { CustomerLocale } from "@/store/customer-locale-store";
import { usesTranslatedMenuNames } from "@/store/customer-locale-store";
import type { MenuItem } from "@/lib/types";

const CATEGORY_ZH: Record<string, string> = {
  tsukemen: "沾面",
  tamon_tsukemen: "多闻沾面",
  extra: "追加汤底",
  ramen: "拉面",
  kaedama: "替玉（加面）",
  topping: "配料",
  rice: "米饭",
  gyoza: "饺子",
  drink: "饮品",
};

const CATEGORY_KO: Record<string, string> = {
  tsukemen: "쓰케멘",
  tamon_tsukemen: "다몬 쓰케멘",
  extra: "추가 수프",
  ramen: "라멘",
  kaedama: "가에다마(면 추가)",
  topping: "토핑",
  rice: "밥",
  gyoza: "교자",
  drink: "음료",
};

/** Tên món: JA = name; EN/ZH/KO = nameVi (Anh) nếu có, không thì tiếng Nhật */
export function menuItemDisplayName(
  item: Pick<MenuItem, "name" | "nameVi">,
  locale: CustomerLocale
): string {
  if (usesTranslatedMenuNames(locale) && item.nameVi?.trim()) return item.nameVi.trim();
  return item.name;
}

export function menuOptionDisplayName(
  opt: { name: string; nameVi?: string },
  locale: CustomerLocale
): string {
  if (usesTranslatedMenuNames(locale) && opt.nameVi?.trim()) return opt.nameVi.trim();
  return opt.name;
}

export function categoryDisplayLabel(
  cat: { id?: string; label: string; labelEn?: string },
  locale: CustomerLocale
): string {
  const id = cat.id ?? "";
  if (locale === "zh" && CATEGORY_ZH[id]) return CATEGORY_ZH[id];
  if (locale === "ko" && CATEGORY_KO[id]) return CATEGORY_KO[id];
  if (locale === "en" && cat.labelEn?.trim()) return cat.labelEn.trim();
  return cat.label;
}
