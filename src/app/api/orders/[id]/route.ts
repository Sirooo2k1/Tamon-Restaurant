import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { updateDevOrder } from "@/lib/dev-orders";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as { status?: string; payment_status?: string };

  const db = (() => {
    try {
      return getSupabase();
    } catch {
      return null;
    }
  })();

  if (db) {
    const update: { status?: string; payment_status?: string } = {};
    if (body.status != null) update.status = body.status;
    if (body.payment_status != null) update.payment_status = body.payment_status;
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Cần status hoặc payment_status" }, { status: 400 });
    }
    const { data, error } = await db.from("orders").update(update).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const updated = updateDevOrder(id, body);
  if (!updated) return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });
  return NextResponse.json(updated);
}
