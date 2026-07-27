import "dotenv/config";
import { printKitchenTicket } from "./print.js";

const sample = {
  id: "31cf8da9-e5f6-7890-abcd-ef0123456789",
  table_id: "T2",
  table_label: "カウンター2番",
  items: [
    {
      menu_item_id: "tamon-300",
      menu_item_name: "多聞つけ麺 300g",
      quantity: 1,
      unit_price: 334000,
      customization: {
        note: "冷たい麺",
        extraToppings: [
          { optionId: "ajitama", name: "味玉", price: 22000 },
          { optionId: "chashu", name: "チャーシュー (3枚)", price: 72000 },
        ],
      },
    },
    {
      menu_item_id: "gyoza-shiso",
      menu_item_name: "しそ餃子 (5個)",
      quantity: 1,
      unit_price: 100000,
      customization: { serviceMode: "dine_in" },
    },
    {
      menu_item_id: "cola",
      menu_item_name: "コーラ",
      quantity: 1,
      unit_price: 50000,
      customization: {},
    },
  ],
  total_amount: 484000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

if (!process.env.PRINTER_HOST) {
  console.error("Set PRINTER_HOST in print-agent/.env");
  process.exit(1);
}

printKitchenTicket(sample, { mode: "new" }, process.env)
  .then(() => console.log("Test print OK"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
