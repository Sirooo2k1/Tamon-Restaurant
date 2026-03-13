# 🍜 Ramen Menu — Hệ thống menu điện tử

Hệ thống menu điện tử cho nhà hàng ramen: khách quét QR → mở menu → chọn món, tùy chỉnh → thanh toán. Đơn gửi theo thời gian thực, bếp xem và cập nhật trạng thái ngay.

## Tính năng

- **Menu điện tử**: Mở bằng link (hoặc QR trỏ tới `/menu`), xem theo danh mục (Ramen, Món phụ, Đồ uống, Combo).
- **Tùy chỉnh món**: Độ cay, độ dai mì, món thêm (trứng, chashu, rong biển...), ghi chú.
- **Giỏ hàng & Thanh toán**: Thêm vào giỏ, nhập số bàn (tùy chọn), gửi đơn. Thanh toán khi nhận món.
- **Realtime cho bếp**: Dashboard bếp nhận đơn mới (polling 3s; khi dùng Supabase có thể bật Realtime). Cập nhật trạng thái: Chờ → Đã xác nhận → Đang chế biến → Sẵn sàng → Đã phục vụ → Đã thanh toán.

## Công nghệ

- **Next.js 14** (App Router), TypeScript, Tailwind CSS
- **Zustand** cho giỏ hàng
- **Supabase** (tùy chọn): database + Realtime cho đơn hàng

## Chạy dự án

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

- **Khách**: [http://localhost:3000/menu](http://localhost:3000/menu) — dùng link này in QR hoặc dán lên bàn.
- **Bếp**: [http://localhost:3000/kitchen](http://localhost:3000/kitchen).

## Cấu hình Supabase (tùy chọn)

1. Tạo project tại [supabase.com](https://supabase.com).
2. Copy `.env.example` thành `.env.local`, điền:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Chạy migration trong Supabase SQL Editor (nội dung file `supabase/migrations/001_orders.sql`).

Nếu không cấu hình Supabase, đơn hàng lưu trong bộ nhớ (phù hợp chạy thử).

## QR Code

In mã QR trỏ tới URL menu của bạn, ví dụ:

- Production: `https://your-domain.com/menu`
- Theo bàn: `https://your-domain.com/menu?table=5` (có thể dùng query để tự điền số bàn sau).

## Cấu trúc thư mục

- `src/app/` — Trang: `/`, `/menu`, `/checkout`, `/kitchen`
- `src/components/` — `AddToCartModal`, `CartDrawer`
- `src/lib/` — types, menu data, Supabase client
- `src/store/` — Zustand cart
- `src/hooks/` — useOrders cho bếp
- `supabase/migrations/` — SQL tạo bảng `orders`
