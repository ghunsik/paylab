import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">PAYLAB 월급연구소</div>
          <p>
            계산은 브라우저 안에서 처리되며 입력한 급여 정보는 서버에 저장하지 않습니다.
          </p>
        </div>
        <div className="footer-links" aria-label="하단 메뉴">
          <Link href="/standards">2026 기준</Link>
          <Link href="/methodology">검증 방법</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
        </div>
        <div className="footer-contact">
          <span>오류 제보·문의</span>
          <a href="mailto:ghunsik.kim@gmail.com">ghunsik.kim@gmail.com</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Ghunsik Kim</span>
        <span>예상 계산 결과는 법적 확정액이 아닙니다.</span>
      </div>
    </footer>
  );
}
