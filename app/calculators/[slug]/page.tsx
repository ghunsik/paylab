import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalculatorPanel } from "@/app/components/CalculatorPanel";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteHeader } from "@/app/components/SiteHeader";
import {
  calculatorBySlug,
  calculators,
  type CalculatorSlug,
  EFFECTIVE_LABEL,
  VERIFIED_AT,
} from "@/lib/site-content";

export function generateStaticParams() {
  return calculators.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = calculatorBySlug[slug as CalculatorSlug];
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/calculators/${meta.slug}` },
    openGraph: {
      title: `${meta.title} | 월급연구소`,
      description: meta.description,
      url: `/calculators/${meta.slug}`,
    },
  };
}

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const calculator = calculatorBySlug[slug as CalculatorSlug];
  if (!calculator) notFound();

  const related = calculators.filter(
    (item) => item.group === calculator.group && item.slug !== calculator.slug,
  );

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="route-hero section-shell">
          <nav className="breadcrumbs" aria-label="현재 위치">
            <Link href="/">홈</Link>
            <span aria-hidden="true">/</span>
            <Link href="/#calculators">계산기</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{calculator.shortTitle}</span>
          </nav>
          <div className="route-hero-grid">
            <div>
              <div className="eyebrow">
                <span className="status-dot" aria-hidden="true" />
                {EFFECTIVE_LABEL} · 최종 검토 {VERIFIED_AT.replaceAll("-", ".")}
              </div>
              <span className="route-index">{calculator.index}</span>
              <h1>{calculator.title}</h1>
              <p>{calculator.description}</p>
            </div>
            <aside className="route-note">
              <strong>결과를 읽는 법</strong>
              <p>
                이 계산기는 법적 확정액이 아닌 예상 도구입니다. 결과 아래의 가정과 제외
                조건을 함께 확인해 주세요.
              </p>
            </aside>
          </div>
        </section>

        <section className="route-calculator section-shell">
          <CalculatorPanel slug={calculator.slug} />
        </section>

        <section className="source-section section-shell">
          <div className="section-heading split-heading">
            <div>
              <span className="section-kicker">SOURCES &amp; METHOD</span>
              <h2>이 계산의 근거</h2>
            </div>
            <p>법 이름만 적지 않고 실제 확인한 정부·공단 자료로 연결합니다.</p>
          </div>
          <div className="source-grid">
            <div className="source-list">
              {calculator.sources.map((source, index) => (
                <a href={source.href} target="_blank" rel="noreferrer" key={source.href}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{source.label}</strong>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
            <div className="method-summary">
              <strong>PAYLAB 원칙</strong>
              <ul>
                <li>효력일이 있는 정책은 입력한 날짜에 맞춰 선택</li>
                <li>입력 오류와 적용 제외 조건을 결과에서 경고</li>
                <li>실제 명세서와 달라질 수 있는 항목은 예상치로 표시</li>
              </ul>
              <Link href="/methodology">전체 검증 방법 →</Link>
            </div>
          </div>
        </section>

        {related.length ? (
          <section className="related-tools section-shell">
            <div className="section-heading">
              <span className="section-kicker">RELATED TOOLS</span>
              <h2>함께 보면 좋은 계산기</h2>
            </div>
            <div className="related-grid">
              {related.map((item) => (
                <Link href={`/calculators/${item.slug}`} key={item.slug}>
                  <span>{item.index}</span>
                  <strong>{item.shortTitle}</strong>
                  <p>{item.question}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
