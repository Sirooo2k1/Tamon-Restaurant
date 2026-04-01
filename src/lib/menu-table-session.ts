import {
  RESTAURANT_QR_TABLES,
  canonicalTableCodeFromLabel,
} from "@/lib/restaurant-qr-tables";

const SESSION_KEY = "remenshop_menu_table_qr";

/** 会計後、履歴の「戻る」で `?table=` 付きメニューに戻ったとき卓を復活させない */
const SESSION_POST_PAID_BLOCK_TABLE = "remenshop_post_paid_block_table";

/**
 * popstate のタイムスタンプ（ms）。二値フラグだと「戻った直後に別ページへ push した」とき誤検知するため TTL で失効させる。
 */
const SESSION_NAV_FROM_POP = "remenshop_nav_from_popstate_ts";

const DEFAULT_NAV_FROM_POP_MAX_AGE_MS = 1400;

export function markPostPaidBlockTableFromHistory(): void {
  try {
    sessionStorage.setItem(SESSION_POST_PAID_BLOCK_TABLE, "1");
  } catch {
    /* noop */
  }
}

export function isPostPaidBlockTableFromHistory(): boolean {
  try {
    return sessionStorage.getItem(SESSION_POST_PAID_BLOCK_TABLE) === "1";
  } catch {
    return false;
  }
}

export function clearPostPaidBlockTableFromHistory(): void {
  try {
    sessionStorage.removeItem(SESSION_POST_PAID_BLOCK_TABLE);
  } catch {
    /* noop */
  }
}

export function markNavFromPopState(): void {
  try {
    sessionStorage.setItem(SESSION_NAV_FROM_POP, String(Date.now()));
  } catch {
    /* noop */
  }
}

/**
 * 直近の popstate が TTL 内なら履歴由来の遷移とみなす。期限切れならキーを消して false。
 */
export function peekNavFromPopState(
  maxAgeMs: number = DEFAULT_NAV_FROM_POP_MAX_AGE_MS
): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_NAV_FROM_POP);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) {
      sessionStorage.removeItem(SESSION_NAV_FROM_POP);
      return false;
    }
    if (Date.now() - ts > maxAgeMs) {
      sessionStorage.removeItem(SESSION_NAV_FROM_POP);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function clearNavFromPopState(): void {
  try {
    sessionStorage.removeItem(SESSION_NAV_FROM_POP);
  } catch {
    /* noop */
  }
}

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
