"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import Link from "next/link";

export default function CheckoutPage() {
  const { items, getSubtotal, tableLabel, setTableLabel, clearCart } = useCartStore();
  const [customerNote, setCustomerNote] = useState("");
  const [step, setStep] = useState<"form" | "sending" | "success" | "error">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const subtotal = getSubtotal();

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setStep("sending");
    setErrorMessage("");

    const payload = {
      table_id: tableLabel?.replace(/\D/g, "") || null,
      table_label: tableLabel || null,
      items: items.map((line) => ({
        menu_item_id: line.menuItem.id,
        menu_item_name: line.menuItem.nameVi ?? line.menuItem.name,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        customization: line.customization,
      })),
      total_amount: subtotal,
      customer_note: customerNote.trim() || undefined,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gửi đơn thất bại");
      setOrderId(data.id);
      clearCart();
      setStep("success");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
      setStep("error");
    }
  };

  const handlePayConfirm = async () => {
    if (!orderId) return;
    setStep("sending");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: "paid", status: "paid" }),
      });
      if (!res.ok) throw new Error("Cập nhật thanh toán thất bại");
      setStep("success");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Lỗi");
      setStep("error");
    }
  };

  if (items.length === 0 && step !== "success" && step !== "error") {
    return (
      <main className="app-shell flex min-h-screen flex-col items-center justify-center p-6">
        <div className="app-container max-w-sm text-center space-y-4">
          <p className="text-sm text-[color:var(--ramen-muted)]">Giỏ hàng trống.</p>
          <Link href="/menu" className="primary-btn w-full justify-center">
            Quay lại menu
          </Link>
        </div>
      </main>
    );
  }

  if (step === "success") {
    return (
      <main className="app-shell flex min-h-screen flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--ramen-surface-strong)] text-3xl shadow-md shadow-[rgba(163,113,59,0.4)]">
            ✅
          </div>
          <h1 className="text-2xl font-semibold text-[color:var(--ramen-brown)]">
            Đơn hàng đã gửi!
          </h1>
          <p className="text-sm text-[color:var(--ramen-muted)]">
            {orderId && (
              <>Mã đơn: <span className="font-mono text-amber-200">{orderId.slice(0, 8)}</span></>
            )}
          </p>
          <p className="text-xs text-stone-500">
            Bếp sẽ chuẩn bị và phục vụ bạn. Bạn có thể thanh toán khi nhận món hoặc thanh toán ngay.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/menu"
              className="primary-btn justify-center"
            >
              Gọi thêm món
            </Link>
            <Link
              href="/"
              className="secondary-btn justify-center"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (step === "error") {
    return (
      <main className="app-shell flex min-h-screen flex-col items-center justify-center p-6">
        <p className="mb-2 text-sm text-red-500">{errorMessage}</p>
        <button
          type="button"
          onClick={() => setStep("form")}
          className="primary-btn"
        >
          Thử lại
        </button>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen">
      <div className="mx-auto flex max-w-lg flex-col p-6 pb-24">
        <Link
          href="/menu"
          className="mb-4 inline-flex items-center text-xs font-medium text-[color:var(--ramen-primary-strong)] underline-offset-2 hover:underline"
        >
          ← Quay lại menu
        </Link>
        <h1 className="mb-4 text-2xl font-semibold text-[color:var(--ramen-brown)]">
          Thanh toán
        </h1>

      <div className="mb-6 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--ramen-muted)]">
            Số bàn (tùy chọn)
          </label>
          <input
            type="text"
            value={tableLabel ?? ""}
            onChange={(e) => setTableLabel(e.target.value || null)}
            placeholder="Vd: Bàn 5, 12"
            className="w-full rounded-2xl border border-[#e2d2bf] bg-[color:var(--ramen-surface)] px-4 py-2 text-sm text-[color:var(--ramen-brown)] placeholder-stone-400 focus:border-[color:var(--ramen-primary)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--ramen-muted)]">
            Ghi chú cho bếp
          </label>
          <textarea
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            placeholder="Không hành, ít cay..."
            rows={2}
            className="w-full resize-none rounded-2xl border border-[#e2d2bf] bg-[color:var(--ramen-surface)] px-4 py-2 text-sm text-[color:var(--ramen-brown)] placeholder-stone-400 focus:border-[color:var(--ramen-primary)] focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-[#f1e4d6] bg-[color:var(--ramen-surface)] pt-3 pb-3 pl-4 pr-4">
        <ul className="space-y-2 text-sm text-[color:var(--ramen-brown)]">
          {items.map((line) => (
            <li key={line.id} className="flex justify-between text-sm">
              <span>
                {line.menuItem.nameVi ?? line.menuItem.name} × {line.quantity}
              </span>
              <span>{(line.unitPrice * line.quantity).toLocaleString("vi-VN")}₫</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-right text-xl font-semibold text-[color:var(--ramen-primary-strong)]">
          Tổng: {subtotal.toLocaleString("vi-VN")}₫
        </p>
      </div>

      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={step === "sending"}
        className="primary-btn w-full justify-center disabled:opacity-60"
      >
        {step === "sending" ? "Đang gửi đơn..." : "Gửi đơn & chờ phục vụ"}
      </button>
      <p className="mt-3 text-center text-xs text-stone-500">
        Thanh toán khi nhận món hoặc qua nhân viên.
      </p>
      </div>
    </main>
  );
}
