-- 売り切れは public.menu_availability（menu_item_id）のみ使用する。
-- 旧グループ単位テーブルを削除（RLS・トリガー・policy はテーブル削除で消える）。
drop table if exists public.menu_group_sold_out cascade;
