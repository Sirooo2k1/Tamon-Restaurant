"use client";

import { useEffect, useState, useCallback } from "react";
import type { OrderRecord } from "@/lib/types";

async function fetchOrders(): Promise<OrderRecord[]> {
  const res = await fetch("/api/orders", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function useOrders() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetchOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [refresh]);

  return { orders, loading, refresh };
}

