import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Ramen Menu | Gọi món & Thanh toán",
  description: "Menu điện tử nhà hàng ramen - Quét QR, chọn món, thanh toán ngay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
