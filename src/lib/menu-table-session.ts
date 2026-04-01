import {
  RESTAURANT_QR_TABLES,
  canonicalTableCodeFromLabel,
} from "@/lib/restaurant-qr-tables";

const SESSION_KEY = "remenshop_menu_table_qr";

/**
 * 会計後セッション — 履歴の戻るで checkout/order/?table= に戻さない。
 * タイムスタンプを保持し、strip では消さない（一定時間で自然失効）。
 */
const SESSION_POST_PAID_BLOCK_TABLE = "remenshop_post_paid_block_table";
const POST_PAY_BLOCK_MAX_MS = 24 * 60 * 60 * 1000;

/**
 * popstate のタイムスタンプ（ms）。二値フラグだと「戻った直後に別ページへ push した」とき誤検知するため TTL で失効させる。
 */
const SESSION_NAV_FROM_POP = "remenshop_nav_from_popstate_ts";

const DEFAULT_NAV_FROM_POP_MAX_AGE_MS = 1400;

/** 会計後は「戻る」が遅くても卓を復活させないよう、ブロック中だけ popstate の有効時間を延長する */
const NAV_FROM_POP_MAX_AGE_WHEN_POST_PAID_MS = 10 * 60 * 1000;

const ORDERS_CLOSED_AFTER_CHECKOUT_KEY = "remenshop_orders_closed_after_payment";

export function rememberOrderClosedAfterPayment(orderId: string): void {
  const id = orderId.trim();
  if (!id) return;
  try {
    const raw = sessionStorage.getItem(ORDERS_CLOSED_AFTER_CHECKOUT_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(ids) ? (ids as string[]) : [];
    if (list.includes(id)) return;
    list.push(id);
    while (list.length > 32) list.shift();
    sessionStorage.setItem(ORDERS_CLOSED_AFTER_CHECKOUT_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

/** 会計済みセッションを終えた注文 ID — 履歴の「戻る」で 403 領収イメージを出さずホームへ */
export function shouldTreatOrderPageAsStaleAfterCheckout(orderId: string): boolean {
  const id = orderId.trim();
  if (!id) return false;
  try {
    const raw = sessionStorage.getItem(ORDERS_CLOSED_AFTER_CHECKOUT_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) && (ids as string[]).includes(id);
  } catch {
    return false;
  }
}

export function markPostPaidBlockTableFromHistory(): void {
  try {
    sessionStorage.setItem(SESSION_POST_PAID_BLOCK_TABLE, String(Date.now()));
  } catch {
    /* noop */
  }
}

export function isPostPaidBlockTableFromHistory(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_POST_PAID_BLOCK_TABLE);
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isFinite(ts)) {
      if (Date.now() - ts > POST_PAY_BLOCK_MAX_MS) {
        sessionStorage.removeItem(SESSION_POST_PAID_BLOCK_TABLE);
        return false;
      }
      return true;
    }
    return raw === "1";
  } catch {
    return false;
  }
}

/** 通常は呼ばない（会計後ブロックは時間で失効）。デバッグや明示リセット用 */
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
 * `maxAgeMs` 省略時: 会計直後ブロック中はウィンドウを長めに取る（遅い「戻る」でも卓を復活させない）。
 */
export function peekNavFromPopState(maxAgeMs?: number): boolean {
  const limit =
    maxAgeMs ??
    (isPostPaidBlockTableFromHistory()
      ? NAV_FROM_POP_MAX_AGE_WHEN_POST_PAID_MS
      : DEFAULT_NAV_FROM_POP_MAX_AGE_MS);
  try {
    const raw = sessionStorage.getItem(SESSION_NAV_FROM_POP);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) {
      sessionStorage.removeItem(SESSION_NAV_FROM_POP);
      return false;
    }
    if (Date.now() - ts > limit) {
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

/** メニューへ戻る: 表示中の卓 → なければ同タブで記憶した QR の `?table=`（会計直後ブロック中は常に `/menu`） */
export function menuHrefForCustomerNavigation(
  tableLabel: string | null | undefined
): string {
  if (typeof window !== "undefined" && isPostPaidBlockTableFromHistory()) {
    return "/menu";
  }
  const href = menuHrefPreservingTable(tableLabel);
  if (href !== "/menu") return href;
  const code = loadRememberedMenuTableCode();
  if (code) return `/menu?table=${encodeURIComponent(code)}`;
  return "/menu";
}
