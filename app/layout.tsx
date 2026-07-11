import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { AnonymousAnalytics } from "@/app/components/AnonymousAnalytics";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "paylab.kr";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    title: {
      default: "월급연구소 | 2026 급여 계산기",
      template: "%s | 월급연구소",
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: [
      "2026 연봉계산기",
      "월급 실수령액",
      "퇴직금 계산기",
      "실업급여 계산기",
      "주휴수당",
    ],
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: SITE_NAME,
      title: "받을 돈을, 근거까지. PAYLAB 월급연구소",
      description: SITE_DESCRIPTION,
      images: [{ url: socialImage, alt: "받을 돈을, 근거까지. PAYLAB 월급연구소" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "받을 돈을, 근거까지. PAYLAB 월급연구소",
      description: SITE_DESCRIPTION,
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AnonymousAnalytics />
        {children}
      </body>
    </html>
  );
}
