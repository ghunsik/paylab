import type { Metadata } from "next";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteHeader } from "@/app/components/SiteHeader";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="legal-page section-shell">
        <header>
          <span className="section-kicker">PRIVACY</span>
          <h1>개인정보처리방침</h1>
          <p>시행일 2026년 7월 11일</p>
        </header>

        <article className="legal-content">
          <section>
            <h2>1. 계산 정보</h2>
            <p>
              PAYLAB 월급연구소의 계산은 사용자의 브라우저에서 수행됩니다. 급여, 입사일,
              가족 수 등 계산기에 입력한 값은 운영자 서버로 전송하거나 저장하지 않습니다.
            </p>
          </section>
          <section>
            <h2>2. 문의</h2>
            <p>
              이메일 문의 시 사용자가 직접 제공한 이메일 주소와 메시지 내용은 문의 답변을
              위해 처리됩니다. 문의에 민감한 급여명세서나 주민등록번호를 첨부하지 마세요.
            </p>
          </section>
          <section>
            <h2>3. 광고·분석 도구</h2>
            <p>
              현재 리뉴얼 버전에는 광고 또는 방문 분석 도구를 활성화하지 않았습니다. 향후
              도입할 경우 사용 서비스, 수집 항목, 보유 기간과 거부 방법을 이 방침에 먼저
              반영합니다.
            </p>
          </section>
          <section>
            <h2>4. 호스팅 과정에서 생성되는 정보</h2>
            <p>
              사이트 제공과 보안을 위해 호스팅 사업자가 IP 주소, 접속 시각, 브라우저 정보
              등의 기술 로그를 처리할 수 있습니다. 해당 처리는 호스팅 사업자의 정책과 보안
              설정을 따릅니다.
            </p>
          </section>
          <section>
            <h2>5. 권리와 문의처</h2>
            <p>
              본 방침에 관한 문의는
              {" "}
              <a href="mailto:ghunsik.kim@gmail.com">ghunsik.kim@gmail.com</a>으로 보내 주세요.
            </p>
          </section>
          <section>
            <h2>6. 변경</h2>
            <p>
              데이터 처리 방식이 바뀌면 시행일 전에 이 페이지에서 변경 내용을 알립니다.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
