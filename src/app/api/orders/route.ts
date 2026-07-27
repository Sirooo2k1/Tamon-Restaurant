import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { addDevOrder, appendDevOrderLines, getDevOrderById, getDevOrders, type DevOrderRecord } from "@/lib/dev-orders";
import type { OrderItemPayload } from "@/lib/types";
import { assertKitchenStaff } from "@/lib/kitchen-session";
import { sanitizeOrderRow } from "@/lib/order-public";
import { verifyGuestOrderToken } from "@/lib/order-exists-server";
import {
  canMergeOrderForCustomer,
  mergeOrderItems,
  normalizeAppendedOrderLines,
  orderStatusAfterMergeAppend,
  tableLabelsMatch,
} from "@/lib/order-merge";
import { findSoldOutInPayload, soldOutLabelJa } from "@/lib/menu-availability-server";
import {
  checkOrderCreateAllowed,
  getClientIpFromRequest,
  recordOrderCreate,
} from "@/lib/order-create-rate-limit";
import { priceOrderLinesFromMenu } from "@/lib/order-pricing-server";
import { canonicalTableCodeFromLabel } from "@/lib/restaurant-qr-tables";
import { getSupabaseForOrdersOrNull } from "@/lib/supabase-api";
import {
  TRACKED_ORDER_COOKIE,
  TRACKED_ORDER_SECRET_COOKIE,
  clearGuestOrderCookies,
  setGuestOrderCookies,
} from "@/lib/tracked-order-session";

function requireKnownTableLabel(table_label: string | undefined): string | null {
  const label = String(table_label ?? "").trim();
  if (!label) {
    return "卓番が必要です。お席のQRコードからメニューを開いてください。";
  }
  if (!canonicalTableCodeFromLabel(label)) {
    return "卓番が正しくありません。お席のQRコードから再度お試しください。";
  }
  return null;
}

