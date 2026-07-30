"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { OrderTrackingExperience } from "@/components/customer/OrderTrackingExperience";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartStore } from "@/store/cart-store";
import { menuHrefForCustomerNavigation } from "@/lib/menu-table-session";
import { useCustomerLocale } from "@/store/customer-locale-store";
import { orderTrackingCopy } from "@/lib/customer-order-tracking-copy";

function OrderTrackContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [replaceMenuNav, setReplaceMenuNav] = useState(false);
  const tableLabel = useCartStore((s) => s.tableLabel);
  const locale = useCustomerLocale();
  const t = orderTrackingCopy(locale);
  const raw = params?.id;
  const orderId =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const guestKey = searchParams.get("k")?.trim() || undefined;

  return (
    <>
      {!replaceMenuNav && (
        <div className="mx-auto max-w-lg px-4 pt-6 sm:pt-8">
          <Link
            href={menuHrefForCustomerNavigation(tableLabel)}
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.backToMenu}
          </Link>
        </div>
      )}
      {orderId ? (
        <OrderTrackingExperience
          orderId={orderId}
          showNav
          guestKeyFromQuery={guestKey}
          onReplaceMenuNavigation={setReplaceMenuNav}
        />
      ) : (
        <div className="px-4 py-20 text-center text-sm text-gray-600">
          {t.orderIdMissing}
        </div>
      )}
    </>
  );
}

export default function OrderTrackPage() {
  const locale = useCustomerLocale();
  const t = orderTrackingCopy(locale);

  return (
    <main
      className="min-h-screen pb-32"
      style={{
        background:
          "linear-gradient(180deg, #fef8f3 0%, #ecfdf5 35%, #fef3e8 70%, #fef8f3 100%)",
      }}
    >
      <Suspense
        fallback={
          <div className="px-4 py-20 text-center text-sm text-gray-600">
            {t.pageLoading}
          </div>
        }
      >
        <OrderTrackContent />
      </Suspense>
      <CartDrawer />
    </main>
  );
}
