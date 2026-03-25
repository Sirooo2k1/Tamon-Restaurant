/**
 * 顧客向けヒーローカード（ご来店ありがとうございました / ご注文の準備状況）と同じグラデーション。
 * 厨房モーダルなどで見た目を揃えるときに使う。
 */
export const CUSTOMER_HERO_GRADIENT =
  "linear-gradient(152deg, #ecfdf5 0%, #f7fee7 32%, #ffffff 62%, #f8fafc 100%)";

/**
 * 大枠の枠線は内側のステータス枠（checkout success / checkoutLikeShell）と揃える。
 * border: emerald-100 @ 90% — 薄いティールがはっきり見える
 */
export const customerHeroShellClassName =
  "rounded-[1.75rem] border border-emerald-100/90 bg-white/92 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_22px_50px_-20px_rgba(6,95,70,0.10),0_20px_50px_-12px_rgba(6,95,70,0.12),0_8px_24px_-8px_rgba(15,23,42,0.06)] ring-1 ring-emerald-900/[0.04] backdrop-blur-md";
