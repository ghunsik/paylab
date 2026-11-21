import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorPanel } from "./components/CalculatorPanel";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { calculators, groups, standardRows, updates, VERIFIED_AT } from "@/lib/site-content";

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
            세전 월급이나 연봉을 넣으면 4대보험과 세금을 뺀 금액을 계산합니다. 2027년 1월부터
            오르는 국민연금·장기요양보험료도 급여 귀속월에 맞춰 반영합니다.
          </p>
          <p className="basis">
            2026년 1월 ~ 2027년 6월 급여 · {VERIFIED_AT.replaceAll("-", ".")} 확인
          </p>
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
            노란색으로 표시한 칸이 2026년과 달라지는 값입니다. 아직 정해지지 않은 항목은
            정해지는 대로 고칩니다.
          </p>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col">2026년</th>
                  <th scope="col">2027년</th>
                </tr>
              </thead>
              <tbody>
                {standardRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className="num">{row.y2026}</td>
                    <td className="num">
                      <span className={row.changed ? "changed" : undefined}>{row.y2027}</span>
                      {row.note ? <small>{row.note}</small> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
