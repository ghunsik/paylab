export const SITE_NAME = "월급연구소 PAYLAB";
export const SITE_DESCRIPTION =
  "월급 실수령액, 연말정산 환급액, 퇴직금, 실업급여, 연차와 수당을 2026·2027년 기준으로 계산하고 계산 과정을 함께 보여줍니다.";
export const VERIFIED_AT = "2026-11-21";

export type CalculatorSlug =
  | "salary"
  | "year-end-tax"
  | "hourly"
  | "severance"
  | "unemployment"
  | "annual-leave"
  | "weekly-holiday"
  | "shutdown";

export type CalculatorGroup = "급여·세금" | "퇴사" | "휴가·수당";

export type CalculatorMeta = {
  slug: CalculatorSlug;
  group: CalculatorGroup;
  title: string;
  shortTitle: string;
  description: string;
  /** 목록에서 제목 아래에 보이는 한 줄 */
  question: string;
  /** 계산기 제목 아래에 표시하는 적용 기준 */
  basis: string;
  isNew?: boolean;
  how: Array<{ heading: string; body: string[]; formula?: string }>;
  related: CalculatorSlug[];
  sources: Array<{ label: string; href: string }>;
};

export const calculators: CalculatorMeta[] = [
  {
    slug: "salary",
    group: "급여·세금",
    title: "월급·연봉 실수령액 계산기",
    shortTitle: "실수령액",
    question: "세전 월급이나 연봉에서 4대보험과 세금을 빼면 얼마가 남는지",
    description:
      "세전 월급이나 연봉을 넣으면 국민연금, 건강보험, 장기요양보험, 고용보험, 소득세를 뺀 금액을 항목별로 보여줍니다.",
    basis: "2026년 1월 ~ 2027년 6월 급여",
    how: [
      {
        heading: "4대보험",
        body: [
          "비과세 금액을 뺀 월 급여에 근로자 부담 요율을 곱합니다. 국민연금은 천 원 미만을 버린 뒤 기준소득월액 상·하한(2026년 7월부터 41만~659만원) 안에서 계산합니다.",
          "2027년 1월 급여부터 국민연금은 4.75%에서 5.0%로, 장기요양보험은 건강보험료의 13.14%에서 13.90%로 오릅니다. 건강보험 3.595%와 고용보험 0.9%는 그대로 적용했습니다.",
        ],
        formula:
          "국민연금 4.75%(2027년 5.0%) + 건강보험 3.595% + 장기요양(건강보험료 × 13.14%, 2027년 13.90%) + 고용보험 0.9%",
      },
      {
        heading: "소득세",
        body: [
          "월급을 12배 해서 1년 치 세금을 구한 다음 12로 나눕니다. 근로소득공제, 가족 수만큼의 기본공제, 4대보험료, 근로소득 세액공제, 자녀 세액공제를 반영합니다.",
          "회사가 실제로 떼는 금액은 국세청 간이세액표를 따르기 때문에 급여명세서와 조금 다를 수 있습니다. 지방소득세는 소득세의 10%입니다.",
        ],
      },
    ],
    related: ["year-end-tax", "hourly", "severance"],
    sources: [
      {
        label: "국민연금공단: 보험료율과 기준소득월액",
        href: "https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0038M0.do?menuId=MN24001113&tab=tab5",
      },
      {
        label: "국민건강보험공단: 2026년 건강·장기요양보험료율",
        href: "https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html",
      },
      {
        label: "보건복지부: 2027년 건강보험료율 결정(동결)",
        href: "https://www.korea.kr/policy/civilView.do?newsId=156780681",
      },
      {
        label: "보건복지부: 2027년 장기요양보험료율 결정",
        href: "https://www.korea.kr/news/policyNewsView.do?newsId=148974757",
      },
    ],
  },
  {
    slug: "year-end-tax",
    group: "급여·세금",
    title: "연말정산 환급액 계산기",
    shortTitle: "연말정산",
    question: "2026년 귀속 연말정산에서 돌려받을지, 더 낼지",
    description:
      "총급여와 카드 사용액, 의료비, 월세, 연금저축 등을 넣으면 2026년 귀속 연말정산의 결정세액과 예상 환급액을 계산합니다.",
    basis: "2026년 귀속(2027년 1~2월 정산)",
    isNew: true,
    how: [
      {
        heading: "계산 순서",
        body: [
          "총급여에서 근로소득공제와 각종 소득공제를 빼서 과세표준을 구하고, 세율을 곱해 산출세액을 냅니다. 여기서 세액공제를 뺀 금액이 결정세액입니다.",
          "1년 동안 급여에서 미리 뗀 세금이 결정세액보다 많으면 차액을 돌려받고, 적으면 더 냅니다.",
        ],
        formula: "환급액 = 이미 낸 세금 − 결정세액 (소득세와 지방소득세 합산)",
      },
      {
        heading: "신용카드 등 소득공제",
        body: [
          "카드와 현금영수증 사용액 가운데 총급여의 25%를 넘는 부분만 공제됩니다. 신용카드는 15%, 체크카드와 현금영수증은 30%, 전통시장과 대중교통은 40%입니다.",
          "25%를 채울 때는 공제율이 낮은 신용카드 사용액부터 채우는 것으로 계산합니다.",
        ],
      },
      {
        heading: "이미 낸 세금을 확인하는 곳",
        body: [
          "급여명세서의 소득세를 1월부터 12월까지 더하거나, 회사에서 받는 근로소득 원천징수영수증의 '기납부세액'을 보면 됩니다. 지방소득세는 빼고 소득세만 입력합니다.",
          "이 칸을 비워 두면 환급액 대신 결정세액만 보여줍니다.",
        ],
      },
    ],
    related: ["salary", "severance"],
    sources: [
      {
        label: "국세청: 근로소득 과세표준과 산출세액",
        href: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6594&cntntsId=7873",
      },
      {
        label: "국세청: 2026년 귀속 연말정산 미리보기 안내",
        href: "https://www.korea.kr/news/policyNewsView.do?newsId=148974171",
      },
      {
        label: "소득세법 (국가법령정보센터)",
        href: "https://www.law.go.kr/법령/소득세법",
      },
      {
        label: "조세특례제한법 (국가법령정보센터)",
        href: "https://www.law.go.kr/법령/조세특례제한법",
      },
    ],
  },
  {
    slug: "hourly",
    group: "급여·세금",
    title: "시급·최저임금 계산기",
    shortTitle: "시급·최저임금",
    question: "시급을 월급으로 바꾸면 얼마인지, 최저임금에 맞는지",
    description:
      "시급과 주 근로시간을 넣으면 주휴수당을 포함한 월 급여를 계산하고, 최저임금보다 낮은지 확인합니다.",
    basis: "최저임금 2026년 10,320원 · 2027년 10,700원",
    how: [
      {
        heading: "월 환산",
        body: [
          "주 40시간을 일하면 주휴 8시간을 더해 한 달 209시간으로 계산합니다. 주 40시간이 아니면 한 주의 유급시간에 1년 평균 주 수(365 ÷ 7 ÷ 12)를 곱합니다.",
          "주휴수당은 주 15시간 이상 일하고 정해진 근무일을 모두 나온 주에만 포함합니다.",
        ],
        formula: "월 급여 = 시급 × (주 근로시간 + 주휴시간) × 4.345주",
      },
      {
        heading: "포함하지 않는 것",
        body: ["연장·야간·휴일근로 가산수당과 세금·4대보험 공제는 계산하지 않습니다."],
      },
    ],
    related: ["weekly-holiday", "salary"],
    sources: [
      {
        label: "고용노동부: 2027년 적용 최저임금 고시",
        href: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19744",
      },
      {
        label: "최저임금위원회: 2026년 적용 최저임금",
        href: "https://www.minimumwage.go.kr/customer/notice/view.do?bultnId=4657",
      },
      {
        label: "근로기준법 제55조(휴일)",
        href: "https://www.law.go.kr/법령/근로기준법/제55조",
      },
    ],
  },
  {
    slug: "severance",
    group: "퇴사",
    title: "퇴직금 계산기",
    shortTitle: "퇴직금",
    question: "입사일과 퇴직일, 최근 3개월 급여로 예상 퇴직금 계산",
    description:
      "입사일과 퇴직일, 퇴직 전 3개월 급여를 넣으면 1일 평균임금과 예상 퇴직금을 계산합니다.",
    basis: "근로자퇴직급여 보장법 기준",
    how: [
      {
        heading: "계산식",
        body: [
          "퇴직 전 3개월 동안 받은 임금을 그 기간의 날짜 수로 나눈 값이 1일 평균임금입니다. 상여금과 연차수당은 1년 치의 3/12를 더합니다.",
          "1일 평균임금이 통상임금보다 적으면 통상임금으로 계산합니다.",
        ],
        formula: "퇴직금 = 1일 평균임금 × 30일 × (재직일수 ÷ 365)",
      },
      {
        heading: "받을 수 있는 조건",
        body: [
          "1년 이상 일했고 주 평균 근로시간이 15시간 이상이어야 합니다. 퇴직일은 마지막으로 일한 날의 다음 날로 넣습니다.",
        ],
      },
    ],
    related: ["unemployment", "annual-leave"],
    sources: [
      {
        label: "고용노동부 퇴직금 계산기",
        href: "https://www.moel.go.kr/retirementpayCal.do",
      },
      {
        label: "근로자퇴직급여 보장법",
        href: "https://www.law.go.kr/법령/근로자퇴직급여보장법",
      },
    ],
  },
  {
    slug: "unemployment",
    group: "퇴사",
    title: "실업급여 계산기",
    shortTitle: "실업급여",
    question: "구직급여를 하루에 얼마씩, 며칠 동안 받는지",
    description:
      "퇴직 전 평균임금과 나이, 고용보험 가입 기간을 넣으면 하루 구직급여와 받을 수 있는 날짜 수를 계산합니다.",
    basis: "2026년·2027년 퇴사자",
    how: [
      {
        heading: "하루 금액",
        body: [
          "퇴직 전 3개월 평균임금의 60%가 기본입니다. 여기에 상한액과 하한액이 있습니다.",
          "2026년 퇴사자는 상한이 하루 68,100원이고, 하한은 최저임금의 80%에 하루 근로시간을 곱한 금액(8시간이면 66,048원)입니다.",
          "2027년에는 최저임금이 올라 하한이 68,480원이 됩니다. 2027년 상한액은 아직 정해지지 않아 하한액으로 계산합니다.",
        ],
      },
      {
        heading: "받는 날짜 수",
        body: [
          "고용보험 가입 기간과 퇴직 당시 나이에 따라 120일에서 270일까지입니다. 50세 이상이거나 장애인이면 같은 가입 기간이라도 30일 더 깁니다(1년 미만 제외).",
        ],
      },
    ],
    related: ["severance", "salary"],
    sources: [
      {
        label: "고용노동부: 2026년 구직급여 상한액",
        href: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=18736",
      },
      {
        label: "고용노동부: 고용보험 제도개편 방안(2026.9)",
        href: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19866",
      },
      {
        label: "고용보험법 제46조(구직급여일액)",
        href: "https://www.law.go.kr/법령/고용보험법/제46조",
      },
    ],
  },
  {
    slug: "annual-leave",
    group: "휴가·수당",
    title: "연차 발생일수 계산기",
    shortTitle: "연차",
    question: "입사일 기준으로 지금까지 생긴 연차가 며칠인지",
    description: "입사일과 기준일을 넣으면 근로기준법에 따라 발생한 연차 일수를 계산합니다.",
    basis: "근로기준법 제60조 기준",
    how: [
      {
        heading: "입사 1년 미만",
        body: ["한 달을 개근할 때마다 1일씩, 최대 11일이 생깁니다."],
      },
      {
        heading: "입사 1년 이상",
        body: [
          "1년 동안 80% 이상 출근하면 15일이 생깁니다. 3년 차부터 2년마다 1일씩 늘어 최대 25일입니다.",
          "입사일을 기준으로 계산합니다. 회사가 회계연도(1월 1일) 기준으로 연차를 주면 날짜가 다를 수 있습니다.",
        ],
      },
      {
        heading: "적용되지 않는 경우",
        body: ["상시 근로자 5인 미만 사업장과 주 15시간 미만 근로자에게는 법정 연차가 없습니다."],
      },
    ],
    related: ["weekly-holiday", "severance"],
    sources: [
      {
        label: "근로기준법 제60조(연차 유급휴가)",
        href: "https://www.law.go.kr/법령/근로기준법/제60조",
      },
      {
        label: "고용노동부 연차휴가 행정해석",
        href: "https://www.moel.go.kr/news/enews/report/enewsView.do?bbs_id=12&news_seq=13052&pageIndex=1&searchField=3&searchText=",
      },
    ],
  },
  {
    slug: "weekly-holiday",
    group: "휴가·수당",
    title: "주휴수당 계산기",
    shortTitle: "주휴수당",
    question: "시급과 주 근로시간으로 이번 주 주휴수당 계산",
    description: "시급과 주 근로시간을 넣으면 한 주의 주휴수당과 월 환산 금액을 계산합니다.",
    basis: "근로기준법 제55조 기준",
    how: [
      {
        heading: "계산식",
        body: [
          "주 40시간 일하면 8시간분, 그보다 적게 일하면 비율만큼 줄어듭니다. 주 15시간 이상 일하고 정해진 근무일을 모두 나온 주에만 발생합니다.",
        ],
        formula: "주휴수당 = 시급 × (주 근로시간 ÷ 40) × 8시간",
      },
    ],
    related: ["hourly", "annual-leave"],
    sources: [
      {
        label: "근로기준법 제55조(휴일)",
        href: "https://www.law.go.kr/법령/근로기준법/제55조",
      },
      {
        label: "근로기준법 시행령 제30조(휴일)",
        href: "https://www.law.go.kr/법령/근로기준법시행령/제30조",
      },
    ],
  },
  {
    slug: "shutdown",
    group: "휴가·수당",
    title: "휴업수당 계산기",
    shortTitle: "휴업수당",
    question: "회사 사정으로 쉰 날에 받을 수 있는 금액",
    description: "1일 평균임금과 휴업 일수를 넣으면 회사 사정으로 쉰 기간의 휴업수당을 계산합니다.",
    basis: "근로기준법 제46조 기준",
    how: [
      {
        heading: "계산식",
        body: [
          "회사 책임으로 일을 못 한 날에는 평균임금의 70% 이상을 받습니다. 그 금액이 통상임금보다 많으면 통상임금을 받습니다.",
          "하루 중 일부만 쉰 경우와 노동위원회 승인을 받아 줄여 지급하는 경우는 계산하지 않습니다.",
        ],
        formula: "휴업수당 = 1일 평균임금 × 70% × 휴업 일수",
      },
    ],
    related: ["annual-leave", "weekly-holiday"],
    sources: [
      {
        label: "근로기준법 제46조(휴업수당)",
        href: "https://www.law.go.kr/법령/근로기준법/제46조",
      },
    ],
  },
];

