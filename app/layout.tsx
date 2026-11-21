import type { Metadata } from "next";
import "./globals.css";
import { AnonymousAnalytics } from "@/app/components/AnonymousAnalytics";
import { SITE_DESCRIPTION, SITE_NAME, SOCIAL_IMAGE } from "@/lib/site-content";

export function generateMetadata(): Metadata {
  const metadataBase = new URL("https://paylab.kr");

  return {
    metadataBase,
    title: {
      default: "월급연구소 | 급여·연말정산 계산기",
      template: "%s | 월급연구소",
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: [
      "연봉 실수령액 계산기",
      "월급 실수령액",
      "연말정산 환급액 계산기",
      "2027 최저임금",
      "퇴직금 계산기",
      "실업급여 계산기",
      "주휴수당",
    ],
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: SITE_NAME,
      title: "월급연구소: 실수령액·연말정산·퇴직금 계산기",
      description: SITE_DESCRIPTION,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: "월급연구소: 실수령액·연말정산·퇴직금 계산기",
      description: SITE_DESCRIPTION,
      images: [SOCIAL_IMAGE],
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
