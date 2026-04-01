-- Trạng thái ngay trước khi chuyển sang cancelled — dùng để hoàn tác nhầm (kitchen).
alter table public.orders
  add column if not exists pre_cancel_status text;

alter table public.orders
  drop constraint if exists orders_pre_cancel_status_check;

alter table public.orders
  add constraint orders_pre_cancel_status_check
  check (
    pre_cancel_status is null
    or pre_cancel_status in ('pending', 'confirmed', 'preparing', 'ready', 'served')
  );

comment on column public.orders.pre_cancel_status is
  'Status before kitchen cancelled the order; used to restore via undo_cancel PATCH.';
