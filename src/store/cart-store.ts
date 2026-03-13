import { create } from "zustand";
import type { CartLineItem, LineItemCustomization, MenuItem } from "@/lib/types";

function computeLineTotal(item: MenuItem, qty: number, customization: LineItemCustomization): number {
  let total = item.price * qty;
  customization.extraToppings?.forEach((t) => (total += t.price * qty));
  return total;
}

interface CartState {
  items: CartLineItem[];
  tableLabel: string | null;
  addItem: (menuItem: MenuItem, quantity: number, customization: LineItemCustomization) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  setTableLabel: (label: string | null) => void;
  getSubtotal: () => number;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableLabel: null,

  addItem(menuItem, quantity, customization) {
    const id = `${menuItem.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const unitPrice = menuItem.price + (customization.extraToppings?.reduce((s, t) => s + t.price, 0) ?? 0);
    set((state) => ({
      items: [
        ...state.items,
        {
          id,
          menuItem,
          quantity,
          customization,
          unitPrice,
        },
      ],
    }));
  },

  updateQuantity(lineId, quantity) {
    if (quantity < 1) {
      get().removeItem(lineId);
      return;
    }
    set((state) => ({
      items: state.items.map((line) =>
        line.id === lineId ? { ...line, quantity } : line
      ),
    }));
  },

  removeItem(lineId) {
    set((state) => ({
      items: state.items.filter((line) => line.id !== lineId),
    }));
  },

  setTableLabel(tableLabel) {
    set({ tableLabel });
  },

  getSubtotal() {
    return get().items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  },

  clearCart() {
    set({ items: [] });
  },
}));
