/**
 * キッチンダッシュ「未会計の注文」「会計済みの注文」の卓バッジ用（短く表示）。
 * それ以外の画面は `table_label` 生のまま。
 */
export function tableLabelKitchenDashBadge(
  tableLabel: string | null | undefined
): string {
  const t = (tableLabel ?? "").trim();
  if (!t) return "—";

  const counter = /^カウンター(\d+)番$/.exec(t);
  if (counter) return `${counter[1]}番`;

  const tableAb = /^テーブル\s*([AB])$/i.exec(t);
  if (tableAb) return tableAb[1].toUpperCase();

  /** 旧表示「テーブル{n}」＝カウンター T{n} 寄り */
  const legacyNum = /^テーブル(\d+)$/.exec(t);
  if (legacyNum) return `${legacyNum[1]}番`;

  return t;
}
