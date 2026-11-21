export const POLICY_VERSION = "2026.11.21";

export type PolicySource = {
  readonly label: string;
  readonly url: string;
};

export type PensionBasePeriod = {
  readonly fromMonth: string;
  readonly toMonth: string;
  readonly minimum: number;
  readonly maximum: number;
};

export type TaxBracket = {
  readonly upTo: number | null;
  readonly rate: number;
  readonly quickDeduction: number;
};

export type LaborPolicy = {
  readonly version: string;
  readonly year: number;
  readonly verifiedAt: string;
  readonly currency: "KRW";
  readonly minimumWage: {
    readonly hourly: number;
    readonly monthlyHours: number;
    readonly monthlyAmount: number;
  };
  readonly insurance: {
    readonly nationalPension: {
      readonly employeeRate: number;
      readonly basePeriods: readonly PensionBasePeriod[];
    };
    readonly health: {
      readonly employeeRate: number;
      readonly totalRate: number;
      readonly employeeMonthlyMinimum: number;
      readonly employeeMonthlyMaximum: number;
    };
    readonly longTermCare: {
      readonly contributionRate: number;
      readonly healthContributionRate: number;
    };
    readonly employment: {
      readonly employeeRate: number;
    };
  };
  readonly unemployment: {
    readonly replacementRate: number;
    /** 해당 연도 적용 상한의 근거를 확인하지 못했으면 null */
    readonly dailyUpper: number | null;
    readonly lowerMinimumWageRatio: number;
    readonly maximumDailyHours: number;
    readonly benefitDays: {
      readonly under50: Readonly<Record<InsuredPeriodKey, number>>;
      readonly over50: Readonly<Record<InsuredPeriodKey, number>>;
    };
  };
  readonly incomeTaxEstimate: {
    readonly basicDeductionPerDependent: number;
    readonly standardTaxCredit: number;
    readonly earnedIncomeDeductionCap: number;
    readonly earnedIncomeTaxCreditCap: number;
    readonly childCredit: {
      readonly oneChild: number;
      readonly twoChildren: number;
      readonly eachAdditionalChild: number;
    };
    readonly brackets: readonly TaxBracket[];
  };
  /** 조사 시점에 확정 근거를 확인하지 못한 항목과 계산에 쓰는 가정 */
  readonly pending: readonly string[];
  readonly sources: readonly PolicySource[];
};

export type InsuredPeriodKey =
  | "under1"
  | "1to3"
  | "3to5"
  | "5to10"
  | "over10";

