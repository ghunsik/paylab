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
          <p>시행일: 2026년 7월 11일</p>
        </header>

        <article className="legal-content">
          <section>
            <h2>1. 계산 정보</h2>
            <p>
              PAYLAB 급여 계산기의 계산은 사용자의 브라우저에서 수행됩니다. 급여,
              입사일, 가족 수 등 계산기에 입력한 값과 계산 결과는 PAYLAB 서버로
              전송하거나 저장하지 않습니다.
            </p>
          </section>

          <section>
            <h2>2. 익명 이용 현황 집계</h2>
            <p>
              서비스 이용 현황과 기능 개선에 참고하기 위해 페이지 조회 횟수와 계산
              완료 횟수를 익명으로 집계합니다. 저장하는 항목은 날짜, 페이지 경로,
              지표 구분, 누적 합계뿐입니다.
            </p>
            <p>
              IP 주소, 브라우저 및 기기 정보(User-Agent), 유입 경로(리퍼러), 쿠키나
              광고 식별자, 계산기 입력값은 수집하거나 저장하지 않습니다. 개인을
              구분할 수 있는 식별자를 사용하지 않으므로 집계 수치는 고유 방문자 수가
              아닌 전체 이용 횟수입니다.
            </p>
          </section>

          <section>
            <h2>3. 집계 목적·방법·보유</h2>
            <p>
              익명 집계는 서비스 이용 추세를 파악하고 화면과 계산 기능을 개선하기
              위한 목적으로만 사용합니다. 페이지가 조회되거나 계산이 완료되면 개별
              이용 기록을 남기지 않고 해당 날짜와 경로의 누적 합계만 증가시킵니다.
              익명 집계값은 서비스 운영 중 보유하며, 서비스가 종료되거나 집계 목적이
              사라지면 삭제합니다.
            </p>
          </section>

          <section>
            <h2>4. 외부 분석 도구 및 광고</h2>
            <p>
              현재 PAYLAB은 Google Analytics와 같은 외부 방문 분석 도구, 광고 추적
              도구 또는 맞춤형 광고를 사용하지 않습니다. 향후 도입하는 경우 사용
              서비스, 수집 항목, 이용 목적, 보유 기간과 거부 방법을 이 방침에 먼저
              반영하고 필요한 절차를 거치겠습니다.
            </p>
          </section>

          <section>
            <h2>5. 문의</h2>
            <p>
              이 방침과 관련한 문의는{" "}
              <a href="mailto:ghunsik.kim@gmail.com">ghunsik.kim@gmail.com</a>
              으로 보내 주세요. 문의 과정에서 제공한 정보는 답변과 문제 해결을 위해서만
              사용하며, 문의 처리가 끝나면 필요한 범위를 제외하고 삭제합니다. 문의
              메일에는 급여명세서, 주민등록번호 등 민감한 정보를 첨부하지 마세요.
            </p>
          </section>

          <section>
            <h2>6. 방침 변경 고지</h2>
            <p>
              수집 항목, 이용 목적 또는 보유 방식 등 중요한 내용이 변경되면 시행 전에
              이 페이지를 통해 변경 내용과 시행일을 알리겠습니다.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
