export type SpiceLevel = "none" | "mild" | "medium" | "hot" | "extra_hot";
export type NoodleFirmness = "soft" | "medium" | "firm";

export interface MenuOption {
  id: string;
  name: string;
  nameVi?: string;
  price: number;
  type: "topping" | "extra" | "size";
}

export interface MenuItem {
  id: string;
  name: string;
  nameVi?: string;
  description?: string;
  category: "ramen" | "side" | "drink" | "combo";
  price: number;
  imageUrl?: string;
  options?: MenuOption[];
  defaultSpice?: boolean;
  defaultNoodleFirmness?: NoodleFirmness;
}

export interface LineItemCustomization {
  spiceLevel?: SpiceLevel;
  noodleFirmness?: NoodleFirmness;
  extraToppings?: { optionId: string; name: string; price: number }[];
  note?: string;
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

export interface OrderItemPayload {
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  customization: LineItemCustomization;
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
