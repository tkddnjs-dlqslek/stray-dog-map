import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "멍플래너 — 유기견 보호소 봉사 지도",
  description:
    "지도에서 근처 유기견 보호소를 찾고, 빈 시간대를 한눈에 보고 바로 봉사 신청하세요. 1365에 없는 사설보호소까지.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="logo">
              🐾 멍플래너<span> · 봉사지도</span>
            </Link>
            <span className="nav-group">
              <Link href="/register" className="nav-link">
                보호소 등록
              </Link>
              <Link href="/manage" className="nav-link">
                운영자 콘솔
              </Link>
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
