-- Đảm bảo API công khai / anon đọc được hàng sold_out (tránh RLS bật nhưng thiếu policy).
alter table public.menu_availability enable row level security;

drop policy if exists "Allow public read menu_availability" on public.menu_availability;

create policy "Allow public read menu_availability"
  on public.menu_availability
  for select
  using (true);
