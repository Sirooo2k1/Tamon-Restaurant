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

/**
 * `?table=` の値 → 卓QRカードに印刷している `labelJa` と同じ文言（客向け・注文の table_label）。
 * 未定義コードはそのまま返す（カスタム卓用）。
 */
export function displayLabelFromTableCode(code: string): string {
  const c = code.trim();
  if (!c) return "";
  const preset = RESTAURANT_QR_TABLES.find(
    (p) => p.code.trim().toUpperCase() === c.toUpperCase()
  );
  if (preset) return preset.labelJa;
  return c;
}

/**
 * 卓が同一か（マージ可否）— 現在の labelJa・旧い自動ラベル（テーブル1 等）・QRコード値を同一卓に解決する。
 */
export function canonicalTableCodeFromLabel(label: string | null | undefined): string | null {
  if (!label?.trim()) return null;
  const t = label.trim();
  const byJa = RESTAURANT_QR_TABLES.find((p) => p.labelJa === t);
  if (byJa) return byJa.code.toUpperCase();
  const byCode = RESTAURANT_QR_TABLES.find(
    (p) => p.code.trim().toUpperCase() === t.toUpperCase()
  );
  if (byCode) return byCode.code.toUpperCase();
  /** 旧 `table-display-label`: Tn → 「テーブル{n}」 */
  const legacyNum = /^テーブル(\d+)$/.exec(t);
  if (legacyNum) return `T${legacyNum[1]}`.toUpperCase();
  const legacyAb = /^テーブル\s*([AB])$/i.exec(t);
  if (legacyAb) return legacyAb[1].toUpperCase();
  if (t === "テイクアウト") return "MV";
  return null;
}
