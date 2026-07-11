import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteHeader } from "@/app/components/SiteHeader";

export const metadata: Metadata = {
  title: "계산 검증 방법",
  description: "월급연구소가 공식 기준을 확인하고 계산 규칙과 예상치의 한계를 공개하는 방법",
  alternates: { canonical: "/methodology" },
};

const principles = [
  {
    index: "01",
    title: "정책을 숫자가 아닌 기간으로 관리합니다.",
    body: "요율과 상·하한에는 효력 시작일과 종료일, 공식 출처, 마지막 검토일을 함께 기록합니다. 입력한 날짜에 맞는 정책만 선택합니다.",
  },
  {
    index: "02",
    title: "계산 엔진과 화면을 분리합니다.",
    body: "각 계산은 입력과 결과가 분명한 순수 함수로 작성합니다. 화면이 바뀌어도 계산 규칙은 독립적으로 검증할 수 있습니다.",
  },
  {
    index: "03",
    title: "경계값부터 시험합니다.",
    body: "국민연금 6월/7월 경계, 정확히 1년 근무, 월말 3개월 역산, 단시간 근로자의 실업급여 하한처럼 오류가 자주 나는 조건을 먼저 확인합니다.",
  },
  {
    index: "04",
    title: "확정할 수 없는 값은 확정적으로 말하지 않습니다.",
    body: "간이세액표, 회사 신고 보수, 개근·휴직 조건처럼 추가 정보가 필요한 항목은 예상치와 가정을 함께 표시합니다.",
  },
];

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="document-hero methodology-hero section-shell">
          <span className="section-kicker">VERIFICATION METHOD</span>
          <h1>좋은 계산기는<br />답보다 과정을 숨기지 않습니다.</h1>
          <p>
            PAYLAB은 법적 확정액을 약속하지 않습니다. 대신 어떤 공식 자료를, 어느
            기간에, 어떤 가정으로 적용했는지 확인할 수 있게 만듭니다.
          </p>
        </section>

        <section className="principles section-shell">
          {principles.map((principle) => (
            <article key={principle.index}>
              <span>{principle.index}</span>
              <h2>{principle.title}</h2>
              <p>{principle.body}</p>
            </article>
          ))}
        </section>

        <section className="method-boundary section-shell">
          <div>
            <span className="section-kicker">KNOWN BOUNDARY</span>
            <h2>실수령액의 소득세는<br />‘예상’으로 분리합니다.</h2>
          </div>
          <div>
            <p>
              실제 월 원천징수액은 근로소득 간이세액표와 회사의 80%·100%·120% 선택,
              가족 조건 등에 따라 달라집니다. 현재 계산기는 연간 세액을 단순화해 월
              예상치로 나누며, 급여명세서와 차이가 날 수 있음을 결과에 표시합니다.
            </p>
            <p>
              4대보험도 신고된 기준소득월액과 보수월액, 가입 예외, 정산 때문에 실제
              고지액과 차이가 날 수 있습니다.
            </p>
          </div>
        </section>

        <section className="method-cta section-shell">
          <h2>이제 직접 계산해 보세요.</h2>
          <p>결과의 가정과 경고까지 확인하는 데 10초면 충분합니다.</p>
          <Link href="/#quick-calculator">실수령액 계산하기 →</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
