import {
  RESTAURANT_QR_TABLES,
  canonicalTableCodeFromLabel,
} from "@/lib/restaurant-qr-tables";

const SESSION_KEY = "remenshop_menu_table_qr";

/** QR の `?table=` を同一タブ内で覚え、メニューに戻ったとき卓表示が消えないようにする */
export function rememberMenuTableCodeFromQrParam(code: string): void {
  const c = code.trim();
  if (!c) return;
  try {
    sessionStorage.setItem(SESSION_KEY, c);
  } catch {
    /* private mode */
  }
}

export function loadRememberedMenuTableCode(): string | null {
  try {
    const v = sessionStorage.getItem(SESSION_KEY)?.trim();
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function syncRememberedMenuTableFromDisplayLabel(displayLabel: string): void {
  const canon = canonicalTableCodeFromLabel(displayLabel);
  if (!canon) return;
  const preset = RESTAURANT_QR_TABLES.find((p) => p.code.toUpperCase() === canon);
  const toStore = preset?.code ?? canon;
  try {
    sessionStorage.setItem(SESSION_KEY, toStore);
  } catch {
    /* noop */
  }
}

export function clearRememberedMenuTableCode(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

/** 卓表示名・旧ラベルから `?table=` 付きパス（リンク用） */
export function menuHrefPreservingTable(tableLabel: string | null | undefined): string {
  const canon = canonicalTableCodeFromLabel(tableLabel);
  if (!canon) return "/menu";
  const preset = RESTAURANT_QR_TABLES.find((p) => p.code.toUpperCase() === canon);
  const code = preset?.code ?? canon;
  return `/menu?table=${encodeURIComponent(code)}`;
}

/** メニューへ戻る: 表示中の卓 → なければ同タブで記憶した QR の `?table=` */
export function menuHrefForCustomerNavigation(
  tableLabel: string | null | undefined
): string {
  const href = menuHrefPreservingTable(tableLabel);
  if (href !== "/menu") return href;
  const code = loadRememberedMenuTableCode();
  if (code) return `/menu?table=${encodeURIComponent(code)}`;
  return "/menu";
}
