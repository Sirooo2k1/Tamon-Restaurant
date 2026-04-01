"use client";

import { useEffect } from "react";
import { markNavFromPopState } from "@/lib/menu-table-session";

/**
 * 「戻る/進む」で履歴移動した直後だけ卓復帰抑止が効くよう、メニュー未マウント時にも popstate を拾う。
 * （メニュー内だけに listener があると /order から戻ったときにフラグが立たない。）
 */
export function CustomerHistoryNavListener() {
  useEffect(() => {
    const onPop = () => markNavFromPopState();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return null;
}
