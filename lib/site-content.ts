export const SITE_NAME = "PAYLAB 월급연구소";
export const SITE_DESCRIPTION =
  "2026년 공식 기준으로 급여·퇴직·수당 예상액과 계산 근거를 함께 확인하는 직장인 계산 도구";
export const VERIFIED_AT = "2026-07-11";
export const EFFECTIVE_LABEL = "2026년 7월 기준";

export type CalculatorSlug =
  | "salary"
  | "hourly"
  | "severance"
  | "unemployment"
  | "annual-leave"
  | "weekly-holiday"
  | "shutdown";

export type CalculatorMeta = {
  slug: CalculatorSlug;
  index: string;
  group: "급여" | "퇴사" | "휴가·수당";
  title: string;
  shortTitle: string;
  description: string;
  question: string;
  resultLabel: string;
  sources: Array<{ label: string; href: string }>;
};

export const calculators: CalculatorMeta[] = [
  {
    slug: "salary",
    index: "01",
    group: "급여",
    title: "연봉·월급 실수령액 계산기",
    shortTitle: "실수령액",
    question: "세전 급여, 실제로 얼마 들어올까?",
    description:
      "월급 또는 연봉에서 근로자 부담 4대보험과 예상 세금을 빼고, 공제 과정을 항목별로 보여드립니다.",
    resultLabel: "예상 월 실수령액",
    sources: [
      {
        label: "국민연금 보험료율",
        href: "https://m.nps.or.kr/pnsinfo/ntpsklg/getOHAF0016M0.do?menuId=MN24001108",
      },
      {
        label: "국민연금 기준소득월액",
        href: "https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0038M0.do?menuId=MN24001113&tab=tab5",
      },
      {
        label: "건강·장기요양보험 기준",
        href: "https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html",
      },
    ],
  },
  {
    slug: "hourly",
    index: "02",
    group: "급여",
    title: "시급·최저임금 계산기",
    shortTitle: "시급·최저임금",
    question: "내 시급을 월급으로 바꾸면 얼마일까?",
    description:
      "주 소정근로시간과 주휴 조건을 반영해 월 환산 급여를 계산하고 2026년 최저임금 충족 여부를 확인합니다.",
    resultLabel: "예상 월 급여",
    sources: [
      {
        label: "2026년 적용 최저임금",
        href: "https://www.minimumwage.go.kr/customer/notice/view.do?bultnId=4657",
      },
      {
        label: "근로기준법 제55조",
        href: "https://www.law.go.kr/lsLinkCommonInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1015677471",
      },
    ],
  },
  {
    slug: "severance",
    index: "03",
    group: "퇴사",
    title: "퇴직금 계산기",
    shortTitle: "퇴직금",
    question: "퇴직할 때 받을 금액은 얼마일까?",
    description:
      "계속근로기간과 퇴직 전 3개월 평균임금을 기준으로 예상 퇴직금을 계산합니다.",
    resultLabel: "예상 퇴직금",
    sources: [
      {
        label: "고용노동부 퇴직금 계산기",
        href: "https://www.moel.go.kr/retirementpayCal.do",
      },
      {
        label: "근로자퇴직급여 보장법",
        href: "https://www.law.go.kr/LSW/lsInfoP.do?ancNo=21475&ancYd=20260317&efYd=20260701&lsiSeq=284455",
      },
    ],
  },
  {
    slug: "unemployment",
    index: "04",
    group: "퇴사",
    title: "실업급여 계산기",
    shortTitle: "실업급여",
    question: "구직급여는 하루에 얼마, 총 며칠일까?",
    description:
      "평균임금, 1일 소정근로시간, 연령과 피보험기간을 반영해 구직급여 예상액을 계산합니다.",
    resultLabel: "1일 예상 구직급여",
    sources: [
      {
        label: "2026년 구직급여 상한액",
        href: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=18736",
      },
      {
        label: "고용보험법 제46조",
        href: "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=284449",
      },
    ],
  },
  {
    slug: "annual-leave",
    index: "05",
    group: "휴가·수당",
    title: "연차 발생일수 계산기",
    shortTitle: "연차",
    question: "지금까지 발생한 연차는 며칠일까?",
    description:
      "입사일과 기준일, 적용 조건을 확인해 법정 연차 발생일수를 예상합니다.",
    resultLabel: "예상 연차 발생일수",
    sources: [
      {
        label: "근로기준법 제60조",
        href: "https://law.go.kr/LSW/LsiJoLinkP.do?languageType=KO&lsNm=%EA%B7%BC%EB%A1%9C%EA%B8%B0%EC%A4%80%EB%B2%95&paras=1",
      },
      {
        label: "고용노동부 연차 행정해석",
        href: "https://www.moel.go.kr/news/enews/report/enewsView.do?bbs_id=12&news_seq=13052&pageIndex=1&searchField=3&searchText=",
      },
    ],
  },
  {
    slug: "weekly-holiday",
    index: "06",
    group: "휴가·수당",
    title: "주휴수당 계산기",
    shortTitle: "주휴수당",
    question: "이번 주 주휴수당은 얼마일까?",
    description:
      "시급, 주 소정근로시간과 개근 여부를 기준으로 주휴수당과 월 환산액을 계산합니다.",
    resultLabel: "주 1회 예상 주휴수당",
    sources: [
      {
        label: "고용노동부 주휴수당 안내",
        href: "https://www.moel.go.kr/mainpop2.do",
      },
      {
        label: "근로기준법 제55조",
        href: "https://www.law.go.kr/lsLinkCommonInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1015677471",
      },
    ],
  },
  {
    slug: "shutdown",
    index: "07",
    group: "휴가·수당",
    title: "휴업수당 계산기",
    shortTitle: "휴업수당",
    question: "회사 사정으로 쉰 날, 얼마를 받을까?",
    description:
      "평균임금의 70%와 통상임금을 비교해 예상 휴업수당을 계산합니다.",
    resultLabel: "예상 휴업수당 총액",
    sources: [
      {
        label: "근로기준법 제46조",
        href: "https://www.law.go.kr/법령/근로기준법/제46조",
      },
    ],
  },
];

export const calculatorBySlug = Object.fromEntries(
  calculators.map((calculator) => [calculator.slug, calculator]),
) as Record<CalculatorSlug, CalculatorMeta>;

export const groups = ["급여", "퇴사", "휴가·수당"] as const;

export const coreStandards = [
  { label: "최저시급", value: "10,320원", note: "월 209시간 2,156,880원" },
  { label: "국민연금", value: "근로자 4.75%", note: "2026.7 기준소득 41만~659만원" },
  { label: "건강보험", value: "근로자 3.595%", note: "총요율 7.19%" },
  { label: "고용보험", value: "근로자 0.9%", note: "실업급여 사업 기준" },
];
