import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorPanel } from "./components/CalculatorPanel";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import {
  calculators,
  coreStandards,
  EFFECTIVE_LABEL,
  groups,
  VERIFIED_AT,
} from "@/lib/site-content";

export const metadata: Metadata = {
  title: { absolute: "월급연구소 | 2026 급여·퇴직·수당 계산기" },
  description:
    "2026년 공식 기준으로 월급·연봉 실수령액, 퇴직금, 실업급여, 연차와 수당의 예상액과 계산 근거를 함께 확인하세요.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="home-hero">
          <div className="hero-grid-overlay" aria-hidden="true" />
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="status-dot" aria-hidden="true" />
                {EFFECTIVE_LABEL} · 공식 자료 확인
              </div>
              <h1>
                받을 돈을,
                <br />
                <em>근거까지.</em>
              </h1>
              <p>
                급여부터 퇴직, 수당까지. 예상 금액만 던지지 않고 어떤 기준과 가정을
                썼는지 계산 과정까지 함께 보여드립니다.
              </p>
              <div className="hero-actions">
                <a className="text-link" href="#quick-calculator">
                  바로 계산하기 <span aria-hidden="true">↓</span>
                </a>
                <Link className="text-link muted" href="/methodology">
                  검증 방법 보기
                </Link>
              </div>
            </div>

            <aside className="standards-board" aria-label="2026년 핵심 기준">
              <div className="board-heading">
                <span>POLICY BOARD</span>
                <span>2026 / 07</span>
              </div>
              {coreStandards.map((item, index) => (
                <div className="board-row" key={item.label}>
                  <span className="board-index">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.note}</small>
                  </div>
                  <b>{item.value}</b>
                </div>
              ))}
              <div className="board-footer">
                최종 검토 {VERIFIED_AT.replaceAll("-", ".")}
                <Link href="/standards">전체 기준 →</Link>
              </div>
            </aside>
          </div>
        </section>

        <section className="quick-calculator section-shell" id="quick-calculator">
          <div className="section-heading split-heading">
            <div>
              <span className="section-kicker">QUICK CALCULATION</span>
              <h2>10초 실수령액 계산</h2>
            </div>
            <p>
              총요율과 근로자 부담률을 구분하고, 국민연금 기준소득 상·하한을 귀속월에
              맞춰 반영합니다.
            </p>
          </div>
          <CalculatorPanel slug="salary" compact />
        </section>

        <section className="trust-rail" aria-label="서비스 원칙">
          <div>
            <span>01</span>
            <strong>브라우저 안에서 계산</strong>
            <p>입력한 급여 정보는 서버에 저장하지 않습니다.</p>
          </div>
          <div>
            <span>02</span>
            <strong>기준일과 출처 공개</strong>
            <p>법령과 공단 자료의 효력일을 정책 데이터로 관리합니다.</p>
          </div>
          <div>
            <span>03</span>
            <strong>예상치의 한계 표시</strong>
            <p>정산·가입 예외 등 반영하지 않은 조건을 결과 옆에 밝힙니다.</p>
          </div>
        </section>

        <section className="all-calculators section-shell" id="calculators">
          <div className="section-heading split-heading">
            <div>
              <span className="section-kicker">ALL TOOLS</span>
              <h2>필요한 순간으로 찾기</h2>
            </div>
            <p>급여를 확인할 때, 퇴사를 준비할 때, 휴가와 수당이 궁금할 때.</p>
          </div>

          <div className="tool-groups">
            {groups.map((group) => (
              <div className="tool-group" key={group}>
                <div className="tool-group-heading">
                  <span>{group}</span>
                  <span>{calculators.filter((item) => item.group === group).length} tools</span>
                </div>
                {calculators
                  .filter((item) => item.group === group)
                  .map((calculator) => (
                    <Link
                      className="tool-card"
                      href={`/calculators/${calculator.slug}`}
                      key={calculator.slug}
                    >
                      <span className="tool-index">{calculator.index}</span>
                      <div>
                        <strong>{calculator.shortTitle}</strong>
                        <p>{calculator.question}</p>
                      </div>
                      <span className="tool-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </Link>
                  ))}
              </div>
            ))}
          </div>
        </section>

        <section className="editorial-section section-shell">
          <div className="editorial-card accent-card">
            <span className="section-kicker">WHAT CHANGED</span>
            <h2>2026년, 숫자보다 중요한 건 적용 시점입니다.</h2>
            <p>
              국민연금 기준소득월액은 7월부터 41만~659만원으로 바뀌고, 구직급여 상한은
              1월 1일 이후 이직자부터 하루 68,100원이 적용됩니다.
            </p>
            <Link href="/standards">2026 기준 한눈에 보기 →</Link>
          </div>
          <div className="editorial-card dark-card">
            <span className="section-kicker">OUR METHOD</span>
            <h2>“정확하다”보다, 무엇을 계산했는지 설명합니다.</h2>
            <p>
              결과마다 사용한 공식과 포함·제외 조건을 함께 제공합니다. 소득세처럼 실제
              고지액과 차이가 날 수 있는 항목은 추정치로 분리합니다.
            </p>
            <Link href="/methodology">계산 원칙 확인하기 →</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
