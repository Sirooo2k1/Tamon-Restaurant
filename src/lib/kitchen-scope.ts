/** 厨房ダッシュボード用: 日付・時間帯（東京）で注文を絞り込む */

/** 全日 + 昼シフト（10–14時）+ 夜シフト（18–22時）※東京時刻 */
export type KitchenShiftId = "all" | "day" | "evening";

export type KitchenShift = {
  id: KitchenShiftId;
  /** 表示名 */
  label: string;
  /** 説明（ツールチップ用） */
  hint: string;
  /** 開始: 午前0時からの分（含む） */
  startMins: number;
  /** 終了: 分（含まない）。1440 = 24:00 */
  endMins: number;
};

/** 東京の「その日」の YYYY-MM-DD */
export function tokyoDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export const KITCHEN_SHIFTS: readonly KitchenShift[] = [
  {
    id: "all",
    label: "全日",
    hint: "0:00–24:00（当日）",
    startMins: 0,
    endMins: 1440,
  },
  {
    id: "day",
    label: "昼勤",
    hint: "早番 · 10:00–14:00",
    startMins: 10 * 60,
    /** 14:00台の00分まで含める（分単位判定のため +1） */
    endMins: 14 * 60 + 1,
  },
  {
    id: "evening",
    label: "夜勤",
    hint: "遅番 · 18:00–22:00",
    startMins: 18 * 60,
    endMins: 22 * 60 + 1,
  },
] as const;

export function getKitchenShift(id: KitchenShiftId): KitchenShift {
  return KITCHEN_SHIFTS.find((s) => s.id === id) ?? KITCHEN_SHIFTS[0];
}

/** ISO日時を東京の日付・分に直す */
function tokyoDateAndMinuteOfDay(iso: string): { date: string; minuteOfDay: number } | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const y = pick("year");
  const m = pick("month");
  const day = pick("day");
  const hour = parseInt(pick("hour"), 10);
  const minute = parseInt(pick("minute"), 10);
  return {
    date: `${y}-${m}-${day}`,
    minuteOfDay: hour * 60 + minute,
  };
}

/** 注文の created_at が「指定日 + シフト時間」に入るか */
export function orderInKitchenScope(
  createdAtIso: string,
  selectedDate: string,
  shiftId: KitchenShiftId
): boolean {
  const parsed = tokyoDateAndMinuteOfDay(createdAtIso);
  if (!parsed) return false;
  if (parsed.date !== selectedDate) return false;
  const shift = getKitchenShift(shiftId);
  return parsed.minuteOfDay >= shift.startMins && parsed.minuteOfDay < shift.endMins;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** YYYY-MM-DD を暦日単位で加算（前日比・URL日付用） */
export function rollTokyoYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

/** クエリの日付文字列を検証（不正なら fallback） */
export function parseKitchenDateParam(
  raw: string | null | undefined,
  fallback: string
): string {
  if (!raw || !ISO_DATE_RE.test(raw)) return fallback;
  return raw;
}

/** ISO日付を max（含む）で上限 — 未来日を選べないようにする */
export function clampKitchenDate(ymd: string, maxYmd: string): string {
  return ymd > maxYmd ? maxYmd : ymd;
}

export const ORDERS_PAGE_SIZES = [10, 25, 50, 100] as const;
export type OrdersPageSize = (typeof ORDERS_PAGE_SIZES)[number];

export function parseOrdersPageSize(raw: string | null | undefined, fallback: OrdersPageSize = 25): OrdersPageSize {
  const n = Number(raw);
  if (n === 10 || n === 25 || n === 50 || n === 100) return n;
  return fallback;
}

export function parsePositivePage(raw: string | null | undefined): number {
  const n = parseInt(raw || "1", 10);
  if (Number.isNaN(n) || n < 1) return 1;
  return n;
}