export const POLICY_2026 = {
  version: POLICY_VERSION,
  year: 2026,
  verifiedAt: "2026-11-21",
  currency: "KRW",
  minimumWage: {
    hourly: 10_320,
    monthlyHours: 209,
    monthlyAmount: 2_156_880,
  },
  insurance: {
    nationalPension: {
      employeeRate: 0.0475,
      basePeriods: [
        {
          fromMonth: "2026-01",
          toMonth: "2026-06",
          minimum: 400_000,
          maximum: 6_370_000,
        },
        {
          fromMonth: "2026-07",
          toMonth: "2026-12",
          minimum: 410_000,
          maximum: 6_590_000,
        },
      ],
    },
    health: {
      employeeRate: 0.03595,
      totalRate: 0.0719,
      employeeMonthlyMinimum: 10_080,
      employeeMonthlyMaximum: 4_591_740,
    },
    longTermCare: {
      contributionRate: 0.009448,
      healthContributionRate: 0.0719,
    },
    employment: {
      employeeRate: 0.009,
    },
  },
  unemployment: {
    replacementRate: 0.6,
    dailyUpper: 68_100,
    lowerMinimumWageRatio: 0.8,
    maximumDailyHours: 8,
    benefitDays: {
      under50: {
        under1: 120,
        "1to3": 150,
        "3to5": 180,
        "5to10": 210,
        over10: 240,
      },
      over50: {
        under1: 120,
        "1to3": 180,
        "3to5": 210,
        "5to10": 240,
        over10: 270,
      },
    },
  },
  incomeTaxEstimate: {
    basicDeductionPerDependent: 1_500_000,
    standardTaxCredit: 130_000,
    earnedIncomeDeductionCap: 20_000_000,
    earnedIncomeTaxCreditCap: 740_000,
    childCredit: {
      oneChild: 250_000,
      twoChildren: 550_000,
      eachAdditionalChild: 400_000,
    },
    brackets: [
      { upTo: 14_000_000, rate: 0.06, quickDeduction: 0 },
      { upTo: 50_000_000, rate: 0.15, quickDeduction: 1_260_000 },
      { upTo: 88_000_000, rate: 0.24, quickDeduction: 5_760_000 },
      { upTo: 150_000_000, rate: 0.35, quickDeduction: 15_440_000 },
      { upTo: 300_000_000, rate: 0.38, quickDeduction: 19_940_000 },
      { upTo: 500_000_000, rate: 0.4, quickDeduction: 25_940_000 },
      { upTo: 1_000_000_000, rate: 0.42, quickDeduction: 35_940_000 },
      { upTo: null, rate: 0.45, quickDeduction: 65_940_000 },
    ],
  },
  pending: [],
  sources: [
    {
      label: "국민연금공단 2026년 보험료율 및 기준소득월액",
      url: "https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0038M0.do?menuId=MN24001113&tab=tab5",
    },
    {
      label: "국민건강보험공단 2026년도 보험료율",
      url: "https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html",
    },
    {
      label: "보건복지부고시 2026년 건강보험료 상·하한",
      url: "https://law.go.kr/LSW/admRulLsInfoP.do?admRulSeq=2100000270472",
    },
    {
      label: "최저임금위원회 2026년 최저임금",
      url: "https://www.minimumwage.go.kr/minWage/policy/decisionMain.do",
    },
    {
      label: "고용노동부 2026년 구직급여 상한액",
      url: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=18736",
    },
  ],
} as const satisfies LaborPolicy;

