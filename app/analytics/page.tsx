import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteHeader } from "@/app/components/SiteHeader";
import { getAnalyticsDashboard } from "@/lib/analytics-db";
import styles from "./analytics.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "이용 현황",
  robots: { index: false, follow: false },
};

const OWNER_EMAIL = "kim.ghunsik@gmail.com";

const formatCount = (value: number) => value.toLocaleString("ko-KR");

function EmptyRows({ label }: { label: string }) {
  return <p className={styles.empty}>{label} 데이터가 아직 없습니다.</p>;
}

export default async function AnalyticsPage() {
  const user = await requireChatGPTUser("/analytics");
  if (user.email.toLowerCase() !== OWNER_EMAIL) notFound();

  const dashboard = await getAnalyticsDashboard(30);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className={`${styles.page} section-shell`}>
        <header className={styles.hero}>
          <div>
            <span className="section-kicker">OWNER / ANALYTICS</span>
            <h1>이용 현황</h1>
            <p>
              최근 {dashboard.periodDays}일의 페이지 조회와 계산 완료 횟수입니다.
              개인 식별 정보와 계산기 입력값은 저장하지 않습니다.
            </p>
          </div>
          <a className={styles.signout} href={chatGPTSignOutPath("/")}>로그아웃</a>
        </header>

        <section className={styles.metrics} aria-label="핵심 지표">
          <article><span>30일 페이지 조회</span><strong>{formatCount(dashboard.totals.pageview)}</strong></article>
          <article><span>30일 계산 완료</span><strong>{formatCount(dashboard.totals.calculation)}</strong></article>
          <article><span>오늘 페이지 조회</span><strong>{formatCount(dashboard.today.pageview)}</strong></article>
          <article><span>오늘 계산 완료</span><strong>{formatCount(dashboard.today.calculation)}</strong></article>
        </section>

        <p className={styles.notice}>
          이 수치는 고유 방문자 수가 아닙니다. 새로고침과 반복 계산을 포함한 익명 이용 횟수입니다.
        </p>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><span>DAILY</span><h2>일자별 추이</h2></div>
              <small>한국시간 기준</small>
            </div>
            {dashboard.daily.length ? (
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>날짜</th><th>페이지 조회</th><th>계산 완료</th></tr></thead>
                  <tbody>
                    {dashboard.daily.map((row) => (
                      <tr key={row.day}>
                        <td>{row.day}</td>
                        <td>{formatCount(row.pageviews)}</td>
                        <td>{formatCount(row.calculations)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyRows label="일자별" />}
          </section>

          <div className={styles.sidePanels}>
            <section className={styles.panel}>
              <div className={styles.panelHeading}><div><span>PAGES</span><h2>많이 본 페이지</h2></div></div>
              {dashboard.pagePaths.length ? (
                <ol className={styles.ranking}>
                  {dashboard.pagePaths.map((row) => <li key={row.path}><code>{row.path}</code><strong>{formatCount(row.total)}</strong></li>)}
                </ol>
              ) : <EmptyRows label="페이지" />}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeading}><div><span>CALCULATORS</span><h2>계산기 사용</h2></div></div>
              {dashboard.calculators.length ? (
                <ol className={styles.ranking}>
                  {dashboard.calculators.map((row) => <li key={row.path}><code>{row.path.replace("/calculators/", "")}</code><strong>{formatCount(row.total)}</strong></li>)}
                </ol>
              ) : <EmptyRows label="계산기" />}
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
