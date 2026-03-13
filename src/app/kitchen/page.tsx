"use client";

import { useState } from "react";
import type { OrderRecord, OrderItemPayload } from "@/lib/types";
import { useOrders } from "@/hooks/use-orders";

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chế biến",
  ready: "Sẵn sàng",
  served: "Đã phục vụ",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
};

const STATUS_FLOW: Record<string, string | null> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "served",
  served: "paid",
  paid: null,
};

function OrderCard({
  order,
  onStatusChange,
}: {
  order: OrderRecord;
  onStatusChange: (id: string, status: string, payment_status?: string) => void;
}) {
  const items = (order.items ?? []) as OrderItemPayload[];
  const nextStatus = STATUS_FLOW[order.status];

  return (
    <div className="rounded-2xl border border-[#f1e4d6] bg-white p-4 space-y-3 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-mono text-xs text-[color:var(--ramen-muted)]">
            #{order.id.slice(0, 8)}
          </p>
          <p className="text-[11px] text-[color:var(--ramen-muted)]">
            {order.table_label ? `Bàn ${order.table_label}` : "Không số bàn"} ·{" "}
            {new Date(order.created_at).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
            order.status === "pending"
              ? "bg-[#fff3d9] text-[#d38b18]"
              : order.status === "paid"
              ? "bg-emerald-100 text-emerald-700"
              : order.status === "ready"
              ? "bg-sky-100 text-sky-700"
              : "bg-[#f3e4d8] text-[color:var(--ramen-brown)]"
          }`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>
      <ul className="space-y-1 text-sm">
        {items.map((line, i) => (
          <li key={i} className="flex justify-between">
            <span className="text-[color:var(--ramen-brown)]">
              {line.menu_item_name} × {line.quantity}
              {line.customization?.note && (
                <span className="text-stone-500 block text-xs">Ghi chú: {line.customization.note}</span>
              )}
            </span>
            <span className="text-[11px] font-medium text-[color:var(--ramen-primary-strong)]">
              {(line.unit_price * line.quantity).toLocaleString("vi-VN")}₫
            </span>
          </li>
        ))}
      </ul>
      {order.customer_note && (
        <p className="text-xs text-[color:var(--ramen-muted)] border-l-2 border-[var(--ramen-primary)]/60 pl-2">
          Ghi chú: {order.customer_note}
        </p>
      )}
      <div className="flex gap-2 flex-wrap">
        {nextStatus && (
          <button
            type="button"
            onClick={() => onStatusChange(order.id, nextStatus)}
            className="primary-btn h-8 px-4 text-[11px]"
          >
            → {STATUS_LABELS[nextStatus]}
          </button>
        )}
        {order.status === "served" && order.payment_status !== "paid" && (
          <button
            type="button"
            onClick={() => onStatusChange(order.id, "paid", "paid")}
            className="inline-flex h-8 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-600"
          >
            Đã thanh toán
          </button>
        )}
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const { orders, loading, refresh } = useOrders();

  const handleStatusChange = async (
    id: string,
    status: string,
    payment_status?: string
  ) => {
    try {
      const body: { status: string; payment_status?: string } = { status };
      if (payment_status) body.payment_status = payment_status;
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const activeOrders = orders.filter(
    (o) => !["paid", "cancelled"].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ["paid", "cancelled"].includes(o.status)
  );
  const allOrders = [...activeOrders, ...completedOrders];

  return (
    <main className="app-shell flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-[32px] border border-[#f2e2d2] bg-[var(--ramen-surface)] shadow-[0_28px_80px_rgba(7,12,22,0.7)]">
        {/* Sidebar giống QRMenu Admin */}
        <aside className="hidden w-52 flex-col border-r border-[#f2e2d2] bg-white px-4 py-5 text-sm text-[color:var(--ramen-brown)] sm:flex">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--ramen-primary)] text-lg font-semibold text-white">
              🍜
            </div>
            <span className="text-xs font-semibold">QRMenu Admin</span>
          </div>
          <nav className="space-y-1 text-xs">
            <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[color:var(--ramen-muted)] hover:bg-[var(--ramen-surface)]">
              <span>Overview</span>
            </button>
            <button className="flex w-full items-center gap-2 rounded-xl bg-[var(--ramen-primary)] px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(240,163,42,0.6)]">
              <span>Orders</span>
              <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                {orders.length}
              </span>
            </button>
            <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[color:var(--ramen-muted)] hover:bg-[var(--ramen-surface)]">
              <span>Menu Builder</span>
            </button>
            <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[color:var(--ramen-muted)] hover:bg-[var(--ramen-surface)]">
              <span>QR Codes</span>
            </button>
            <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[color:var(--ramen-muted)] hover:bg-[var(--ramen-surface)]">
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        {/* Content */}
        <section className="flex-1 bg-[var(--ramen-surface)] px-4 py-5 sm:px-6">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#f2e2d2] pb-3">
            <div>
              <h1 className="text-lg font-semibold text-[color:var(--ramen-brown)]">
                Orders
              </h1>
              <p className="text-[11px] text-[color:var(--ramen-muted)]">
                Kitchen view — cập nhật trạng thái đơn theo thời gian thực
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="rounded-full bg-[var(--ramen-surface-strong)] px-3 py-1 font-medium text-[color:var(--ramen-brown)]">
                Golden Dragon
              </span>
              <span className="hidden text-[color:var(--ramen-muted)] sm:inline">
                {activeOrders.length} active · {completedOrders.length} completed
              </span>
            </div>
          </header>

          {loading ? (
            <p className="text-xs text-[color:var(--ramen-muted)]">Đang tải đơn hàng...</p>
          ) : allOrders.length === 0 ? (
            <p className="text-xs text-[color:var(--ramen-muted)]">
              Chưa có đơn nào. Khi khách gửi đơn từ QR menu, chúng sẽ xuất hiện tại
              đây.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
