/**
 * Giá đơn server-side — không tin unit_price / total_amount từ client.
 */
import { HIGHBALL_LEMON_SURCHARGE_VND } from "@/lib/drink-pricing";
import { menuItems } from "@/lib/menu-data";
import { tsukemenPortionSurchargeTotal } from "@/lib/tsukemen-portion-pricing";
import type { LineItemCustomization, OrderItemPayload } from "@/lib/types";

const MENU_BY_ID = new Map(menuItems.map((m) => [m.id, m]));

function highballSurcharge(
  menu: (typeof menuItems)[number],
  c: LineItemCustomization
): number {
  if (menu.highballVariantChoice && c.highballVariant === "lemon") {
    return HIGHBALL_LEMON_SURCHARGE_VND;
  }
  return 0;
}

function sanitizeCustomization(
  menu: (typeof menuItems)[number],
  raw: LineItemCustomization | undefined
): { ok: true; customization: LineItemCustomization } | { ok: false; error: string } {
  const c: LineItemCustomization = raw && typeof raw === "object" ? { ...raw } : {};

  const extras: { optionId: string; name: string; price: number }[] = [];
  for (const t of c.extraToppings ?? []) {
    const optionId = String(t?.optionId ?? "").trim();
    if (!optionId) {
      return { ok: false, error: "トッピング情報が不正です" };
    }
    const opt = menu.options?.find((o) => o.id === optionId);
    if (!opt) {
      return { ok: false, error: `このメニューにないトッピングです: ${optionId}` };
    }
    extras.push({ optionId: opt.id, name: opt.name, price: opt.price });
  }
  if (extras.length) c.extraToppings = extras;
  else delete c.extraToppings;

  if (menu.highballVariantChoice) {
    if (c.highballVariant !== "plain" && c.highballVariant !== "lemon") {
      return { ok: false, error: "ハイボールの種類を選択してください" };
    }
  } else {
    delete c.highballVariant;
  }

  if (menu.beerVariantChoice) {
    if (c.beerVariant !== "lager" && c.beerVariant !== "super_dry") {
      return { ok: false, error: "ビールの種類を選択してください" };
    }
  } else {
    delete c.beerVariant;
  }

  if (menu.beerBallVariantChoice) {
    if (
      c.beerBallVariant !== "lemon" &&
      c.beerBallVariant !== "plum" &&
      c.beerBallVariant !== "melon"
    ) {
      return { ok: false, error: "ビアボールの種類を選択してください" };
    }
  } else {
    delete c.beerBallVariant;
  }

  if (menu.portionChoice === "150-200") {
    if (c.noodlePortionGrams !== "150" && c.noodlePortionGrams !== "200") {
      return { ok: false, error: "麺量を選択してください" };
    }
  } else if (menu.portionChoice === "500over-grams") {
    const g = c.noodlePortionGrams;
    if (!g || !["600", "700", "800", "900", "1000"].includes(g)) {
      return { ok: false, error: "麺量を選択してください" };
    }
  } else if (menu.portionChoice === "600-700-only") {
    if (c.noodlePortionGrams !== "600" && c.noodlePortionGrams !== "700") {
      return { ok: false, error: "麺量を選択してください" };
    }
  }

  if (typeof c.note === "string") {
    c.note = c.note.trim().slice(0, 200);
    if (!c.note) delete c.note;
  } else {
    delete c.note;
  }

  if (typeof c.seatLabel === "string") {
    c.seatLabel = c.seatLabel.trim().slice(0, 40);
    if (!c.seatLabel) delete c.seatLabel;
  } else {
    delete c.seatLabel;
  }

  if (c.serviceMode !== "dine_in" && c.serviceMode !== "takeaway") {
    delete c.serviceMode;
  }

  return { ok: true, customization: c };
}

function unitPriceFor(
  menu: (typeof menuItems)[number],
  c: LineItemCustomization
): number {
  const toppings = c.extraToppings?.reduce((s, t) => s + t.price, 0) ?? 0;
  return (
    menu.price +
    toppings +
    highballSurcharge(menu, c) +
    tsukemenPortionSurchargeTotal(menu, c)
  );
}

/**
 * Chuẩn hóa dòng đơn + tổng tiền từ menu-data.
 * Giữ fulfillment_status từ client nếu hợp lệ (merge append → pending).
 */
export function priceOrderLinesFromMenu(
  items: OrderItemPayload[]
):
  | { ok: true; items: OrderItemPayload[]; total_amount: number }
  | { ok: false; error: string } {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "items が必要です" };
  }
  if (items.length > 50) {
    return { ok: false, error: "一度に注文できる品数が多すぎます" };
  }

  const priced: OrderItemPayload[] = [];
  let total = 0;

  for (const line of items) {
    const menuId = String(line?.menu_item_id ?? "").trim();
    const qty = Number(line?.quantity);
    if (!menuId || !Number.isFinite(qty) || qty < 1 || qty > 99 || !Number.isInteger(qty)) {
      return { ok: false, error: "数量またはメニューが不正です" };
    }

    const menu = MENU_BY_ID.get(menuId);
    if (!menu) {
      return { ok: false, error: `メニューが見つかりません: ${menuId}` };
    }

    const cust = sanitizeCustomization(menu, line.customization);
    if (!cust.ok) return cust;

    const unit = unitPriceFor(menu, cust.customization);
    const fulfillment =
      line.fulfillment_status === "delivered" ? "delivered" : "pending";

    priced.push({
      menu_item_id: menu.id,
      menu_item_name: menu.name,
      quantity: qty,
      unit_price: unit,
      customization: cust.customization,
      menu_category: menu.category,
      fulfillment_status: fulfillment,
    });
    total += unit * qty;
  }

  return { ok: true, items: priced, total_amount: total };
}
