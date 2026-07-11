import type { Metadata } from "next";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteHeader } from "@/app/components/SiteHeader";
import { coreStandards, VERIFIED_AT } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "2026년 급여·보험·수당 기준",
  description: "월급연구소 계산기에 적용한 2026년 최저임금, 4대보험, 실업급여 기준과 공식 출처",
  alternates: { canonical: "/standards" },
};

const standards = [
  {
    category: "임금",
    title: "2026년 최저임금",
    value: "시간당 10,320원",
    detail: "8시간 일급 82,560원 · 월 209시간 2,156,880원",
    effective: "2026.01.01—12.31",
    source: "https://www.minimumwage.go.kr/customer/notice/view.do?bultnId=4657",
  },
  {
    category: "사회보험",
    title: "국민연금 근로자 부담",
    value: "기준소득월액의 4.75%",
    detail: "2026.1~6: 40만~637만원 · 2026.7~12: 41만~659만원",
    effective: "2026.07 상·하한 변경",
    source: "https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0038M0.do?menuId=MN24001113&tab=tab5",
  },
  {
    category: "사회보험",
    title: "건강보험 근로자 부담",
    value: "보수월액의 3.595%",
    detail: "총 보험료율 7.19%, 근로자와 사용자가 절반씩 부담",
    effective: "2026.01.01—",
    source: "https://www.law.go.kr/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1001023443",
  },
  {
    category: "사회보험",
    title: "장기요양보험",
    value: "건강보험료의 약 13.14%",
    detail: "공식식: 건강보험료 × 0.9448% ÷ 7.19%",
    effective: "2026.01.01—",
    source: "https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html",
  },
  {
    category: "사회보험",
    title: "고용보험 근로자 부담",
    value: "보수의 0.9%",
    detail: "실업급여 보험료 총 1.8% 중 근로자 부담분",
    effective: "2026년 현재",
    source: "https://law.go.kr/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1000630708",
  },
  {
    category: "퇴사",
    title: "구직급여 상·하한",
    value: "상한 68,100원 / 일",
    detail: "하한은 최저임금 × 80% × 1일 소정근로시간",
    effective: "2026.01.01 이후 이직자",
    source: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=18736",
  },
];

export default function StandardsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="document-hero section-shell">
          <span className="section-kicker">POLICY INDEX / 2026</span>
          <h1>계산에 쓰인 숫자를<br />한곳에 모았습니다.</h1>
          <p>
            같은 2026년이라도 적용 월과 이직일에 따라 기준이 달라집니다. PAYLAB은
            효력일을 계산 규칙과 함께 관리합니다.
          </p>
          <div className="document-meta">
            <span>최종 검토 {VERIFIED_AT.replaceAll("-", ".")}</span>
            <span>공식 1차 자료 기준</span>
            <span>정책 버전 2026.07.11</span>
          </div>
        </section>

        <section className="standards-list section-shell">
          {standards.map((standard, index) => (
            <article className="standard-row" key={standard.title}>
              <span className="standard-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <span className="standard-category">{standard.category}</span>
                <h2>{standard.title}</h2>
                <p>{standard.detail}</p>
              </div>
              <div className="standard-value">
                <strong>{standard.value}</strong>
                <span>{standard.effective}</span>
              </div>
              <a href={standard.source} target="_blank" rel="noreferrer" aria-label={`${standard.title} 공식 출처`}>
                공식 출처 ↗
              </a>
            </article>
          ))}
        </section>

        <section className="standards-note section-shell">
          <h2>요율이 같아도 실제 공제액은 다를 수 있습니다.</h2>
          <p>
            국민연금 기준소득월액, 건강보험 보수월액, 가입 예외, 정산과 원 단위 처리에
            따라 급여명세서의 고지액과 예상 결과가 달라질 수 있습니다. 이 페이지는
            계산기에 사용한 기준을 투명하게 공개하기 위한 자료입니다.
          </p>
          <div className="standards-mini-grid">
            {coreStandards.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.note}</small>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
