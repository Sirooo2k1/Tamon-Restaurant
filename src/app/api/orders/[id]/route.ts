import { NextRequest, NextResponse } from "next/server";
import { assertKitchenStaff } from "@/lib/kitchen-session";
import {
  markAllOrderLinesDelivered,
  markNoodleOrderLinesDeliveredOnly,
  shouldAutoMarkAllLinesDelivered,
} from "@/lib/order-auto-fulfillment";
import { getDevOrderById, updateDevOrder } from "@/lib/dev-orders";
import { sanitizeOrderRow } from "@/lib/order-public";
import { getSupabaseForOrdersOrNull } from "@/lib/supabase-api";
import {
  TRACKED_ORDER_COOKIE,
  TRACKED_ORDER_SECRET_COOKIE,
  setGuestOrderCookies,
} from "@/lib/tracked-order-session";
import type { OrderItemPayload, OrderStatus } from "@/lib/types";

const RESTORABLE_PRE_CANCEL = new Set<OrderStatus>([
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
]);

function restoreStatusFromPreCancel(raw: unknown): OrderStatus {
  if (typeof raw === "string" && RESTORABLE_PRE_CANCEL.has(raw as OrderStatus)) {
    return raw as OrderStatus;
  }
  return "pending";
}

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" } as const;

function verifyGuestCookies(request: NextRequest, orderId: string, rowToken: string): boolean {
  const oid = request.cookies.get(TRACKED_ORDER_COOKIE)?.value;
  const sec = request.cookies.get(TRACKED_ORDER_SECRET_COOKIE)?.value;
  return oid === orderId && Boolean(sec) && sec === rowToken;
}

/** Public read — chỉ khi cookie HttpOnly khớp hoặc ?k= (một lần) đặt cookie */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "id が必要です" }, { status: 400 });
  }

  const key = request.nextUrl.searchParams.get("k");
  const db = getSupabaseForOrdersOrNull();

  let row: Record<string, unknown> | null = null;

  if (db) {
    const { data, error } = await db.from("orders").select("*").eq("id", id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
    row = data as Record<string, unknown>;
  } else {
    const record = getDevOrderById(id);
    if (!record) return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
    row = record as unknown as Record<string, unknown>;
  }

  const token = row.guest_view_token;
  const tokenStr = typeof token === "string" && token.length > 0 ? token : null;

  if (!tokenStr) {
    if (process.env.NODE_ENV !== "production") {
      const oidOnly = request.cookies.get(TRACKED_ORDER_COOKIE)?.value;
      if (oidOnly !== id) {
        return NextResponse.json(
          { error: "アクセスできません（開発: guest_view_token なしの場合は track cookie のみ）" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        {
          error:
            "データベースに guest_view_token がありません。Supabase でマイグレーションを実行してください。",
        },
        { status: 503 }
      );
    }
  } else {
    if (key === tokenStr) {
      /** `fetch` + JSON 用: リダイレクトだと一部クライアントで二重リクエスト扱いになるため `format=json` で本文+Set-Cookie を一度に返す */
      const jsonMode = request.nextUrl.searchParams.get("format") === "json";
      if (jsonMode) {
        const res = NextResponse.json(sanitizeOrderRow(row), { headers: NO_STORE });
        setGuestOrderCookies(res, id, tokenStr);
        return res;
      }
      const clean = request.nextUrl.clone();
      clean.searchParams.delete("k");
      const res = NextResponse.redirect(clean);
      setGuestOrderCookies(res, id, tokenStr);
      return res;
    }
    if (!verifyGuestCookies(request, id, tokenStr)) {
      return NextResponse.json(
        {
          error:
            "本日はご来店ありがとうございました。ご注文の確認は、ご注文時の端末またはお席のQRのリンクからご覧いただけます。",
          code: "guest_access_required",
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.json(sanitizeOrderRow(row), { headers: NO_STORE });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = assertKitchenStaff(request);
  if (denied) return denied;

  const { id } = await params;
  const body = (await request.json()) as {
    status?: string;
    payment_status?: string;
    items?: OrderItemPayload[];
    undo_cancel?: boolean;
  };

  const db = getSupabaseForOrdersOrNull();

  if (db) {
    const { data: row, error: fetchErr } = await db.from("orders").select("*").eq("id", id).maybeSingle();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });

    const rec = row as Record<string, unknown>;
    const currentStatus = String(rec.status ?? "");

    if (body.undo_cancel) {
      if (currentStatus !== "cancelled") {
        return NextResponse.json({ error: "キャンセル済みの注文だけ取り消せます。" }, { status: 400 });
      }
      const restore = restoreStatusFromPreCancel(rec.pre_cancel_status);
      const { data, error } = await db
        .from("orders")
        .update({ status: restore, pre_cancel_status: null })
        .eq("id", id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(sanitizeOrderRow(data as Record<string, unknown>), { headers: NO_STORE });
    }

    if (currentStatus === "cancelled") {
      return NextResponse.json(
        {
          error:
            "キャンセル済みの注文は「キャンセルを取り消す」操作でのみ更新できます。一覧から該当注文で利用してください。",
        },
        { status: 409 }
      );
    }

    const currentItems: OrderItemPayload[] = Array.isArray(rec.items)
      ? (rec.items as OrderItemPayload[])
      : [];

    let nextItems: OrderItemPayload[] | undefined;
    if (body.status != null && shouldAutoMarkAllLinesDelivered(body.status)) {
      const base = body.items ?? currentItems;
      if (body.items != null && !Array.isArray(body.items)) {
        return NextResponse.json({ error: "items は配列である必要があります" }, { status: 400 });
      }
      const arr = Array.isArray(base) ? base : [];
      nextItems =
        body.status === "paid"
          ? markAllOrderLinesDelivered(arr)
          : markNoodleOrderLinesDeliveredOnly(arr);
    } else if (body.items != null) {
      if (!Array.isArray(body.items)) {
        return NextResponse.json({ error: "items は配列である必要があります" }, { status: 400 });
      }
      nextItems = body.items;
    }

    const update: {
      status?: string;
      payment_status?: string;
      items?: unknown;
      pre_cancel_status?: string | null;
    } = {};

    if (body.status === "cancelled") {
      if (currentStatus === "paid") {
        return NextResponse.json({ error: "会計済みの注文はキャンセルできません。" }, { status: 400 });
      }
      update.pre_cancel_status = currentStatus;
      update.status = "cancelled";
    } else if (body.status != null) {
      update.status = body.status;
    }

    if (body.payment_status != null) update.payment_status = body.payment_status;
    if (nextItems !== undefined) update.items = nextItems;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "status / payment_status / items のいずれかが必要です" },
        { status: 400 }
      );
    }
    const { data, error } = await db.from("orders").update(update).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(sanitizeOrderRow(data as Record<string, unknown>), { headers: NO_STORE });
  }

  const devPeek = getDevOrderById(id);
  if (!devPeek) return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  if (devPeek.status === "cancelled" && !body.undo_cancel) {
    return NextResponse.json(
      {
        error:
          "キャンセル済みの注文は「キャンセルを取り消す」操作でのみ更新できます。一覧から該当注文で利用してください。",
      },
      { status: 409 }
    );
  }

  const updated = updateDevOrder(id, body);
  if (!updated) {
    if (body.undo_cancel) {
      return NextResponse.json({ error: "キャンセル済みの注文だけ取り消せます。" }, { status: 400 });
    }
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }
  return NextResponse.json(sanitizeOrderRow(updated as unknown as Record<string, unknown>), {
    headers: NO_STORE,
  });
}
