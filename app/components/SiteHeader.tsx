import Link from "next/link";
import { calculatorBySlug, headerCalculators } from "@/lib/site-content";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        본문 바로가기
      </a>
      <div className="wrap header-row">
        <Link className="logo" href="/">
          월급연구소<span>PAYLAB</span>
        </Link>
        <nav className="main-nav" aria-label="주요 메뉴">
          {headerCalculators.map((slug) => (
            <Link key={slug} href={`/calculators/${slug}`}>
              {calculatorBySlug[slug].shortTitle}
            </Link>
          ))}
          <Link className="nav-sub" href="/#calculators">
            전체 계산기
          </Link>
          <Link className="nav-sub" href="/standards">
            적용 기준
          </Link>
        </nav>
      </div>
    </header>
  );
}
