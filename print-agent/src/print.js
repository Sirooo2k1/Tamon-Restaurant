import { formatKitchenTicket } from "./format-ticket.js";
import { buildEposSoap, sendEposPrint } from "./epos.js";

export async function printKitchenTicket(order, opts = {}, env = process.env) {
  const host = env.PRINTER_HOST;
  if (!host) throw new Error("PRINTER_HOST is not set");

  const lines = formatKitchenTicket(order, opts);
  const itemCount = Array.isArray(opts.items)
    ? opts.items.length
    : order.items?.length ?? 0;

  console.log(
    `[print] → ${host} order=${order.id} mode=${opts.mode ?? "new"} items=${itemCount}`
  );
  await sendEposPrint(host, buildEposSoap(lines));
  console.log(`[print] OK order=${order.id}`);
}
