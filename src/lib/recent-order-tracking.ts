/**
 * Guest order “resume tracking” — backed by HttpOnly cookies set by `/api/orders` (checkout).
 * Client chỉ gọi API; không lưu UUID đơn trong localStorage.
 */

/** Dispatch sau khi cookie có thể đã đổi để UI gọi lại `/api/orders/tracked` */
export const TRACKED_ORDER_UPDATED_EVENT = "remenshop-tracked-order-updated";

export function notifyTrackedOrderUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TRACKED_ORDER_UPDATED_EVENT));
  }
}

export type TrackedOrderClientState = {
  orderId: string | null;
  /** true = đủ cặp cookie id + secret (GET đơn sẽ 200) */
  trackingReady: boolean;
};

export async function fetchTrackedOrderState(): Promise<TrackedOrderClientState> {
  try {
    const res = await fetch("/api/orders/tracked", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return { orderId: null, trackingReady: false };
    const data = (await res.json()) as {
      orderId?: string | null;
      trackingReady?: boolean;
    };
    const id = data.orderId?.trim();
    const trackingReady = data.trackingReady === true;
    return {
      orderId: id && id.length > 0 ? id : null,
      trackingReady,
    };
  } catch {
    return { orderId: null, trackingReady: false };
  }
}

/** Banner: chỉ hiện khi đủ cookie (đồng bộ với server) */
export async function fetchTrackedOrderId(): Promise<string | null> {
  const s = await fetchTrackedOrderState();
  return s.trackingReady ? s.orderId : null;
}

/**
 * Khôi phục phiên khi có link có `?k=` (token) — không dùng từ UI mặc định.
 * Sau khi GET /api/orders/[id] redirect đã set cookie; hàm này cho flow tùy biến.
 */
export async function registerTrackedOrderOnServer(
  orderId: string,
  guestViewToken: string
): Promise<boolean> {
  try {
    const res = await fetch("/api/orders/tracked", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, guestViewToken }),
    });
    if (!res.ok) return false;
    notifyTrackedOrderUpdated();
    return true;
  } catch {
    return false;
  }
}

export async function clearTrackedOrderOnServer(): Promise<void> {
  try {
    await fetch("/api/orders/tracked", {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    });
  } finally {
    notifyTrackedOrderUpdated();
  }
}
