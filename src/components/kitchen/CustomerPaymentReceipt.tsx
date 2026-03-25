/**
 * Customer-facing payment receipt (領収・お会計済み控え) — print after 会計済み.
 * Tone: polite, clean, suitable to hand to the guest.
 */
import type { OrderRecord, LineItemCustomization, OrderItemPayload } from "@/lib/types";
import { displayMenuItemNameJa } from "@/lib/menu-display";
import { formatNoodlePortionLineJa } from "@/lib/tsukemen-portion-pricing";

const STORE_NAME = "自家製麺 多聞";
const RECEIPT_TITLE = "お会計のご案内（お客様控え）";

const toYen = (vnd: number) => Math.round(vnd / 200);

function formatTimeLong(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SPICE_LABEL_JA: Record<string, string> = {
  mild: "マイルド",
  medium: "ミディアム",
  hot: "辛口",
  extra_hot: "特辛",
};

const NOODLE_FIRM_LABEL_JA: Record<string, string> = {
  soft: "やわらかめ",
  medium: "普通",
  firm: "硬め",
};

function formatCustomization(c: LineItemCustomization | undefined): string | null {
  if (!c) return null;
  const parts: string[] = [];
  if (c.seatLabel?.trim()) parts.push(`お席: ${c.seatLabel.trim()}`);
  const noodleLine = formatNoodlePortionLineJa(c);
  if (noodleLine) parts.push(noodleLine);
  if (c.beerVariant) {
    parts.push(c.beerVariant === "lager" ? "ビール: ラガー" : "ビール: スーパードライ");
  }
  if (c.highballVariant) {
    parts.push(c.highballVariant === "plain" ? "ハイボール: プレーン" : "ハイボール: レモン");
  }
  if (c.beerBallVariant) {
    const ja =
      c.beerBallVariant === "lemon" ? "レモン" : c.beerBallVariant === "plum" ? "うめ" : "メロン";
    parts.push(`ビアボール: ${ja}`);
  }
  if (c.serviceMode) {
    parts.push(c.serviceMode === "takeaway" ? "お持ち帰り" : "店内");
  }
  if (c.note?.trim()) parts.push(c.note.trim());
  if (c.spiceLevel && c.spiceLevel !== "none") {
    const sj = SPICE_LABEL_JA[c.spiceLevel];
    parts.push(sj ? `辛さ: ${sj}` : `辛さ: ${c.spiceLevel}`);
  }
  if (c.noodleFirmness) {
    const fj = NOODLE_FIRM_LABEL_JA[c.noodleFirmness];
    parts.push(fj ? `麺の硬さ: ${fj}` : `麺の硬さ: ${c.noodleFirmness}`);
  }
  if (c.extraToppings?.length) parts.push(c.extraToppings.map((t) => t.name).join("、"));
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function CustomerPaymentReceipt({ order }: { order: OrderRecord }) {
  const shortId = String(order.id).slice(0, 8).toUpperCase();
  const table = order.table_label?.trim() || "—";
  const items = order.items as OrderItemPayload[];
  const paidAt = order.updated_at || order.created_at;
  const isPaid =
    order.status === "paid" || order.payment_status === "paid";

  return (
    <div
      className="customer-print-receipt bg-white text-gray-900"
      style={{
        fontFamily:
          'system-ui, -apple-system, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <div className="border-b border-emerald-700/30 pb-4 text-center">
        <p className="text-xl font-bold tracking-tight text-emerald-900">{STORE_NAME}</p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-600">
          {RECEIPT_TITLE}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-gray-600">
          本日はご来店ありがとうございました。
          <br />
          以下の内容にてお会計を承りました。
        </p>
      </div>

      <div className="mt-4 space-y-2 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-3 text-[11px]">
        <div className="flex justify-between gap-2 border-b border-gray-200/80 pb-2">
          <span className="text-gray-500">伝票番号</span>
          <span className="font-mono font-bold text-gray-900">#{shortId}</span>
        </div>
        <div className="flex justify-between gap-2 border-b border-gray-200/80 pb-2">
          <span className="text-gray-500">お席</span>
          <span className="font-semibold text-gray-900">{table}</span>
        </div>
        <div className="flex justify-between gap-2 border-b border-gray-200/80 pb-2">
          <span className="text-gray-500">ご注文日時</span>
          <span className="text-right font-medium text-gray-800">
            {formatTimeLong(order.created_at)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-gray-500">お会計日時</span>
          <span className="text-right font-medium text-gray-800">{formatTimeLong(paidAt)}</span>
        </div>
        <div className="flex justify-between gap-2 pt-1">
          <span className="text-gray-500">お支払い</span>
          <span
            className={`font-bold ${isPaid ? "text-emerald-700" : "text-amber-600"}`}
          >
            {isPaid ? "お支払い済" : "未会計（参考）"}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 border-b border-gray-200 pb-1 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
          明細
        </p>
        <ul className="space-y-2.5">
          {items.map((item, idx) => {
            const custom = formatCustomization(item.customization);
            const lineTotal = item.unit_price * item.quantity;
            return (
              <li
                key={`${order.id}-cust-${idx}`}
                className="border-b border-dashed border-gray-100 pb-2.5 last:border-0 last:pb-0"
              >
                <div className="flex justify-between gap-2 text-[12px]">
                  <span className="min-w-0 flex-1 font-medium text-gray-900">
                    {displayMenuItemNameJa(item.menu_item_id, item.menu_item_name)}
                    <span className="ml-1 text-gray-500">×{item.quantity}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[12px] font-semibold text-gray-900">
                    ¥{toYen(lineTotal)}
                  </span>
                </div>
                {custom && (
                  <p className="mt-0.5 pl-1 text-[10px] text-gray-500">{custom}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 rounded-xl border-2 border-emerald-600/40 bg-emerald-50/50 px-3 py-3">
        <div className="flex items-end justify-between gap-2">
          <span className="text-sm font-bold text-emerald-900">お支払い合計</span>
          <span className="font-mono text-2xl font-black text-emerald-800">
            ¥{toYen(order.total_amount)}
          </span>
        </div>
        <p className="mt-2 text-center text-[9px] leading-snug text-gray-500">
          ※価格はシステム表示（税込参考）です。領収書の要望があればスタッフまでお声がけください。
        </p>
      </div>

      <div className="mt-5 border-t border-gray-200 pt-3 text-center text-[11px] text-gray-600">
        またのご来店をお待ちしております
      </div>
      <div className="mt-2 text-center text-[9px] text-gray-400">
        Printed {formatTimeLong(new Date().toISOString())}
      </div>
    </div>
  );
}
