import { AnnualStandards } from "@/app/components/AnnualStandards";
import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorPanel } from "./components/CalculatorPanel";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { calculators, groups, updates, VERIFIED_AT } from "@/lib/site-content";

export const metadata: Metadata = {
  title: { absolute: "월급연구소 | 실수령액·연말정산·퇴직금 계산기 (2026·2027)" },
  description:
    "세전 월급의 실수령액, 연말정산 환급액, 퇴직금, 실업급여, 연차와 수당을 2026·2027년 기준으로 계산하고 계산 과정을 함께 보여줍니다.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="wrap">
        <div className="page-head">
          <h1>월급 실수령액 계산기</h1>
          <p className="lead">
            세전 월급이나 연봉을 입력하면 급여 귀속월에 맞춰 4대보험과 세금을 뺀 금액을 보여줍니다.
          </p>
          <p className="basis">
            2026년 1월 ~ 2027년 6월 급여 · {VERIFIED_AT.replaceAll("-", ".")} 확인
          </p>
          <nav className="calculator-shortcuts" aria-label="계산기 바로가기">
            <Link href="/calculators/year-end-tax">연말정산 환급액 계산</Link>
            <a href="#calculators">전체 계산기 보기</a>
          </nav>
        </div>

        <CalculatorPanel slug="salary" compact />

        <section className="block" id="calculators">
          <h2>계산기 전체</h2>
          <div className="tool-groups">
            {groups.map((group) => (
              <div className="tool-group" key={group}>
                <h3>{group}</h3>
                <ul className="tool-list">
                  {calculators
                    .filter((item) => item.group === group)
                    .map((calculator) => (
                      <li key={calculator.slug}>
                        <Link href={`/calculators/${calculator.slug}`}>
                          <strong>
                            {calculator.shortTitle}
                            {calculator.isNew ? <span className="tag-new">새로 추가</span> : null}
                          </strong>
                          <span>{calculator.question}</span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="block">
          <h2>2027년에 바뀌는 숫자</h2>
          <p>
            ‘변경’은 2026년과 달라진 값입니다. 2027년 적용 근거를 확인 중인 항목에는
            계산에 사용한 기준을 함께 적었습니다.
          </p>
          <AnnualStandards />
          <Link className="more-link" href="/standards">
            적용 기준과 출처 전체 보기
          </Link>
        </section>

        <section className="block">
          <h2>업데이트</h2>
          <ul className="updates">
            {updates.map((item) => (
              <li key={item.date}>
                <time dateTime={item.date}>{item.date.replaceAll("-", ".")}</time>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
