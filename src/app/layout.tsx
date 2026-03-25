import type { Metadata } from "next";
import "./globals.css";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "多聞 Menu | Order & Pay Automatically",
  description:
    "Digital ramen menu — scan the QR code at your table, order dishes, and pay when you're done.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={cn("font-sans", dmSans.variable, playfair.variable)}
    >
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
