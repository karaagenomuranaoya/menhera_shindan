import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI メンヘラ診断",
  description: "あなたの愛の重さをメンヘラのお友達AIが診断します。",
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.png", // public/favicon.png を参照
  },
  verification: {
    google: 'gTBau9kCei49KzHb9OaBOrOeYj3Mwd_LCn1sktxJqMY', 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* ▼▼▼ 2. この行を追加（ここに配置することで全ページで計測されます） ▼▼▼ */}
        <Analytics />
      </body>
    </html>
  );
}