export const calculatorBySlug = Object.fromEntries(
  calculators.map((calculator) => [calculator.slug, calculator]),
) as Record<CalculatorSlug, CalculatorMeta>;

export const groups: readonly CalculatorGroup[] = ["급여·세금", "퇴사", "휴가·수당"];

export const headerCalculators: readonly CalculatorSlug[] = [
  "salary",
  "year-end-tax",
  "severance",
  "unemployment",
];

export type StandardRow = {
  label: string;
  y2026: string;
  y2027: string;
  changed: boolean;
  note?: string;
};

/** 홈과 적용 기준 페이지에 쓰는 연도별 비교표 */
export const standardRows: StandardRow[] = [
  {
    label: "최저임금(시급)",
    y2026: "10,320원",
    y2027: "10,700원",
    changed: true,
    note: "월 209시간 기준 2,156,880원 → 2,236,300원",
  },
  {
    label: "국민연금(근로자)",
    y2026: "4.75%",
    y2027: "5.0%",
    changed: true,
    note: "2033년까지 해마다 0.25%p씩 오릅니다(근로자 부담 기준).",
  },
  {
    label: "건강보험(근로자)",
    y2026: "3.595%",
    y2027: "3.595%",
    changed: false,
    note: "2027년 동결",
  },
  {
    label: "장기요양보험",
    y2026: "건강보험료의 13.14%",
    y2027: "건강보험료의 13.90%",
    changed: true,
    note: "소득 대비 0.9448% → 0.9994%",
  },
  {
    label: "고용보험(근로자)",
    y2026: "0.9%",
    y2027: "0.9%",
    changed: false,
    note: "1.0% 인상안이 발표됐지만 시행령 개정 전입니다.",
  },
  {
    label: "구직급여 하한(1일 8시간)",
    y2026: "66,048원",
    y2027: "68,480원",
    changed: true,
  },
  {
    label: "구직급여 상한(1일)",
    y2026: "68,100원",
    y2027: "미정",
    changed: false,
    note: "하한액과 연동하는 개편안이 추진 중입니다.",
  },
];

export const updates: Array<{ date: string; text: string }> = [
  {
    date: "2026-11-21",
    text: "연말정산 환급액 계산기를 추가했습니다. 2027년 최저임금, 국민연금·장기요양보험료율을 반영하고 화면을 새로 정리했습니다.",
  },
  {
    date: "2026-07-11",
    text: "7월부터 바뀐 국민연금 기준소득월액(41만~659만원)을 반영했습니다.",
  },
];
