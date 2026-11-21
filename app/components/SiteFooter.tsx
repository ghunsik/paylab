import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-row">
        <div>
          <p>
            계산 결과는 참고용 예상치이며 법적으로 확정된 금액이 아닙니다.
          </p>
          <p>입력한 값은 브라우저 안에서만 계산하고 서버에 저장하지 않습니다.</p>
          <p>
            오류 제보·문의 <a href="mailto:ghunsik.kim@gmail.com">ghunsik.kim@gmail.com</a>
          </p>
          <p>© 2026 Ghunsik Kim</p>
        </div>
        <nav className="footer-links" aria-label="하단 메뉴">
          <Link href="/standards">적용 기준</Link>
          <Link href="/methodology">계산 방법</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
        </nav>
      </div>
    </footer>
  );
}
