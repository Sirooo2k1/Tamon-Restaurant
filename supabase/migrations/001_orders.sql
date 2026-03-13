-- Bảng đơn hàng cho menu điện tử ramen
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  table_id text,
  table_label text,
  items jsonb not null default '[]',
  total_amount numeric not null check (total_amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled')),
  customer_note text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Realtime: bật publication cho bảng orders để kitchen nhận đơn mới ngay lập tức
alter publication supabase_realtime add table public.orders;

-- RLS: cho phép đọc/ghi từ client (có thể thu hẹp sau bằng auth)
alter table public.orders enable row level security;

create policy "Allow all for orders" on public.orders
  for all
  using (true)
  with check (true);

-- Trigger cập nhật updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();
