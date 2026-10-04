import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "创作桌 · 管理台",
  description: "写文章、管理作品与持续进行的实验。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
