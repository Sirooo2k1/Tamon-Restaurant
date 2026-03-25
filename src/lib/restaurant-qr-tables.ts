/**
 * 店舗レイアウトに合わせた卓・エリア定義（QR印刷用）
 *
 * `?table=` の値:
 * - T1…T8 — カウンター1番〜8番
 * - A, B — テーブルA（2名）/ B（4名）
 * - MV — テイクアウト（卓Aと区別）
 */
export type QrZone = "floor" | "counter" | "takeaway" | "other";

export type QrTablePreset = {
  id: string;
  /** カード見出し（日本語） */
  labelJa: string;
  /** 補足説明 */
  labelSub?: string;
  /** `?table=` — 注文と紐づくコード */
  code: string;
  zone: QrZone;
};

/** カウンター1番〜8番 */
const NEAR_COUNTER: QrTablePreset[] = Array.from({ length: 8 }, (_, i) => {
  const n = i + 1;
  return {
    id: `near-q-${n}`,
    labelJa: `カウンター${n}番`,
    labelSub: "店内オーダー・お会計はお席にて",
    code: `T${n}`,
    zone: "counter" as const,
  };
});

const TABLES_AB: QrTablePreset[] = [
  {
    id: "ban-a",
    labelJa: "テーブル A",
    labelSub: "お二人様まで · テーブル席",
    code: "A",
    zone: "floor",
  },
  {
    id: "ban-b",
    labelJa: "テーブル B",
    labelSub: "お四人様まで · テーブル席",
    code: "B",
    zone: "floor",
  },
];

const TAKEAWAY: QrTablePreset = {
  id: "mang-ve",
  labelJa: "テイクアウト",
  labelSub: "お持ち帰り専用 · 卓番は付きません",
  code: "MV",
  zone: "takeaway",
};

export const RESTAURANT_QR_TABLES: QrTablePreset[] = [
  ...NEAR_COUNTER,
  ...TABLES_AB,
  TAKEAWAY,
];

/** エリア絞り込みラベル */
export const QR_ZONE_LABELS: Record<QrZone, string> = {
  counter: "カウンター1〜8番",
  floor: "テーブル A・B",
  takeaway: "テイクアウト",
  other: "その他",
};