/** Danh sách đơn — chỉ nhân viên đã đăng nhập bếp (production luôn bật) */
export async function GET(request: NextRequest) {
  const denied = assertKitchenStaff(request);
  if (denied) return denied;

  const db = getSupabaseForOrdersOrNull();
  if (db) {
    const { data, error } = await db.from("orders").select("*").order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = (data ?? []).map((r) => sanitizeOrderRow(r as Record<string, unknown>));
    return NextResponse.json(rows);
  }
  return NextResponse.json(
    getDevOrders()
      .reverse()
      .map((r) => sanitizeOrderRow(r as unknown as Record<string, unknown>))
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIpFromRequest(request);
  const limited = checkOrderCreateAllowed(ip);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "注文が多すぎます。しばらくしてから再度お試しください。" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      }
    );
  }

  const body = (await request.json()) as {
    table_id?: string;
    table_label?: string;
    items: OrderItemPayload[];
    total_amount: number;
    customer_note?: string;
    merge_into_current_order?: boolean;
  };

  const { table_id, table_label, items, customer_note, merge_into_current_order } = body;
  if (!items?.length) {
    return NextResponse.json({ error: "items が必要です" }, { status: 400 });
  }

  const tableErr = requireKnownTableLabel(table_label);
  if (tableErr) {
    return NextResponse.json({ error: tableErr }, { status: 400 });
  }

  const priced = priceOrderLinesFromMenu(items);
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: 400 });
  }
  const { items: pricedItems, total_amount } = priced;

  const soldOutIds = await findSoldOutInPayload(pricedItems);
  if (soldOutIds.length) {
    return NextResponse.json(
      {
        error: `ただいまご注文いただけないメニューが含まれています: ${soldOutLabelJa(soldOutIds)}`,
      },
      { status: 409 }
    );
  }

  /** Nối món vào đơn đang theo dõi trên cùng thiết bị (cookie + guest_view_token) */
  if (merge_into_current_order === true) {
    const c = cookies();
    const trackedId = c.get(TRACKED_ORDER_COOKIE)?.value?.trim() ?? "";
    const secret = c.get(TRACKED_ORDER_SECRET_COOKIE)?.value?.trim() ?? "";
    if (!trackedId || !secret) {
      return NextResponse.json(
        { error: "追跡中の注文がありません。新規注文として送信してください。" },
        { status: 400 }
      );
    }
    const tokenOk = await verifyGuestOrderToken(trackedId, secret);
    if (!tokenOk) {
      return NextResponse.json(
        { error: "この注文に追加入力する権限がありません。新規注文として送信してください。" },
        { status: 403 }
      );
    }

    const dbMerge = getSupabaseForOrdersOrNull();

    if (dbMerge) {
      const { data: row, error: fetchErr } = await dbMerge
        .from("orders")
        .select("*")
        .eq("id", trackedId)
        .maybeSingle();
      if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      }
      if (!row) {
        const res404 = NextResponse.json(
          { error: "元の注文が見つかりません。新規注文として送信してください。" },
          { status: 404 }
        );
        clearGuestOrderCookies(res404);
        return res404;
      }
      const rec = row as Record<string, unknown>;
      if (
        !canMergeOrderForCustomer({
          status: String(rec.status ?? ""),
          payment_status: rec.payment_status as string | null | undefined,
        })
      ) {
        return NextResponse.json(
          {
            error:
              "この注文は会計済み、またはキャンセル済みのため同じ注文に追加できません。新規注文として送信してください。",
          },
          { status: 409 }
        );
      }
      if (!tableLabelsMatch(rec.table_label as string | null, table_label ?? null)) {
        return NextResponse.json(
          {
            error:
              "卓番が元の注文と一致しません。卓番を合わせるか、新規注文してください。",
          },
          { status: 409 }
        );
      }
      const existingItems: OrderItemPayload[] = Array.isArray(rec.items)
        ? (rec.items as OrderItemPayload[])
        : [];
      const appended = normalizeAppendedOrderLines(pricedItems);
      const mergedItems = mergeOrderItems(existingItems, appended);
      const prevTotal = Number(rec.total_amount ?? 0);
      const nextTotal = prevTotal + total_amount;
      const bumpedStatus = orderStatusAfterMergeAppend(String(rec.status ?? ""), pricedItems);
      const { data: updated, error: updateErr } = await dbMerge
        .from("orders")
        .update({
          items: mergedItems,
          total_amount: nextTotal,
          ...(bumpedStatus ? { status: bumpedStatus } : {}),
        })
        .eq("id", trackedId)
        .select()
        .single();
      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      recordOrderCreate(ip);
      const res = NextResponse.json({
        ...sanitizeOrderRow(updated as Record<string, unknown>),
        merged: true,
      });
      setGuestOrderCookies(res, trackedId, secret);
      return res;
    }

    const existingDev = getDevOrderById(trackedId);
    if (!existingDev) {
      const res404 = NextResponse.json(
        { error: "元の注文が見つかりません。新規注文として送信してください。" },
        { status: 404 }
      );
      clearGuestOrderCookies(res404);
      return res404;
    }
    if (
      !canMergeOrderForCustomer({
        status: String(existingDev.status ?? ""),
        payment_status: existingDev.payment_status,
      })
    ) {
      return NextResponse.json(
        {
          error:
            "この注文は会計済み、またはキャンセル済みのため同じ注文に追加できません。新規注文として送信してください。",
        },
        { status: 409 }
      );
    }
    if (!tableLabelsMatch(existingDev.table_label ?? null, table_label ?? null)) {
      return NextResponse.json(
        {
          error:
            "卓番が元の注文と一致しません。卓番を合わせるか、新規注文してください。",
        },
        { status: 409 }
      );
    }
    const updated = appendDevOrderLines(trackedId, pricedItems, total_amount);
    if (!updated) {
      const res404 = NextResponse.json(
        { error: "元の注文が見つかりません。新規注文として送信してください。" },
        { status: 404 }
      );
      clearGuestOrderCookies(res404);
      return res404;
    }
    recordOrderCreate(ip);
    const res = NextResponse.json({
      ...sanitizeOrderRow(updated as unknown as Record<string, unknown>),
      merged: true,
    });
    setGuestOrderCookies(res, trackedId, secret);
    return res;
  }

  const guestViewToken = randomUUID();
  const payload = {
    table_id: table_id ?? null,
    table_label: table_label ?? null,
    items: pricedItems,
    total_amount,
    status: "pending" as const,
    customer_note: customer_note ?? null,
    payment_status: "pending" as const,
    guest_view_token: guestViewToken,
  };

  const db = getSupabaseForOrdersOrNull();
  if (db) {
    const { data, error } = await db
      .from("orders")
      .insert(payload as Record<string, unknown>)
      .select("id, created_at, updated_at, guest_view_token")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    recordOrderCreate(ip);
    const fullRow = { ...payload, id: data.id, created_at: data.created_at, updated_at: data.updated_at };
    const res = NextResponse.json(sanitizeOrderRow(fullRow as Record<string, unknown>));
    setGuestOrderCookies(res, data.id, guestViewToken);
    return res;
  }

  const id = `dev-${Date.now()}`;
  const now = new Date().toISOString();
  const record = {
    id,
    ...payload,
    created_at: now,
    updated_at: now,
  } as DevOrderRecord;
  addDevOrder(record);
  recordOrderCreate(ip);
  const res = NextResponse.json(sanitizeOrderRow(record as unknown as Record<string, unknown>));
  setGuestOrderCookies(res, id, guestViewToken);
  return res;
}
