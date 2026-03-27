/**
 * キッチンダッシュ「未会計の注文」リスト用 — カウンター卓だけバッジ向けに短くする。
 * それ以外（テーブル A・B・テイクアウト等）はそのまま。
 */
export function tableLabelKitchenUnpaidBadge(
  tableLabel: string | null | undefined
): string {
  const t = (tableLabel ?? "").trim();
  if (!t) return "—";
  const counter = /^カウンター(\d+)番$/.exec(t);
  if (counter) return `C${counter[1]}`;
  /** 旧 guest 表示「テーブル{n}」＝カウンター T{n} と同じ卓のことが多い */
  const legacyNum = /^テーブル(\d+)$/.exec(t);
  if (legacyNum) return `C${legacyNum[1]}`;
  return t;
}
