export type SpiceLevel = "none" | "mild" | "medium" | "hot" | "extra_hot";
export type NoodleFirmness = "soft" | "medium" | "firm";

export interface MenuOption {
  id: string;
  name: string;
  nameVi?: string;
  price: number;
  type: "topping" | "extra" | "size";
}

export type MenuItemHighlight = "popular" | "recommended"; // 人気No.1 | 店長おすすめ

export interface MenuItem {
  id: string;
  name: string;
  nameVi?: string;
  description?: string;
  category: "ramen" | "side" | "drink" | "combo" | "tsukemen" | "tamon_tsukemen" | "topping" | "rice" | "extra" | "kaedama" | "gyoza";
  price: number;
  imageUrl?: string;
  highlight?: MenuItemHighlight;
  options?: MenuOption[];
  defaultSpice?: boolean;
  defaultNoodleFirmness?: NoodleFirmness;
  /** 同一価格で 150g / 200g を必須選択（つけ麺・多聞の同価帯用） */
  portionChoice?: "150-200" | "500over-grams" | "600-700-only";
  /** 瓶ビール: ラガー / スーパードライ のどちらかを必須選択 */
  beerVariantChoice?: boolean;
  /** ハイボール: プレーン / レモン のどちらかを必須（レモンは +50円） */
  highballVariantChoice?: boolean;
  /** ビアボール: レモン / うめ / メロンのいずれかを必須 */
  beerBallVariantChoice?: boolean;
}

export interface LineItemCustomization {
  spiceLevel?: SpiceLevel;
  noodleFirmness?: NoodleFirmness;
  /** 麺量: 150/200/500+（150・200同価）、600〜1000（500g以上メニューは +¥100/100g） */
  noodlePortionGrams?: "150" | "200" | "500+" | "600" | "700" | "800" | "900" | "1000";
  /** 瓶ビール: ラガー or スーパードライ */
  beerVariant?: "lager" | "super_dry";
  /** ハイボール: プレーン or レモン（+50円） */
  highballVariant?: "plain" | "lemon";
  /** ビアボール: レモン / うめ / メロン */
  beerBallVariant?: "lemon" | "plum" | "melon";
  extraToppings?: { optionId: string; name: string; price: number }[];
  note?: string;
  seatLabel?: string;
  /** ぎょうざ等: 店内で提供 / お持ち帰り */
  serviceMode?: "dine_in" | "takeaway";
}

export interface CartLineItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customization: LineItemCustomization;
  unitPrice: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "paid"
  | "cancelled";

/** Trạng thái từng dòng món trong một đơn — không thay thế `status` của cả đơn */
export type LineFulfillmentStatus = "pending" | "delivered";

export interface OrderItemPayload {
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  customization: LineItemCustomization;
  /** `menu-data` の category — 追跡の「麺」集計に使用（旧データは ID から補完） */
  menu_category?: string;
  /** Bếp: đã mang ra bàn hay chưa (`pending` = mặc định nếu không có) */
  fulfillment_status?: LineFulfillmentStatus;
}

export interface OrderPayload {
  table_id?: string | null;
  table_label?: string | null;
  items: OrderItemPayload[];
  total_amount: number;
  status: OrderStatus;
  customer_note?: string | null;
  payment_status?: "pending" | "paid" | "refunded";
}

export interface OrderRecord {
  id: string;
  table_id: string | null;
  table_label: string | null;
  items: OrderItemPayload[];
  total_amount: number;
  status: OrderStatus;
  customer_note: string | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
}
