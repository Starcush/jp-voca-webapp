import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppToaster } from "@/components/AppToaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "단어장",
  description: "Japanese vocabulary notebook web app",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
