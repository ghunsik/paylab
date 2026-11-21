import type { Metadata } from "next";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteHeader } from "@/app/components/SiteHeader";
import { POLICY_2026, POLICY_2027, POLICY_VERSION } from "@/lib/policy";
import { standardRows, updates, VERIFIED_AT } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "적용 기준: 2026·2027년 최저임금, 4대보험, 연말정산",
  description:
    "월급연구소 계산기에 쓰는 2026년·2027년 최저임금, 4대보험료율, 구직급여 상·하한, 연말정산 공제 기준과 출처를 모았습니다.",
  alternates: { canonical: "/standards" },
};

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

const pensionBases = [
  ...POLICY_2026.insurance.nationalPension.basePeriods,
  ...POLICY_2027.insurance.nationalPension.basePeriods,
];

const yearEndRows: Array<{ label: string; value: string; note?: string }> = [
  {
    label: "자녀 세액공제",
    value: "1명 25만원, 2명 55만원, 3명부터 1명당 40만원 추가",
    note: "2016년 12월 31일 이전 출생 자녀가 대상입니다. 2025년 귀속까지는 8세 이상이었습니다.",
  },
  {
    label: "신용카드 등 소득공제",
    value: "총급여의 25% 초과분에 신용카드 15%, 체크카드·현금영수증 30%, 전통시장·대중교통 40%",
    note: "기본 한도 300만원(총급여 7,000만원 초과는 250만원). 자녀 1명당 50만원(25만원)씩, 2명까지 한도가 늘어납니다.",
  },
  {
    label: "의료비 세액공제",
    value: "총급여의 3% 초과분의 15%",
    note: "본인·65세 이상·장애인 외 가족은 연 700만원 한도",
  },
  { label: "교육비 세액공제", value: "15%" },
  { label: "보장성 보험료 세액공제", value: "12%, 연 100만원 한도" },
  { label: "기부금 세액공제", value: "15%, 1,000만원 초과분 30%" },
  {
    label: "고향사랑기부금",
    value: "10만원까지 전액, 10만~20만원 40%, 20만원 초과 15%",
    note: "10만~20만원 구간은 2026년부터 15%에서 40%로 올랐습니다.",
  },
  {
    label: "월세 세액공제",
    value: "15%(총급여 5,500만원 이하 17%), 연 1,000만원 한도",
    note: "총급여 8,000만원 이하 무주택 세대주",
  },
  {
    label: "연금계좌 세액공제",
    value: "12%(총급여 5,500만원 이하 15%)",
    note: "연금저축 600만원, IRP와 합쳐 900만원 한도",
  },
  {
    label: "주택청약·전세대출",
    value: "납입액·상환액의 40% 소득공제, 합쳐서 연 400만원 한도",
    note: "주택청약은 연 300만원 납입분까지, 총급여 7,000만원 이하",
  },
  { label: "결혼 세액공제", value: "50만원", note: "2026년 혼인신고분까지 적용됩니다." },
  { label: "표준 세액공제", value: "13만원", note: "항목별 공제를 받지 않을 때" },
];

const sources = [...POLICY_2026.sources, ...POLICY_2027.sources];

export default function StandardsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="wrap">
        <div className="page-head">
          <h1>적용 기준</h1>
          <p className="lead">
            계산기에 들어 있는 숫자와 출처입니다. 같은 해라도 급여 귀속월이나 퇴사일에
            따라 적용되는 값이 다릅니다.
          </p>
          <p className="basis">
            {VERIFIED_AT.replaceAll("-", ".")} 확인 · 기준 데이터 {POLICY_VERSION}
          </p>
        </div>

        <section className="block">
          <h2>최저임금·4대보험·구직급여</h2>
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
        </section>

        <section className="block">
          <h2>국민연금 기준소득월액</h2>
          <p>
            국민연금은 이 범위 안의 금액에만 요율을 곱합니다. 해마다 7월에 바뀝니다.
          </p>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">적용 기간</th>
                  <th scope="col">하한</th>
                  <th scope="col">상한</th>
                </tr>
              </thead>
              <tbody>
                {pensionBases.map((period) => (
                  <tr key={period.fromMonth}>
                    <th scope="row">
                      {period.fromMonth.replace("-", ".")} ~ {period.toMonth.replace("-", ".")}
                    </th>
                    <td className="num">{won(period.minimum)}</td>
                    <td className="num">{won(period.maximum)}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">2027.07 이후</th>
                  <td className="num" colSpan={2}>
                    아직 고시되지 않았습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="block">
          <h2>2027년 기준 가운데 아직 정해지지 않은 것</h2>
          <ul className="source-list">
            {POLICY_2027.pending.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="block">
          <h2>연말정산 (2026년 귀속)</h2>
          <p>2027년 1~2월에 하는 연말정산에 적용되는 기준입니다.</p>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col">기준</th>
                </tr>
              </thead>
              <tbody>
                {yearEndRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>
                      {row.value}
                      {row.note ? <small>{row.note}</small> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="block">
          <h2>출처</h2>
          <ul className="source-list">
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="https://www.korea.kr/news/policyNewsView.do?newsId=148974171"
                target="_blank"
                rel="noreferrer"
              >
                국세청 2026년 귀속 연말정산 미리보기 안내
              </a>
            </li>
          </ul>
        </section>

        <section className="block">
          <h2>고친 기록</h2>
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
