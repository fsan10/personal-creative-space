import type { Metadata } from "next";
import "./globals.css";
import Header from '../components/Header';
import { getPublicData } from '../lib/public-data';
export const dynamic='force-dynamic';

export const metadata: Metadata = {
  title: { default: "橘子的创作桌", template: "%s · 创作桌" },
  description: "把想法写下来，把喜欢的东西做出来。个人文章、作品与持续进行的实验。",
  metadataBase: new URL('https://fsan10-creative-web.jz1234da.chatgpt.site'),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {profile}=await getPublicData();
  return (
    <html lang="zh-CN">
      <body><a href="#main-content" className="skip-link">跳到正文</a><Header name={profile.name} github={profile.github}/><main id="main-content" className="site-main">{children}</main><footer className="site-footer"><div><a className="footer-brand" href="/">✳ {profile.name}的创作桌</a><p>把正在想的、正在做的，都放在这里。</p></div><div><a href="/rss.xml">RSS 订阅</a><a href={profile.github} target="_blank" rel="noreferrer">GitHub</a><a href="/about">关于</a></div><span>持续创作中 <i/></span></footer></body>
    </html>
  );
}
