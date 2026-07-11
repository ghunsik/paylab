import type { Metadata } from "next";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteHeader } from "@/app/components/SiteHeader";

export const metadata: Metadata = {
  title: "이용약관·면책조항",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="legal-page section-shell">
        <header>
          <span className="section-kicker">TERMS</span>
          <h1>이용약관·면책조항</h1>
          <p>시행일 2026년 7월 11일</p>
        </header>

        <article className="legal-content">
          <section>
            <h2>1. 서비스의 목적</h2>
            <p>
              PAYLAB 월급연구소는 급여, 사회보험, 퇴직과 수당을 이해하기 위한 참고용 예상
              계산 도구를 제공합니다.
            </p>
          </section>
          <section>
            <h2>2. 결과의 한계</h2>
            <p>
              계산 결과는 법적 확정액이 아닙니다. 회사가 신고한 보수, 가입 예외, 근무표,
              휴직·제외기간, 출근율, 세액표 적용 방식과 정산에 따라 실제 금액이 달라질 수
              있습니다. 중요한 의사결정 전에는 회사 담당자, 공단 또는 전문가에게 확인하세요.
            </p>
          </section>
          <section>
            <h2>3. 기준과 오류 정정</h2>
            <p>
              운영자는 공식 자료를 바탕으로 계산 규칙을 검토하지만, 법령 변경이나 자료 갱신
              시차로 오류가 발생할 수 있습니다. 오류를 확인하면 가능한 빠르게 정정하고 기준
              페이지의 검토일을 갱신합니다.
            </p>
          </section>
          <section>
            <h2>4. 저작권과 사용 제한</h2>
            <p>
              사이트의 코드와 콘텐츠는 저작권자의 별도 허락 없이 상업적 이용, 재배포, 판매,
              수정본 배포를 할 수 없습니다. 원본 저장소의 사용 조건이 우선 적용됩니다.
            </p>
          </section>
          <section>
            <h2>5. 문의</h2>
            <p>
              이용과 오류 정정 문의는
              {" "}
              <a href="mailto:ghunsik.kim@gmail.com">ghunsik.kim@gmail.com</a>으로 보내 주세요.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
