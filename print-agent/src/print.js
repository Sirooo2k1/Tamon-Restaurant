import { formatKitchenTicket } from "./format-ticket.js";
import { buildEposSoap, sendEposPrint } from "./epos.js";
import { formatTicketNo, nextTicketSeq } from "./ticket-seq.js";

export async function printKitchenTicket(order, opts = {}, env = process.env) {
  const host = env.PRINTER_HOST;
  if (!host) throw new Error("PRINTER_HOST is not set");

  const ticketSeq = opts.ticketSeq ?? nextTicketSeq();
  const ticketNo = formatTicketNo(ticketSeq);
  const lines = formatKitchenTicket(order, { ...opts, ticketSeq, ticketNo });
  const itemCount = Array.isArray(opts.items)
    ? opts.items.length
    : order.items?.length ?? 0;

  console.log(
    `[print] → ${host} ${ticketNo} order=${order.id} mode=${opts.mode ?? "new"} items=${itemCount}`
  );
  await sendEposPrint(host, buildEposSoap(lines));
  console.log(`[print] OK ${ticketNo} order=${order.id}`);
}
