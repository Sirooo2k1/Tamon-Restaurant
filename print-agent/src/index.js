import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { printKitchenTicket } from "./print.js";

const env = process.env;
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
/** Bắt buộc service role — RLS orders đã khóa anon */
const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (anon key is not enough after RLS lockdown)"
  );
  process.exit(1);
}
if (!env.PRINTER_HOST?.trim()) {
  console.error("Missing PRINTER_HOST — set Epson IP in print-agent/.env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** @type {Map<string, { itemCount: number, updated_at: string }>} */
const seen = new Map();
let ready = false;

function itemCount(order) {
  return Array.isArray(order?.items) ? order.items.length : 0;
}

async function handleOrder(order, { forceNew = false } = {}) {
  if (!order?.id) return;
  if (String(order.status ?? "").toLowerCase() === "cancelled") {
    seen.set(order.id, {
      itemCount: itemCount(order),
      updated_at: String(order.updated_at ?? ""),
    });
    return;
  }

  const prev = seen.get(order.id);
  const count = itemCount(order);

  if (!prev || forceNew) {
    await printKitchenTicket(order, { mode: "new" }, env);
    seen.set(order.id, {
      itemCount: count,
      updated_at: String(order.updated_at ?? ""),
    });
    return;
  }

  if (count > prev.itemCount) {
    const appended = (order.items ?? []).slice(prev.itemCount);
    await printKitchenTicket(order, { mode: "append", items: appended }, env);
    seen.set(order.id, {
      itemCount: count,
      updated_at: String(order.updated_at ?? ""),
    });
    return;
  }

  // Status-only updates: remember but do not reprint
  seen.set(order.id, {
    itemCount: count,
    updated_at: String(order.updated_at ?? ""),
  });
}

async function bootstrap() {
  const printOnStartup = String(env.PRINT_ON_STARTUP ?? "false").toLowerCase() === "true";
  const lookbackMin = Math.max(1, Number(env.STARTUP_LOOKBACK_MINUTES || 30));

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("[bootstrap] failed to load orders:", error.message);
    throw error;
  }

  const rows = data ?? [];
  const cutoff = Date.now() - lookbackMin * 60 * 1000;

  for (const order of rows) {
    const created = new Date(order.created_at).getTime();
    if (printOnStartup && created >= cutoff) {
      try {
        await handleOrder(order, { forceNew: true });
      } catch (err) {
        console.error("[bootstrap] print failed:", err.message || err);
      }
    } else {
      seen.set(order.id, {
        itemCount: itemCount(order),
        updated_at: String(order.updated_at ?? ""),
      });
    }
  }

  ready = true;
  console.log(
    `[bootstrap] tracked ${seen.size} orders (printOnStartup=${printOnStartup})`
  );
}

function subscribeRealtime() {
  const channel = supabase
    .channel("kitchen-print-agent")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      async (payload) => {
        if (!ready) return;
        try {
          await handleOrder(payload.new, { forceNew: true });
        } catch (err) {
          console.error("[realtime INSERT] print failed:", err.message || err);
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "orders" },
      async (payload) => {
        if (!ready) return;
        try {
          await handleOrder(payload.new);
        } catch (err) {
          console.error("[realtime UPDATE] print failed:", err.message || err);
        }
      }
    )
    .subscribe((status) => {
      console.log(`[realtime] ${status}`);
    });

  return channel;
}

/** Fallback if realtime drops — poll every few seconds */
async function pollLoop() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("[poll] error:", error.message);
    return;
  }

  for (const order of data ?? []) {
    const prev = seen.get(order.id);
    if (!prev) {
      try {
        await handleOrder(order, { forceNew: true });
      } catch (err) {
        console.error("[poll] print failed:", err.message || err);
      }
      continue;
    }
    if (itemCount(order) > prev.itemCount) {
      try {
        await handleOrder(order);
      } catch (err) {
        console.error("[poll] append print failed:", err.message || err);
      }
    } else if (String(order.updated_at ?? "") !== prev.updated_at) {
      seen.set(order.id, {
        itemCount: itemCount(order),
        updated_at: String(order.updated_at ?? ""),
      });
    }
  }
}

async function main() {
  console.log("Remenshop kitchen print agent");
  console.log(`Printer: ${env.PRINTER_HOST}:${env.PRINTER_PORT || 9100}`);
  console.log(`Supabase: ${url}`);

  await bootstrap();
  subscribeRealtime();
  setInterval(() => {
    pollLoop().catch((err) => console.error("[poll]", err.message || err));
  }, 4000);

  console.log("Listening for new orders… (keep this process running)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
