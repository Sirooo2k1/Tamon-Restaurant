-- 売り切れは menu_availability（menu_item_id 単位）を使用。次の migration で本テーブルを削除。
comment on table public.menu_group_sold_out is
  'Deprecated: use public.menu_availability for per-item sold-out (migration 003). Removed in 006_drop_menu_group_sold_out.sql.';
