import Link from "next/link";
import { calculators } from "@/lib/site-content";

const navigation = [
  { href: "/#calculators", label: "계산기" },
  { href: "/standards", label: "2026 기준" },
  { href: "/methodology", label: "검증 방법" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        본문 바로가기
      </a>
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="PAYLAB 월급연구소 홈">
          <span className="brand-mark" aria-hidden="true">
            PL
          </span>
          <span className="brand-copy">
            <strong>PAYLAB</strong>
            <small>월급연구소</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="주요 메뉴">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-meta" aria-label="기준 상태">
          <span className="status-dot" aria-hidden="true" />
          2026.07 검증
        </div>

        <details className="mobile-menu">
          <summary>메뉴</summary>
          <div className="mobile-menu-panel">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <span className="mobile-menu-label">계산기 바로가기</span>
            {calculators.map((calculator) => (
              <Link key={calculator.slug} href={`/calculators/${calculator.slug}`}>
                {calculator.shortTitle}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