export const POLICY_2027 = {
  version: POLICY_VERSION,
  year: 2027,
  verifiedAt: "2026-11-21",
  currency: "KRW",
  minimumWage: {
    hourly: 10_700,
    monthlyHours: 209,
    monthlyAmount: 2_236_300,
  },
  insurance: {
    nationalPension: {
      employeeRate: 0.05,
      basePeriods: [
        {
          fromMonth: "2027-01",
          toMonth: "2027-06",
          minimum: 410_000,
          maximum: 6_590_000,
        },
      ],
    },
    health: {
      employeeRate: 0.03595,
      totalRate: 0.0719,
      employeeMonthlyMinimum: 10_080,
      employeeMonthlyMaximum: 4_591_740,
    },
    longTermCare: {
      contributionRate: 0.009994,
      healthContributionRate: 0.0719,
    },
    employment: {
      employeeRate: 0.009,
    },
  },
  unemployment: {
    replacementRate: 0.6,
    dailyUpper: null,
    lowerMinimumWageRatio: 0.8,
    maximumDailyHours: 8,
    benefitDays: POLICY_2026.unemployment.benefitDays,
  },
  incomeTaxEstimate: POLICY_2026.incomeTaxEstimate,
  pending: [
    "건강보험료 상·하한: 2026-11-21 공식 고시 검색에서 2027년 적용 개정 근거를 확인하지 못해 현행 2026년 값을 씁니다.",
    "고용보험료율: 현행 시행령의 총 1.8% 중 근로자 부담 0.9%를 적용합니다. 총 2.0% 개편안은 2026-09-22 입법예고(11-02 종료)됐으나 공포·시행 근거는 2026-11-21 확인하지 못했습니다.",
    "구직급여 상한액: 2026-11-21 확인 기준 2027년 적용 확정 근거를 확인하지 못해 하한 기준 금액만 표시합니다. 주 6일 지급 등 제도개편안은 반영하지 않았습니다.",
    "국민연금 기준소득월액: 공단이 안내한 41만~659만원의 적용 기간은 2026-07~2027-06입니다. 2027년 7월 이후 값은 확인하지 못해 입력을 제한합니다.",
    "소득세: 2026-08-03 세제개편안 발표, 09-01 정부안 확정, 09-03 소득세법 개정안(의안 2221042) 제출을 확인했습니다. 2026-11-21 본회의 의결·공포 근거를 확인하지 못해 현행 기본세율·공제를 적용하며 정부안은 반영하지 않았습니다.",
  ],
  sources: [
    {
      label: "고용노동부 2027년 적용 최저임금 고시 (2026-08-05)",
      url: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19744",
    },
    {
      label: "국민연금공단 보험료율 및 기준소득월액",
      url: "https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0038M0.do?menuId=MN24001113&tab=tab5",
    },
    {
      label: "보건복지부 2027년 건강보험료율 결정 (2026-09-08)",
      url: "https://www.mohw.go.kr/gallery.es?act=view&bid=0003&list_no=380402&mid=a10605040000",
    },
    {
      label: "보건복지부 2027년 장기요양보험료율 결정 (2026-10-30)",
      url: "https://www.mohw.go.kr/gallery.es?act=view&bid=0003&list_no=380579&mid=a10606030000",
    },
    {
      label: "고용노동부 고용보험 제도개편 방안",
      url: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19866",
    },
    {
      label: "국민연금공단 가입자 가이드 (2027년 총요율 10%)",
      url: "https://m.nps.or.kr/fileDown.do?atchFileId=FL26003737&atchFileSn=1",
    },
    {
      label: "현행 보험료징수법 시행령 제12조 (실업급여 총요율 1.8%)",
      url: "https://www.law.go.kr/LSW/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1000953537",
    },
    {
      label: "고용보험료율 인상 시행령 입법예고 (2026-09-22, 공포 확인 전)",
      url: "https://www.moel.go.kr/info/lawinfo/lawmaking/view.do?bbs_seq=20260900688",
    },
    {
      label: "현행 건강보험료 상·하한 고시 (2026년 시행)",
      url: "https://law.go.kr/LSW/admRulLsInfoP.do?admRulSeq=2100000270472",
    },
    {
      label: "현행 구직급여 기초일액 상한 (시행령 제68조, 2026-09-18 시행)",
      url: "https://www.law.go.kr/LSW/lsSideInfoP.do?ancYnChk=0&docCls=jo&efGubun=Y&efYd=20260918&joBrNo=00&joNo=0068&lsiSeq=288717&urlMode=lsScJoRltInfoR",
    },
    {
      label: "국세청 현행 근로소득 기본세율·공제",
      url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7871&mi=6503",
    },
    {
      label: "재정경제부 2026년 세제개편안 정부안 확정 (2026-09-01)",
      url: "https://mofe.go.kr/nw/nes/detailNesDtaView.do?menuNo=4010100&searchNttId1=MOSF_000000000079193",
    },
    {
      label: "국민참여입법센터 국회입법현황 소득세법 개정안 2221042 (정부, 2026-09-03)",
      url: "https://community.lawmaking.go.kr/gcom/nsmLmSts/out/2221042/detailRP",
    },
    {
      label: "소득세법 전체 제·개정문 (현행·시행예정 개정 확인)",
      url: "https://law.go.kr/LSW/lsRvsDocListP.do?lsId=001565&lsRvsGubun=all",
    },
  ],
} as const satisfies LaborPolicy;

export type PolicyYear = 2026 | 2027;

export const POLICY_YEARS: readonly PolicyYear[] = [2026, 2027];

/** 급여 귀속월로 고를 수 있는 범위. 국민연금 기준소득월액이 고시된 달까지만 연다. */
export const FIRST_SUPPORTED_MONTH = "2026-01";
export const LAST_SUPPORTED_MONTH = "2027-06";

export function policyForYear(year: number): LaborPolicy {
  if (year === 2026) return POLICY_2026;
  if (year === 2027) return POLICY_2027;
  throw new RangeError("적용 연도는 2026년 또는 2027년이어야 합니다.");
}

export function policyForMonth(month: string): LaborPolicy {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new RangeError("적용월은 YYYY-MM 형식이어야 합니다.");
  }
  if (month < FIRST_SUPPORTED_MONTH) {
    throw new RangeError("2026년 1월 이전 급여는 계산할 수 없습니다.");
  }
  if (month > LAST_SUPPORTED_MONTH) {
    throw new RangeError(
      "확인한 국민연금 기준소득월액의 적용 기간은 2027년 6월까지입니다. 2027년 7월 이후는 계산할 수 없습니다.",
    );
  }
  return policyForYear(Number(month.slice(0, 4)));
}
