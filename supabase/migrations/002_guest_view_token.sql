-- Theo dõi đơn an toàn: token bí mật / khách (không trả về JSON công khai)
-- Chạy sau 001_orders.sql nếu project đã tạo bảng trước khi có cột này.

alter table public.orders
  add column if not exists guest_view_token uuid;

update public.orders
set guest_view_token = gen_random_uuid()
where guest_view_token is null;

alter table public.orders
  alter column guest_view_token set not null;

create unique index if not exists orders_guest_view_token_key
  on public.orders (guest_view_token);
