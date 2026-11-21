export type YearEndPolicy = {
  /** 귀속 연도 */
  readonly year: number;
  readonly verifiedAt: string;
  readonly earnedIncomeDeduction: {
    readonly bands: ReadonlyArray<{ readonly upTo: number | null; readonly rate: number }>;
    readonly cap: number;
  };
  readonly brackets: ReadonlyArray<{
    readonly upTo: number | null;
    readonly rate: number;
    readonly quickDeduction: number;
  }>;
  readonly earnedIncomeCredit: {
    readonly threshold: number;
    readonly lowerRate: number;
    readonly upperRate: number;
    /** 총급여 구간별 한도. taper가 있으면 from을 넘는 금액에 rate를 곱해 한도에서 뺀다. */
    readonly caps: ReadonlyArray<{
      readonly upTo: number | null;
      readonly cap: number;
      readonly floor?: number;
      readonly taper?: { readonly from: number; readonly rate: number };
    }>;
  };
  readonly personal: {
    readonly basic: number;
    readonly senior: number;
    readonly disabled: number;
  };
  readonly childCredit: {
    /** 자녀 1명, 2명일 때의 공제액 */
    readonly amounts: readonly number[];
    readonly eachAdditional: number;
    /** 이 날짜(포함) 이전에 태어난 자녀가 대상 */
    readonly bornOnOrBefore: string;
  };
  readonly marriageCredit: number;
  readonly standardCredit: number;
  readonly localTaxRate: number;
  readonly card: {
    readonly thresholdRate: number;
    readonly creditRate: number;
    readonly debitRate: number;
    readonly marketRate: number;
    readonly salaryCutoff: number;
    readonly childBonusMaxChildren: number;
    readonly lower: CardTier;
    readonly upper: CardTier;
  };
  readonly medical: {
    readonly thresholdRate: number;
    readonly rate: number;
    readonly familyCap: number;
  };
  readonly education: { readonly rate: number };
  readonly protectionInsurance: { readonly rate: number; readonly cap: number };
  readonly donation: {
    readonly threshold: number;
    readonly lowerRate: number;
    readonly upperRate: number;
  };
  readonly hometownDonation: {
    readonly cap: number;
    /** 아래에서부터 순서대로 채우는 구간 */
    readonly tiers: ReadonlyArray<{ readonly upTo: number | null; readonly rate: number }>;
  };
  readonly rent: {
    readonly salaryCutoff: number;
    readonly lowerSalaryCutoff: number;
    readonly rate: number;
    readonly lowerSalaryRate: number;
    readonly cap: number;
  };
  readonly pensionAccount: {
    readonly savingsCap: number;
    readonly combinedCap: number;
    readonly salaryCutoff: number;
    readonly lowerSalaryRate: number;
    readonly upperSalaryRate: number;
  };
  readonly housing: {
    readonly salaryCutoff: number;
    readonly subscriptionPaymentCap: number;
    readonly rate: number;
    readonly combinedCap: number;
  };
};

type CardTier = {
  readonly basicLimit: number;
  readonly childBonusPerChild: number;
  readonly additionalLimit: number;
};

/**
 * 2026년 귀속 근로소득 연말정산(2027년 1~2월 정산) 기준.
 * 2025년 귀속과 달라진 곳: 자녀세액공제 나이, 신용카드 기본 한도(자녀 수), 고향사랑기부금 10만~20만원 구간.
 */
export const YEAR_END_2026 = {
  year: 2026,
  verifiedAt: "2026-11-21",
  earnedIncomeDeduction: {
    bands: [
      { upTo: 5_000_000, rate: 0.7 },
      { upTo: 15_000_000, rate: 0.4 },
      { upTo: 45_000_000, rate: 0.15 },
      { upTo: 100_000_000, rate: 0.05 },
      { upTo: null, rate: 0.02 },
    ],
    cap: 20_000_000,
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
  earnedIncomeCredit: {
    threshold: 1_300_000,
    lowerRate: 0.55,
    upperRate: 0.3,
    caps: [
      { upTo: 33_000_000, cap: 740_000 },
      {
        upTo: 70_000_000,
        cap: 740_000,
        floor: 660_000,
        taper: { from: 33_000_000, rate: 0.008 },
      },
      {
        upTo: 120_000_000,
        cap: 660_000,
        floor: 500_000,
        taper: { from: 70_000_000, rate: 0.5 },
      },
      {
        upTo: null,
        cap: 500_000,
        floor: 200_000,
        taper: { from: 120_000_000, rate: 0.5 },
      },
    ],
  },
  personal: {
    basic: 1_500_000,
    senior: 1_000_000,
    disabled: 2_000_000,
  },
  childCredit: {
    amounts: [250_000, 550_000],
    eachAdditional: 400_000,
    bornOnOrBefore: "2016-12-31",
  },
  marriageCredit: 500_000,
  standardCredit: 130_000,
  localTaxRate: 0.1,
  card: {
    thresholdRate: 0.25,
    creditRate: 0.15,
    debitRate: 0.3,
    marketRate: 0.4,
    salaryCutoff: 70_000_000,
    childBonusMaxChildren: 2,
    lower: { basicLimit: 3_000_000, childBonusPerChild: 500_000, additionalLimit: 3_000_000 },
    upper: { basicLimit: 2_500_000, childBonusPerChild: 250_000, additionalLimit: 2_000_000 },
  },
  medical: {
    thresholdRate: 0.03,
    rate: 0.15,
    familyCap: 7_000_000,
  },
  education: { rate: 0.15 },
  protectionInsurance: { rate: 0.12, cap: 1_000_000 },
  donation: {
    threshold: 10_000_000,
    lowerRate: 0.15,
    upperRate: 0.3,
  },
  hometownDonation: {
    cap: 20_000_000,
    tiers: [
      { upTo: 100_000, rate: 100 / 110 },
      { upTo: 200_000, rate: 0.4 },
      { upTo: null, rate: 0.15 },
    ],
  },
  rent: {
    salaryCutoff: 80_000_000,
    lowerSalaryCutoff: 55_000_000,
    rate: 0.15,
    lowerSalaryRate: 0.17,
    cap: 10_000_000,
  },
  pensionAccount: {
    savingsCap: 6_000_000,
    combinedCap: 9_000_000,
    salaryCutoff: 55_000_000,
    lowerSalaryRate: 0.15,
    upperSalaryRate: 0.12,
  },
  housing: {
    salaryCutoff: 70_000_000,
    subscriptionPaymentCap: 3_000_000,
    rate: 0.4,
    combinedCap: 4_000_000,
  },
} as const satisfies YearEndPolicy;
