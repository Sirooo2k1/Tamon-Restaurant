"use client";

import { useEffect } from "react";
import { markNavFromPopState, isPostPaidBlockTableFromHistory } from "@/lib/menu-table-session";

/**
 * 「戻る/進む」で履歴移動した直後だけ卓復帰抑止が効くよう、メニュー未マウント時にも popstate を拾う。
 * 会計後ロック中は、履歴で checkout / order / ホーム / `?table=` 付きメニューに戻っても `/menu` へ寄せる。
 */
export function CustomerHistoryNavListener() {
  useEffect(() => {
    const onPop = () => {
      markNavFromPopState();
      if (typeof window === "undefined") return;
      try {
        if (!isPostPaidBlockTableFromHistory()) return;

        const path = window.location.pathname;
        const search = window.location.search;

        if (path.startsWith("/kitchen")) return;

        if (path === "/checkout" || path.startsWith("/order/")) {
          window.location.replace("/menu");
          return;
        }

        if (path === "/") {
          window.location.replace("/menu");
          return;
        }

        if (path === "/menu") {
          const params = new URLSearchParams(search);
          if (params.get("table")) {
            window.location.replace("/menu");
          }
        }
      } catch {
        /* noop */
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return null;
}
