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
  title: "AI狂愛コロシアム - Love is Chaos",
  description: "あなたの愛の重さを狂気のAIが断罪します。生き残れるか、堕ちるか。",
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.png", 
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
    <html lang="ja" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-red-600 selection:bg-red-900 selection:text-white`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}