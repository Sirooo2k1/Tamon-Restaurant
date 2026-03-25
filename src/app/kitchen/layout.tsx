import { Suspense } from "react";
import { KitchenStaffGuard } from "@/components/kitchen/KitchenStaffGuard";
import { KitchenLogoutBar } from "@/components/kitchen/KitchenLogoutBar";

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-400">
          読み込み中…
        </div>
      }
    >
      <KitchenStaffGuard>
        <KitchenLogoutBar />
        {children}
      </KitchenStaffGuard>
    </Suspense>
  );
}
