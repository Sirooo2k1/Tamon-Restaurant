-- Trạng thái 売り切れ theo menu_item_id (khớp id trong menu-data / payload đặt hàng)
create table if not exists public.menu_availability (
  menu_item_id text primary key,
  sold_out boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists menu_availability_sold_out_true
  on public.menu_availability (sold_out)
  where sold_out = true;

alter table public.menu_availability enable row level security;

-- Khách / menu: chỉ cần đọc (ứng dụng cũng có thể dùng service role qua API)
create policy "Allow public read menu_availability"
  on public.menu_availability
  for select
  using (true);

-- Ghi qua Next.js + SUPABASE_SERVICE_ROLE_KEY (bypass RLS); không mở anon insert/update

create trigger menu_availability_updated_at
  before update on public.menu_availability
  for each row execute function public.set_updated_at();
