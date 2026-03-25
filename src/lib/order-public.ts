/** Bỏ trường chỉ dùng server — không trả về cho client / kitchen JSON */
export function sanitizeOrderRow<T extends Record<string, unknown>>(row: T): Omit<T, "guest_view_token"> {
  const { guest_view_token: _g, ...rest } = row;
  return rest;
}
