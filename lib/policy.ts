export const POLICY_VERSION = "2026.07.11";

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
    readonly dailyUpper: number;
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
  verifiedAt: "2026-07-11",
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
