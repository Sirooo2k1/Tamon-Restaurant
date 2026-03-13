import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { OrderItemPayload } from "@/lib/types";
import { getDevOrders, addDevOrder, type DevOrderRecord } from "@/lib/dev-orders";

function getOrdersFromStore() {
  try {
    return getSupabase();
  } catch {
    return null;
  }
}

export async function GET() {
  const db = getOrdersFromStore();
  if (db) {
    const { data, error } = await db.from("orders").select("*").order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }
  return NextResponse.json(getDevOrders().reverse());
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    table_id?: string;
    table_label?: string;
    items: OrderItemPayload[];
    total_amount: number;
    customer_note?: string;
  };

  const { table_id, table_label, items, total_amount, customer_note } = body;
  if (!items?.length || typeof total_amount !== "number") {
    return NextResponse.json(
      { error: "Thiếu items hoặc total_amount" },
      { status: 400 }
    );
  }

  const payload = {
    table_id: table_id ?? null,
    table_label: table_label ?? null,
    items,
    total_amount,
    status: "pending" as const,
    customer_note: customer_note ?? null,
    payment_status: "pending" as const,
  };

  const db = getOrdersFromStore();
  if (db) {
    const { data, error } = await db.from("orders").insert(payload).select("id, created_at, updated_at").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id, created_at: data.created_at, ...payload });
  }

  const id = `dev-${Date.now()}`;
  const now = new Date().toISOString();
  const record = { id, ...payload, created_at: now, updated_at: now } as DevOrderRecord;
  addDevOrder(record);
  return NextResponse.json(record);
}
