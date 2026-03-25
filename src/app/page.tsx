 "use client";

import Link from "next/link";
import {
  Smartphone,
  Zap,
  ShieldCheck,
  Repeat,
  Boxes,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { CartDrawer } from "@/components/CartDrawer";

type Lang = "en" | "ja" | "zh" | "ko" | "vi";

const copyByLang: Record<
  Lang,
  {
    heroTag: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroSub: string;
    brandTagline: string;
    pillRealtime: string;
    pillMobile: string;
    statsTitle: string;
    statsCaption: string;
    featuresTitle: string;
    featuresSub: string;
    featureDescs: string[];
    ctaSub: string;
    ctaButton: string;
    topCta: string;
    ctaTitle: string;
  }
> = {
  en: {
    heroTag: "The Future of Dining",
    heroTitleLine1: "Digitize Your Menu.",
    heroTitleLine2: "Boost Sales.",
    heroSub:
      "A modern QR ordering system that turns tables faster, lightens staff workload, and delivers a smooth ordering experience on any device.",
    brandTagline: "Digital menu for modern restaurants",
    pillRealtime: "Kitchen receives orders in real time",
    pillMobile: "Mobile‑first experience",
    statsTitle: "+24% Orders",
    statsCaption: "vs last week",
    featuresTitle: "Everything You Need",
    featuresSub:
      "A complete toolkit for modern restaurants – from QR menus to kitchen screens and payments.",
    featureDescs: [
      "Blazing‑fast digital menus. Guests just scan a QR code – no app required.",
      "New orders stream to the kitchen screen in real time for each table.",
      "Ready to connect with Stripe, PayPay, Square and more for safe checkout.",
      "Track every order from pending to served on a single, clean dashboard.",
      "Mark items as sold out instantly so guests never order unavailable dishes.",
      "See your best‑sellers and peak hours to optimize operations.",
    ],
    ctaSub:
      "Launch a QR menu in minutes to streamline service and boost operational efficiency.",
    ctaButton: "Launch your QR menu",
    topCta: "Get started",
    ctaTitle: "Ready to transform your dining experience?",
  },
  ja: {
    heroTag: "新しい飲食体験へ",
    heroTitleLine1: "メニューをデジタル化。",
    heroTitleLine2: "売上アップへ。",
    heroSub:
      "QR オーダーで回転率を上げつつ、スタッフの負担を軽減し、どのデバイスからでも快適に注文できる体験を提供します。",
    brandTagline: "現代の飲食店のためのデジタルメニュー",
    pillRealtime: "キッチンにリアルタイムで注文が届く",
    pillMobile: "モバイルに最適化されたUI",
    statsTitle: "注文数 +24％",
    statsCaption: "先週比",
    featuresTitle: "必要な機能をこれひとつに",
    featuresSub:
      "QR メニューからキッチン画面、決済まで。現代の飲食店運営に必要なツールをワンパッケージで。",
    featureDescs: [
      "QR を読み取るだけで表示される高速デジタルメニュー。アプリのインストールは不要です。",
      "新しい注文がテーブルごとにリアルタイムでキッチン画面に表示されます。",
      "Stripe や PayPay、Square などと連携して、安全な決済フローを実現します。",
      "pending から served まで、すべての注文状況を1つのダッシュボードで管理できます。",
      "売り切れメニューをすぐに表示し、お客様の誤注文を防ぎます。",
      "人気メニューやピークタイムを可視化し、オペレーション最適化に役立てます。",
    ],
    ctaSub:
      "数分で QR メニューを立ち上げて、サービスフローをスムーズにし、店舗オペレーションを効率化しましょう。",
    ctaButton: "QR メニューをはじめる",
    topCta: "今すぐはじめる",
    ctaTitle: "ダイニング体験をアップデートしませんか？",
  },
  zh: {
    heroTag: "餐饮数字化新体验",
    heroTitleLine1: "让菜单全面数字化，",
    heroTitleLine2: "轻松提升营收。",
    heroSub:
      "现代化的 QR 点餐系统，加快翻台速度，减轻员工负担，并在任何设备上提供流畅的点餐体验。",
    brandTagline: "为现代餐厅打造的数字菜单",
    pillRealtime: "后厨实时接收新订单",
    pillMobile: "专为移动端优化的体验",
    statsTitle: "订单量 +24%",
    statsCaption: "相比上周",
    featuresTitle: "一站式餐厅工具箱",
    featuresSub:
      "从 QR 菜单到后厨看板与支付模块，现代餐厅运营所需的一切都在这里。",
    featureDescs: [
      "极速加载的电子菜单，客人只需扫码即可，无需下载应用。",
      "新订单按桌台实时推送到后厨屏幕，状态一目了然。",
      "可对接 Stripe、PayPay、Square 等支付方案，保障安全结账。",
      "在同一个仪表盘中管理订单从待处理到已上桌的全流程。",
      "菜品售罄时即时标记，避免客人点到已无库存的菜品。",
      "洞察畅销品与高峰时段，帮助你持续优化运营。",
    ],
    ctaSub: "几分钟内即可上线 QR 菜单，让服务流程更顺畅、运营效率更出色。",
    ctaButton: "立即启用 QR 菜单",
    topCta: "开始使用",
    ctaTitle: "准备好升级您的用餐体验了吗？",
  },
  ko: {
    heroTag: "새로운 다이닝 경험",
    heroTitleLine1: "메뉴를 디지털로 전환하고,",
    heroTitleLine2: "매출을 끌어올리세요.",
    heroSub:
      "현대적인 QR 주문 시스템으로 테이블 회전율을 높이고, 직원 부담을 줄이며, 어떤 기기에서도 매끄러운 주문 경험을 제공합니다.",
    brandTagline: "현대적인 레스토랑을 위한 디지털 메뉴",
    pillRealtime: "주방으로 실시간 주문 전달",
    pillMobile: "모바일에 최적화된 UX",
    statsTitle: "주문 수 +24%",
    statsCaption: "지난주 대비",
    featuresTitle: "레스토랑 운영에 필요한 모든 것",
    featuresSub:
      "QR 메뉴, 키친 스크린, 결제까지 – 현대 레스토랑을 위한 올인원 도구입니다.",
    featureDescs: [
      "QR 코드 한 번 스캔으로 바로 열리는 초고속 디지털 메뉴, 앱 설치는 필요 없습니다.",
      "테이블별 신규 주문이 실시간으로 주방 화면에 표시됩니다.",
      "Stripe, PayPay, Square 등과 연동하여 안전한 결제를 지원합니다.",
      "대기부터 서빙 완료까지 모든 주문 상태를 하나의 대시보드에서 관리합니다.",
      "품절 메뉴를 즉시 표시하여 손님이 품절 메뉴를 주문하는 일을 막습니다.",
      "잘 팔리는 메뉴와 피크 타임을 파악하여 운영을 최적화하세요.",
    ],
    ctaSub:
      "몇 분 만에 QR 메뉴를 오픈하고 서비스 동선을 정리해 운영 효율을 높이세요.",
    ctaButton: "QR 메뉴 시작하기",
    topCta: "지금 시작하기",
    ctaTitle: "다이닝 경험을 한 단계 업그레이드해 보세요.",
  },
  vi: {
    heroTag: "Trải nghiệm gọi món mới",
    heroTitleLine1: "Số hoá menu của bạn,",
    heroTitleLine2: "tăng trưởng doanh thu.",
    heroSub:
      "Hệ thống gọi món qua QR hiện đại: tăng vòng quay bàn, giảm tải cho nhân viên và mang lại trải nghiệm mượt mà trên mọi thiết bị.",
    brandTagline: "Menu điện tử cho nhà hàng hiện đại",
    pillRealtime: "Bếp nhận đơn realtime cho từng bàn",
    pillMobile: "Trải nghiệm được tối ưu cho mobile",
    statsTitle: "Đơn hàng +24%",
    statsCaption: "so với tuần trước",
    featuresTitle: "Tất cả những gì bạn cần",
    featuresSub:
      "Bộ công cụ hoàn chỉnh cho nhà hàng hiện đại – từ menu QR tới màn hình bếp và thanh toán.",
    featureDescs: [
      "Menu điện tử tải cực nhanh, khách chỉ cần quét QR, không cần cài app.",
      "Đơn mới được đẩy realtime tới màn hình bếp, dễ theo dõi theo từng bàn.",
      "Sẵn sàng kết nối Stripe / PayPay / Square để nhận thanh toán an toàn.",
      "Quản lý trạng thái đơn từ pending tới served trên một màn hình duy nhất.",
      "Đánh dấu món hết hàng ngay lập tức để tránh khách đặt nhầm.",
      "Nắm bắt món bán chạy và khung giờ cao điểm để tối ưu vận hành.",
    ],
    ctaSub:
      "Triển khai menu QR chỉ trong vài phút để tối ưu quy trình phục vụ và tăng hiệu quả vận hành.",
    ctaButton: "Bắt đầu với menu QR",
    topCta: "Bắt đầu ngay",
    ctaTitle: "Bạn đã sẵn sàng nâng tầm trải nghiệm gọi món?",
  },
};

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = copyByLang[lang];
  return (
    <main className="app-shell min-h-screen bg-[#FAF8F0] pb-32">
      <div className="min-h-screen w-full overflow-hidden">
        {/* top bar — mobile: brand | CTA then scrollable lang; sm+: brand | lang + CTA */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-[1600px] space-y-2.5 px-4 py-3 pr-[max(1rem,4.25rem)] sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0 sm:px-8 sm:py-3 sm:pr-[7rem]">
            <div className="flex items-center justify-between gap-2 sm:min-w-0 sm:flex-1 sm:justify-start sm:gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-lg font-semibold text-amber-800">
                  🍜
                </div>
                <div className="min-w-0 text-xs">
                  <p className="truncate font-semibold text-gray-800">QR Menu Ramen</p>
                  <p className="line-clamp-2 text-[11px] leading-snug text-gray-600 sm:line-clamp-1 sm:truncate">
                    {t.brandTagline}
                  </p>
                </div>
              </div>
              <Link
                href="/menu"
                className="primary-btn inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap px-3 text-[11px] font-semibold sm:hidden"
              >
                {t.topCta}
              </Link>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div
                className="-mx-1 overflow-x-auto overscroll-x-contain px-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
                role="navigation"
                aria-label="Language"
              >
                <div className="inline-flex min-h-11 w-max max-w-full items-stretch gap-0.5 rounded-full border border-emerald-100 bg-white/90 p-1 shadow-sm sm:min-h-0 sm:w-auto sm:max-w-none sm:items-center sm:gap-1 sm:px-2.5 sm:py-1">
                  {(["en", "ja", "zh", "ko", "vi"] as Lang[]).map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLang(code)}
                      className={`touch-manipulation rounded-full px-3 py-2 text-center text-[11px] font-medium transition sm:px-2 sm:py-0.5 sm:text-[10px] ${
                        lang === code
                          ? "bg-emerald-400 text-white shadow-sm"
                          : "text-gray-600 hover:bg-emerald-50/80 hover:text-emerald-800"
                      }`}
                    >
                      {code === "en" && "EN"}
                      {code === "ja" && "日本語"}
                      {code === "zh" && "中文"}
                      {code === "ko" && "한국어"}
                      {code === "vi" && "VI"}
                    </button>
                  ))}
                </div>
              </div>

              <Link
                href="/menu"
                className="primary-btn hidden h-8 shrink-0 items-center justify-center px-4 text-xs font-semibold sm:inline-flex"
              >
                {t.topCta}
              </Link>
            </div>
          </div>
        </div>

        {/* hero: gradient from-emerald-50 via-amber-50 to-ivory */}
        <div className="bg-gradient-to-br from-emerald-50 via-amber-50 to-amber-50/30 flex flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:gap-10 sm:px-16 sm:py-12 lg:px-24">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>{t.heroTag}</span>
            </div>
            <h1 className="text-balance text-3xl font-semibold leading-tight text-gray-800 sm:text-4xl md:text-5xl">
              <span className="block">{t.heroTitleLine1}</span>
              <span className="block bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent">
                {t.heroTitleLine2}
              </span>
            </h1>
            <p className="max-w-md text-sm text-gray-600 sm:text-[15px]">
              {t.heroSub}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/menu"
                className="primary-btn w-full justify-center sm:w-auto"
              >
                Launch Your Menu
              </Link>
              <Link
                href="/menu"
                className="secondary-btn w-full justify-center sm:w-auto"
              >
                View Live Demo
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 shadow-sm">
                <Zap className="h-3 w-3 text-emerald-500" />
                <span>{t.pillRealtime}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 shadow-sm">
                <Smartphone className="h-3 w-3 text-amber-600" />
                <span>{t.pillMobile}</span>
              </span>
            </div>
          </div>

          {/* hero preview card */}
          <div className="mt-4 flex flex-1 items-center justify-center sm:mt-0">
            <div className="relative w-full max-w-md rounded-3xl border border-gray-100 bg-white p-3 shadow-lg">
              <div className="h-40 rounded-2xl bg-gradient-to-br from-emerald-50 via-amber-50/90 to-emerald-50/80 sm:h-48" />
              <div className="absolute -bottom-4 right-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs shadow-md">
                <div className="h-6 w-6 rounded-full bg-emerald-100" />
                <div>
                  <p className="font-semibold text-gray-800">{t.statsTitle}</p>
                  <p className="text-[9px] text-gray-600">{t.statsCaption}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* features: section title với gạch dưới gradient */}
        <section className="border-t border-gray-200 bg-[#FAF8F0] px-5 py-10 sm:px-16 lg:px-24">
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-semibold text-gray-800 sm:text-3xl">
              {t.featuresTitle}
            </h2>
            <div
              className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-emerald-200 to-amber-200"
              aria-hidden
            />
            <p className="mt-3 text-xs text-gray-600 sm:text-[13px]">
              {t.featuresSub}
            </p>
          </div>

          <div className="grid gap-4 text-gray-800 sm:grid-cols-3">
            {[
              { icon: Smartphone, label: "Instant Mobile Menu", badge: "emerald" },
              { icon: Zap, label: "Real-time Orders", badge: "amber" },
              { icon: ShieldCheck, label: "Secure Payments", badge: "emerald" },
              { icon: Repeat, label: "Order Flow Control", badge: "amber" },
              { icon: Boxes, label: "Smart Inventory", badge: "emerald" },
              { icon: BarChart3, label: "Sales Analytics", badge: "amber" },
            ].map(({ icon: Icon, label, badge }, idx) => (
              <div
                key={label}
                className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      badge === "emerald" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                    {label}
                  </p>
                </div>
                <p className="text-[11px] text-gray-600">
                  {t.featureDescs[idx]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA band: nhẹ, giống khung preview */}
        <section className="bg-[#FAF8F0] px-5 py-10 text-center sm:px-16 lg:px-24">
          <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/70 px-6 py-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:px-10 sm:py-10">
            <h3 className="font-display text-xl font-semibold text-gray-800 sm:text-2xl">
              {t.ctaTitle}
            </h3>
            <p className="mt-2 text-xs text-gray-600 sm:text-[13px]">
              {t.ctaSub}
            </p>
            <div className="mt-5 flex justify-center">
              <Link
                href="/menu"
                className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-7 py-2.5 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
              >
                {t.ctaButton}
              </Link>
            </div>
          </div>
        </section>
      </div>
      <CartDrawer />
    </main>
  );
}
