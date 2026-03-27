"use client";

import { Printer } from "lucide-react";

const STORE_NAME = "自家製麺 多聞";
const RECEIPT_TITLE = "お会計のご案内（お客様控え）";

type Props = {
  orderId: string;
};

/**
 * 会計後・cookie 不一致で注文が読めないとき — 印刷レシートと同系の見た目で案内（データは確定できないため明細はQR案内）。
 */
export function GuestAccessReceiptPreview({ orderId }: Props) {
  const shortId = String(orderId).slice(0, 8).toUpperCase();

  return (
    <div className="mt-6 w-full text-left">
      <p className="mb-3 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800/90">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100/90 text-emerald-700 shadow-sm ring-1 ring-emerald-200/60">
          <Printer className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </span>
        お客様用レシート（イメージ）
      </p>

      <div
        className="mx-auto max-w-[22rem] overflow-hidden rounded-[1.35rem] border border-emerald-200/50 bg-white shadow-[0_24px_60px_-28px_rgba(6,95,70,0.28),0_0_0_1px_rgba(16,185,129,0.06)]"
        style={{
          fontFamily:
            'system-ui, -apple-system, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        }}
      >
        <div className="border-b border-emerald-800/15 bg-gradient-to-b from-white to-emerald-50/30 px-5 pb-5 pt-6 text-center">
          <p className="text-[1.35rem] font-bold leading-tight tracking-tight text-emerald-950">{STORE_NAME}</p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-600">
            {RECEIPT_TITLE}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-gray-600">
            本日はご来店ありがとうございました。
            <br />
            お会計済みの内容は、お席のQRから同じ端末でご確認いただけます。
          </p>
        </div>

        <div className="border-b border-gray-100/90 px-4 py-4">
          <div className="space-y-2.5 rounded-2xl border border-gray-100 bg-gray-50/90 px-3.5 py-3.5 text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
            <div className="flex justify-between gap-3 border-b border-gray-200/80 pb-2">
              <span className="text-gray-500">伝票番号</span>
              <span className="font-mono text-[12px] font-bold text-gray-900">#{shortId}</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-gray-200/80 pb-2">
              <span className="text-gray-500">お席</span>
              <span className="font-semibold text-gray-900">—</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-gray-200/80 pb-2">
              <span className="text-gray-500">ご注文日時</span>
              <span className="text-right font-medium text-gray-700">—</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-gray-200/80 pb-2">
              <span className="text-gray-500">お会計日時</span>
              <span className="text-right font-medium text-gray-700">—</span>
            </div>
            <div className="flex justify-between gap-3 pt-0.5">
              <span className="text-gray-500">お支払い</span>
              <span className="font-bold text-emerald-700">お支払い済</span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-2 pt-4">
          <p className="mb-2.5 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
            明細
          </p>
          <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white px-3 py-4 text-center">
            <p className="text-[12px] font-medium leading-relaxed text-gray-700">
              品目・金額の明細は、
              <span className="font-semibold text-emerald-900">お席のQRコード</span>
              を再度読み取り、
              <br className="hidden sm:block" />
              ご注文時と同じスマートフォンからご覧ください。
            </p>
            <p className="mt-3 text-[10px] leading-relaxed text-gray-500">
              （キッチンで印刷される「お客様用レシート」と同じ体裁です）
            </p>
          </div>
        </div>

        <div className="mx-4 mb-5 rounded-2xl border-2 border-emerald-600/35 bg-gradient-to-br from-emerald-50/80 to-white px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <div className="flex items-end justify-between gap-2">
            <span className="text-sm font-bold text-emerald-900">お支払い合計</span>
            <span className="font-mono text-xl font-black tabular-nums text-emerald-800">—</span>
          </div>
          <p className="mt-2.5 text-center text-[9px] leading-snug text-gray-500">
            ※価格・明細はQRから開いた画面でご確認ください。領収書の要望があればスタッフまでお声がけください。
          </p>
        </div>

        <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-4 text-center">
          <p className="text-[11px] text-gray-600">またのご来店をお待ちしております</p>
        </div>
      </div>
    </div>
  );
}
