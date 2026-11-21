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

  const related = calculator.related.map((item) => calculatorBySlug[item]);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="wrap">
        <div className="page-head">
          <nav className="crumbs" aria-label="현재 위치">
            <Link href="/">홈</Link> › <Link href="/#calculators">계산기</Link> ›{" "}
            <span aria-current="page">{calculator.shortTitle}</span>
          </nav>
          <h1>{calculator.title}</h1>
          <p className="lead">{calculator.description}</p>
          <p className="basis">
            {calculator.basis} · {VERIFIED_AT.replaceAll("-", ".")} 확인
          </p>
        </div>

        <CalculatorPanel slug={calculator.slug} />

        <section className="block">
          <h2>어떻게 계산하나요</h2>
          <div className="prose">
            {calculator.how.map((item) => (
              <div key={item.heading}>
                <h3>{item.heading}</h3>
                {item.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {item.formula ? <p className="formula">{item.formula}</p> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="block">
          <h2>근거 자료</h2>
          <ul className="source-list">
            {calculator.sources.map((source) => (
              <li key={source.href}>
                <a href={source.href} target="_blank" rel="noreferrer">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
          <Link className="more-link" href="/methodology">
            계산 방법과 한계 전체 보기
          </Link>
        </section>

        {related.length ? (
          <section className="block">
            <h2>같이 많이 찾는 계산기</h2>
            <ul className="tool-list">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={`/calculators/${item.slug}`}>
                    <strong>{item.title}</strong>
                    <span>{item.question}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
