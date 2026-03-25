import type { LineItemCustomization, MenuItem } from "@/lib/types";

/** 「500g以上」メニューで選べる麺量（100g刻み、500g基準で +¥100/100g） */
export const TSUKEMEN_500OVER_GRAM_CHOICES = ["600", "700", "800", "900", "1000"] as const;
export type Tsukemen500overGram = (typeof TSUKEMEN_500OVER_GRAM_CHOICES)[number];

function is500overPortionChoice(menuItem: MenuItem): boolean {
  return menuItem.portionChoice === "500over-grams" || menuItem.portionChoice === "600-700-only";
}

/** 600g +100円 … 1000g +500円（500gを基準に100gごと +100円） */
export function surchargeVndFor500overGram(grams: string): number {
  const n = parseInt(grams, 10);
  if (n < 600 || n > 1000 || n % 100 !== 0) return 0;
  return (n - 500) * 200;
}

/** 「つけ麺 500g以上」「多聞つけ麺 500g以上」— 600〜1000g の追加分 */
export function tsukemen500overGramSurcharge(menuItem: MenuItem, c: LineItemCustomization): number {
  if (!is500overPortionChoice(menuItem)) return 0;
  const g = c.noodlePortionGrams;
  if (!g) return 0;
  return surchargeVndFor500overGram(g);
}

/** @deprecated 互換名 */
export const tsukemen600700OverSurcharge = tsukemen500overGramSurcharge;

export function tsukemenPortionSurchargeTotal(menuItem: MenuItem, c: LineItemCustomization): number {
  return tsukemen500overGramSurcharge(menuItem, c);
}

export function formatNoodlePortionGramsJa(
  g: "150" | "200" | "500+" | "600" | "700" | "800" | "900" | "1000"
): string {
  if (g === "500+") return "500g以上";
  return `${g}g`;
}

/** キッチン・会計・レシート・追跡一覧用（旧データの 500+ は表示のみ） */
export function formatNoodlePortionLineJa(c: LineItemCustomization | undefined): string | null {
  const g = c?.noodlePortionGrams;
  if (!g) return null;
  if (g === "500+") return "麺量 500g以上（+¥100）";
  const extraYen = surchargeVndFor500overGram(g) / 200;
  if (extraYen > 0) return `麺量 ${g}g（+¥${extraYen}）`;
  return `麺量 ${g}g`;
}
