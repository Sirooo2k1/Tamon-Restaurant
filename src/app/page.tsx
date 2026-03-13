import Link from "next/link";

export default function HomePage() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-[#f1e4d6] bg-[var(--ramen-surface)] shadow-[0_28px_80px_rgba(15,23,42,0.55)]">
        {/* top bar */}
        <div className="flex items-center justify-between border-b border-[#f1e4d6] px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--ramen-primary)] text-lg font-semibold text-white">
              🍜
            </div>
            <div className="text-xs">
              <p className="font-semibold text-[var(--ramen-brown)]">QRMenu Ramen</p>
              <p className="text-[11px] text-[var(--ramen-muted)]">
                Digital menu for modern restaurants
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-4 text-xs text-[var(--ramen-muted)] sm:flex">
            <button className="text-[11px] font-medium hover:text-[var(--ramen-primary-strong)]">
              Đăng nhập
            </button>
            <Link href="/menu" className="primary-btn h-8 px-4 text-xs">
              Bắt đầu ngay
            </Link>
          </div>
        </div>

        {/* hero */}
        <div className="flex flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:gap-10 sm:px-8 sm:py-10">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f1e4d6] bg-[var(--ramen-surface-strong)] px-3 py-1 text-[10px] font-medium text-[var(--ramen-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ramen-primary)]" />
              <span>The Future of Dining</span>
            </div>
            <h1 className="text-balance text-3xl font-semibold leading-tight text-[var(--ramen-brown)] sm:text-4xl md:text-5xl">
              <span className="block">Digitize Your Menu.</span>
              <span className="block text-[var(--ramen-primary-strong)]">
                Boost Sales.
              </span>
            </h1>
            <p className="max-w-md text-sm text-[var(--ramen-muted)] sm:text-[15px]">
              Hệ thống đặt món qua QR hiện đại: tăng vòng quay bàn, giảm tải cho nhân
              viên, trải nghiệm gọi món mượt trên mọi thiết bị.
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
            <div className="flex gap-4 text-[10px] text-[var(--ramen-muted)]">
              <span>✓ Bếp nhận đơn realtime</span>
              <span>✓ Thiết kế tối ưu mobile</span>
            </div>
          </div>

          {/* hero preview card */}
          <div className="mt-4 flex flex-1 items-center justify-center sm:mt-0">
            <div className="relative w-full max-w-md rounded-3xl bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.55)]">
              <div className="h-40 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-600 sm:h-48" />
              <div className="absolute -bottom-4 right-6 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-[10px] shadow-[0_10px_30px_rgba(15,23,42,0.4)]">
                <div className="h-6 w-6 rounded-full bg-emerald-100" />
                <div>
                  <p className="font-semibold text-[var(--ramen-brown)]">
                    +24% Orders
                  </p>
                  <p className="text-[9px] text-[var(--ramen-muted)]">
                    so với tuần trước
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* features row */}
        <div className="grid gap-4 border-t border-[#f1e4d6] bg-white px-5 py-5 text-xs text-[var(--ramen-brown)] sm:grid-cols-3 sm:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ramen-muted)]">
              Instant Mobile Menu
            </p>
            <p className="mt-1 text-[11px] text-[var(--ramen-muted)]">
              Khách chỉ cần quét QR — không cần cài app, không cần tài khoản.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ramen-muted)]">
              Real-time Orders
            </p>
            <p className="mt-1 text-[11px] text-[var(--ramen-muted)]">
              Đơn mới hiện ngay trên màn hình bếp, chuyển trạng thái theo quy trình.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ramen-muted)]">
              Secure Payments
            </p>
            <p className="mt-1 text-[11px] text-[var(--ramen-muted)]">
              Dễ dàng tích hợp thanh toán online khi bạn sẵn sàng.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

