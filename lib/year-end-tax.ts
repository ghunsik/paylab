import { YEAR_END_2026, type YearEndPolicy } from "./year-end-policy.ts";
import {
  calculateSalary,
  type CalculationResult,
  type CalculationRow,
} from "./calculations.ts";
import { POLICY_VERSION } from "./policy.ts";

export type YearEndTaxInput = {
  /** 연간 총급여(비과세 제외) */
  totalSalary: number;
  /** 회사가 1년 동안 원천징수한 소득세 합계(지방소득세 제외). 모르면 undefined */
  withheldIncomeTax?: number;
  /** 본인 포함 기본공제 대상 인원 */
  dependents: number;
  /** 기본공제 대상 자녀 수(만 20세 이하). 신용카드 한도 상향에 쓴다. */
  childrenAll: number;
  /** 그중 자녀세액공제 대상 자녀 수(2026년 귀속은 2016년 이전 출생) */
  children: number;
  /** 기본공제 대상 중 만 70세 이상 인원 */
  seniors: number;
  /** 기본공제 대상 중 장애인 인원 */
  disabled: number;
  /** 올해 혼인신고 여부 */
  marriedThisYear: boolean;
  /** 국민연금 본인 부담 연간 합계 */
  nationalPension: number;
  /** 건강보험·장기요양·고용보험 본인 부담 연간 합계 */
  healthAndEmploymentInsurance: number;
  creditCard: number;
  debitAndCash: number;
  marketAndTransit: number;
  /** 본인·65세 이상·장애인 의료비(한도 없음) */
  medicalSelf: number;
  /** 그 밖의 부양가족 의료비(연 700만원 한도) */
  medicalFamily: number;
  education: number;
  protectionInsurance: number;
  donation: number;
  hometownDonation: number;
  /** 연간 월세 지급액 */
  monthlyRent: number;
  pensionSavings: number;
  irp: number;
  housingSubscription: number;
  housingLoanRepayment: number;
};

export type YearEndTaxBreakdown = {
  earnedIncomeDeduction: number;
  earnedIncome: number;
  personalDeduction: number;
  pensionDeduction: number;
  insuranceDeduction: number;
  housingDeduction: number;
  cardDeduction: number;
  taxBase: number;
  calculatedTax: number;
  earnedIncomeCredit: number;
  childCredit: number;
  marriageCredit: number;
  pensionCredit: number;
  specialCredits: number;
  rentCredit: number;
  hometownCredit: number;
  standardCredit: number;
  usedStandardCredit: boolean;
  determinedIncomeTax: number;
  determinedLocalTax: number;
};

const floorWon = (value: number) => Math.max(0, Math.floor(value));

function assertAmount(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label}은(는) 0 이상의 숫자여야 합니다.`);
  }
}

function assertCount(value: number, label: string, minimum: number, maximum: number): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label}은(는) ${minimum}~${maximum} 사이의 정수여야 합니다.`);
  }
}

export function earnedIncomeDeductionFor(totalSalary: number, policy: YearEndPolicy): number {
  let previousCeiling = 0;
  let deduction = 0;
  for (const band of policy.earnedIncomeDeduction.bands) {
    const ceiling = band.upTo ?? Infinity;
    if (totalSalary > previousCeiling) {
      deduction += (Math.min(totalSalary, ceiling) - previousCeiling) * band.rate;
    }
    previousCeiling = ceiling;
  }
  return Math.min(deduction, policy.earnedIncomeDeduction.cap, totalSalary);
}

export function progressiveTax(taxBase: number, policy: YearEndPolicy): number {
  const bracket = policy.brackets.find(({ upTo }) => upTo === null || taxBase <= upTo);
  if (!bracket) return 0;
  return Math.max(0, taxBase * bracket.rate - bracket.quickDeduction);
}

export function earnedIncomeTaxCredit(
  calculatedTax: number,
  totalSalary: number,
  policy: YearEndPolicy,
): number {
  const rule = policy.earnedIncomeCredit;
  const raw =
    calculatedTax <= rule.threshold
      ? calculatedTax * rule.lowerRate
      : rule.threshold * rule.lowerRate + (calculatedTax - rule.threshold) * rule.upperRate;
  const tier = rule.caps.find(({ upTo }) => upTo === null || totalSalary <= upTo);
  if (!tier) return raw;
  const cap =
    tier.taper === undefined
      ? tier.cap
      : Math.max(tier.floor ?? 0, tier.cap - (totalSalary - tier.taper.from) * tier.taper.rate);
  return Math.min(raw, cap);
}

export function childTaxCreditFor(children: number, policy: YearEndPolicy): number {
  if (children <= 0) return 0;
  const { amounts, eachAdditional } = policy.childCredit;
  if (children <= amounts.length) return amounts[children - 1];
  return amounts[amounts.length - 1] + (children - amounts.length) * eachAdditional;
}

export function cardDeductionFor(
  input: Pick<
    YearEndTaxInput,
    "totalSalary" | "creditCard" | "debitAndCash" | "marketAndTransit" | "childrenAll"
  >,
  policy: YearEndPolicy,
): number {
  const rule = policy.card;
  let threshold = input.totalSalary * rule.thresholdRate;

  // 문턱 금액은 공제율이 낮은 수단부터 채운다(국세청 계산 순서).
  const creditOver = Math.max(0, input.creditCard - threshold);
  threshold = Math.max(0, threshold - input.creditCard);
  const debitOver = Math.max(0, input.debitAndCash - threshold);
  threshold = Math.max(0, threshold - input.debitAndCash);
  const marketOver = Math.max(0, input.marketAndTransit - threshold);

  const marketPart = marketOver * rule.marketRate;
  const total = creditOver * rule.creditRate + debitOver * rule.debitRate + marketPart;

  const tier = input.totalSalary <= rule.salaryCutoff ? rule.lower : rule.upper;
  const childCount = Math.min(input.childrenAll, rule.childBonusMaxChildren);
  const basicLimit = tier.basicLimit + childCount * tier.childBonusPerChild;
  if (total <= basicLimit) return floorWon(total);

  const additional = Math.min(total - basicLimit, marketPart, tier.additionalLimit);
  return floorWon(basicLimit + additional);
}

function medicalCreditBase(input: YearEndTaxInput, policy: YearEndPolicy): number {
  const threshold = input.totalSalary * policy.medical.thresholdRate;
  const familyAfterThreshold = input.medicalFamily - threshold;
  if (familyAfterThreshold >= 0) {
    return Math.min(familyAfterThreshold, policy.medical.familyCap) + input.medicalSelf;
  }
  // 일반 의료비가 문턱에 못 미치면 모자란 만큼을 한도 없는 의료비에서 뺀다.
  return Math.max(0, input.medicalSelf + familyAfterThreshold);
}

function donationCredit(amount: number, policy: YearEndPolicy): number {
  const rule = policy.donation;
  const lower = Math.min(amount, rule.threshold);
  const upper = Math.max(0, amount - rule.threshold);
  return lower * rule.lowerRate + upper * rule.upperRate;
}

function hometownCredit(amount: number, policy: YearEndPolicy): number {
  const rule = policy.hometownDonation;
  const capped = Math.min(amount, rule.cap);
  let previousCeiling = 0;
  let credit = 0;
  for (const tier of rule.tiers) {
    const ceiling = tier.upTo ?? Infinity;
    if (capped > previousCeiling) {
      credit += (Math.min(capped, ceiling) - previousCeiling) * tier.rate;
    }
    previousCeiling = ceiling;
  }
  return credit;
}

/**
 * 총급여를 12개월로 똑같이 나눠 받았다고 보고 1년 치 4대보험 본인 부담액을 추정한다.
 * 국민연금 기준소득월액이 7월에 바뀌므로 달마다 따로 계산해 더한다.
 */
export function estimateAnnualInsurance(
  totalSalary: number,
  year: number = YEAR_END_2026.year,
): { nationalPension: number; healthAndEmploymentInsurance: number } {
  let nationalPension = 0;
  let healthAndEmploymentInsurance = 0;
  if (!(totalSalary > 0)) return { nationalPension, healthAndEmploymentInsurance };
  for (let month = 1; month <= 12; month += 1) {
    const result = calculateSalary({
      basis: "annual",
      gross: totalSalary,
      nonTaxableMonthly: 0,
      dependents: 1,
      children: 0,
      effectiveMonth: `${year}-${String(month).padStart(2, "0")}`,
    });
    for (const row of result.rows) {
      if (row.label === "국민연금") nationalPension += row.amount;
      if (["건강보험", "장기요양보험", "고용보험"].includes(row.label)) {
        healthAndEmploymentInsurance += row.amount;
      }
    }
  }
  return { nationalPension, healthAndEmploymentInsurance };
}

export function computeYearEndTax(
  input: YearEndTaxInput,
  policy: YearEndPolicy = YEAR_END_2026,
): YearEndTaxBreakdown {
  const salary = input.totalSalary;
  const earnedIncomeDeduction = earnedIncomeDeductionFor(salary, policy);
  const earnedIncome = Math.max(0, salary - earnedIncomeDeduction);

  const personalDeduction =
    input.dependents * policy.personal.basic +
    input.seniors * policy.personal.senior +
    input.disabled * policy.personal.disabled;
  const pensionDeduction = input.nationalPension;
  const insuranceDeduction = input.healthAndEmploymentInsurance;

  const housingEligible = salary <= policy.housing.salaryCutoff;
  const subscription = housingEligible
    ? Math.min(input.housingSubscription, policy.housing.subscriptionPaymentCap) *
      policy.housing.rate
    : 0;
  const loan = input.housingLoanRepayment * policy.housing.rate;
  const housingDeduction = floorWon(Math.min(subscription + loan, policy.housing.combinedCap));

  const cardDeduction = cardDeductionFor(input, policy);

  const pensionRate =
    salary <= policy.pensionAccount.salaryCutoff
      ? policy.pensionAccount.lowerSalaryRate
      : policy.pensionAccount.upperSalaryRate;
  const pensionBase = Math.min(
    Math.min(input.pensionSavings, policy.pensionAccount.savingsCap) + input.irp,
    policy.pensionAccount.combinedCap,
  );
  const hometown = hometownCredit(input.hometownDonation, policy);
  const child = childTaxCreditFor(input.children, policy);
  const marriage = input.marriedThisYear ? policy.marriageCredit : 0;

  const insuranceCredit =
    Math.min(input.protectionInsurance, policy.protectionInsurance.cap) *
    policy.protectionInsurance.rate;
  const medicalCredit = medicalCreditBase(input, policy) * policy.medical.rate;
  const educationCredit = input.education * policy.education.rate;
  const specialCreditsRaw =
    insuranceCredit + medicalCredit + educationCredit + donationCredit(input.donation, policy);

  let rentCreditRaw = 0;
  if (input.monthlyRent > 0 && salary <= policy.rent.salaryCutoff) {
    const rate =
      salary <= policy.rent.lowerSalaryCutoff ? policy.rent.lowerSalaryRate : policy.rent.rate;
    rentCreditRaw = Math.min(input.monthlyRent, policy.rent.cap) * rate;
  }

  const settle = (useStandard: boolean): YearEndTaxBreakdown => {
    const appliedInsurance = useStandard ? 0 : insuranceDeduction;
    const appliedHousing = useStandard ? 0 : housingDeduction;
    const taxBase = Math.max(
      0,
      earnedIncome -
        personalDeduction -
        pensionDeduction -
        appliedInsurance -
        appliedHousing -
        cardDeduction,
    );
    const calculatedTax = floorWon(progressiveTax(taxBase, policy));
    const earnedIncomeCredit = floorWon(earnedIncomeTaxCredit(calculatedTax, salary, policy));

    // 세액공제는 남은 세액 안에서만 빠진다.
    let remaining = calculatedTax;
    const take = (amount: number) => {
      const used = Math.min(remaining, floorWon(amount));
      remaining -= used;
      return used;
    };

    const usedEarned = take(earnedIncomeCredit);
    const usedChild = take(child);
    const usedMarriage = take(marriage);
    const usedPension = take(pensionBase * pensionRate);
    const usedSpecial = useStandard ? 0 : take(specialCreditsRaw);
    const usedRent = useStandard ? 0 : take(rentCreditRaw);
    const usedStandard = useStandard ? take(policy.standardCredit) : 0;
    const usedHometown = take(hometown);

    return {
      earnedIncomeDeduction,
      earnedIncome,
      personalDeduction,
      pensionDeduction,
      insuranceDeduction: appliedInsurance,
      housingDeduction: appliedHousing,
      cardDeduction,
      taxBase,
      calculatedTax,
      earnedIncomeCredit: usedEarned,
      childCredit: usedChild,
      marriageCredit: usedMarriage,
      pensionCredit: usedPension,
      specialCredits: usedSpecial,
      rentCredit: usedRent,
      hometownCredit: usedHometown,
      standardCredit: usedStandard,
      usedStandardCredit: useStandard,
      // 결정세액은 10원 미만을 버린다.
      determinedIncomeTax: Math.floor(remaining / 10) * 10,
      determinedLocalTax: Math.floor((remaining * policy.localTaxRate) / 10) * 10,
    };
  };

  const itemized = settle(false);
  const standard = settle(true);
  return standard.determinedIncomeTax < itemized.determinedIncomeTax ? standard : itemized;
}

export function calculateYearEndTax(
  input: YearEndTaxInput,
  policy: YearEndPolicy = YEAR_END_2026,
): CalculationResult {
  assertAmount(input.totalSalary, "총급여");
  if (input.totalSalary <= 0) throw new RangeError("총급여를 입력해 주세요.");
  assertCount(input.dependents, "기본공제 인원", 1, 20);
  assertCount(input.childrenAll, "자녀 수", 0, 19);
  assertCount(input.children, "자녀세액공제 대상 자녀 수", 0, 19);
  assertCount(input.seniors, "70세 이상 인원", 0, 19);
  assertCount(input.disabled, "장애인 인원", 0, 20);
  if (input.childrenAll > input.dependents - 1) {
    throw new RangeError("자녀 수는 본인을 뺀 기본공제 인원보다 많을 수 없습니다.");
  }
  if (input.children > input.childrenAll) {
    throw new RangeError("자녀세액공제 대상 자녀 수는 전체 자녀 수보다 많을 수 없습니다.");
  }
  if (input.seniors > input.dependents) {
    throw new RangeError("70세 이상 인원은 기본공제 인원보다 많을 수 없습니다.");
  }
  if (input.disabled > input.dependents) {
    throw new RangeError("장애인 인원은 기본공제 인원보다 많을 수 없습니다.");
  }
  const amounts: Array<[number, string]> = [
    [input.nationalPension, "국민연금 보험료"],
    [input.healthAndEmploymentInsurance, "건강·고용보험료"],
    [input.creditCard, "신용카드 사용액"],
    [input.debitAndCash, "체크카드·현금영수증 사용액"],
    [input.marketAndTransit, "전통시장·대중교통 사용액"],
    [input.medicalSelf, "본인 의료비"],
    [input.medicalFamily, "부양가족 의료비"],
    [input.education, "교육비"],
    [input.protectionInsurance, "보장성 보험료"],
    [input.donation, "기부금"],
    [input.hometownDonation, "고향사랑기부금"],
    [input.monthlyRent, "월세"],
    [input.pensionSavings, "연금저축 납입액"],
    [input.irp, "IRP 납입액"],
    [input.housingSubscription, "주택청약 납입액"],
    [input.housingLoanRepayment, "전세대출 원리금 상환액"],
  ];
  for (const [value, label] of amounts) assertAmount(value, label);
  if (input.withheldIncomeTax !== undefined) {
    assertAmount(input.withheldIncomeTax, "이미 낸 소득세");
  }

  const tax = computeYearEndTax(input, policy);
  const determinedTotal = tax.determinedIncomeTax + tax.determinedLocalTax;

  const rows: CalculationRow[] = [
    { label: "총급여", amount: input.totalSalary, unit: "원", kind: "income" },
    { label: "근로소득공제", amount: floorWon(tax.earnedIncomeDeduction), unit: "원", kind: "deduction" },
    { label: "인적공제", amount: tax.personalDeduction, unit: "원", kind: "deduction" },
    { label: "국민연금 보험료", amount: tax.pensionDeduction, unit: "원", kind: "deduction" },
  ];
  if (tax.insuranceDeduction > 0) {
    rows.push({ label: "건강·고용보험료", amount: tax.insuranceDeduction, unit: "원", kind: "deduction" });
  }
  if (tax.housingDeduction > 0) {
    rows.push({ label: "주택자금 공제", amount: tax.housingDeduction, unit: "원", kind: "deduction" });
  }
  if (tax.cardDeduction > 0) {
    rows.push({ label: "신용카드 등 공제", amount: tax.cardDeduction, unit: "원", kind: "deduction" });
  }
  rows.push(
    { label: "과세표준", amount: tax.taxBase, unit: "원", kind: "subtotal" },
    { label: "산출세액", amount: tax.calculatedTax, unit: "원", kind: "subtotal" },
    { label: "근로소득 세액공제", amount: tax.earnedIncomeCredit, unit: "원", kind: "deduction" },
  );
  const credits: Array<[string, number]> = [
    ["자녀 세액공제", tax.childCredit],
    ["결혼 세액공제", tax.marriageCredit],
    ["연금계좌 세액공제", tax.pensionCredit],
    ["보험료·의료비·교육비·기부금", tax.specialCredits],
    ["월세 세액공제", tax.rentCredit],
    ["표준 세액공제", tax.standardCredit],
    ["고향사랑기부금", tax.hometownCredit],
  ];
  for (const [label, amount] of credits) {
    if (amount > 0) rows.push({ label, amount, unit: "원", kind: "deduction" });
  }
  rows.push(
    { label: "결정세액(소득세)", amount: tax.determinedIncomeTax, unit: "원", kind: "subtotal" },
    { label: "지방소득세", amount: tax.determinedLocalTax, unit: "원", kind: "info" },
  );

  const assumptions = [
    `${policy.year}년에 받은 근로소득만 있고, 1년 내내 한 회사에 다닌 것으로 계산했습니다.`,
    "신용카드 등 사용액은 공제율이 낮은 수단부터 총급여의 25%를 채우는 순서로 계산했습니다.",
    "지방소득세는 소득세의 10%로 계산했습니다.",
    tax.usedStandardCredit
      ? "항목별 공제보다 표준세액공제 13만원이 유리해 표준세액공제를 적용했습니다."
      : "보험료·의료비·교육비·기부금·월세 공제를 적용했고, 표준세액공제는 쓰지 않았습니다.",
  ];

  const warnings = [
    "부양가족의 소득·나이 요건과 항목별 세부 요건은 판단하지 않고 입력한 값을 그대로 썼습니다.",
    "주택담보대출 이자, 중소기업 취업자 감면, 난임·산후조리 등 따로 계산하는 항목은 포함하지 않았습니다.",
  ];
  if (input.monthlyRent > 0 && input.totalSalary > policy.rent.salaryCutoff) {
    warnings.push(
      `총급여가 ${(policy.rent.salaryCutoff / 10_000).toLocaleString("ko-KR")}만원을 넘어 월세 세액공제를 적용하지 않았습니다.`,
    );
  }
  if (input.housingSubscription > 0 && input.totalSalary > policy.housing.salaryCutoff) {
    warnings.push(
      `총급여가 ${(policy.housing.salaryCutoff / 10_000).toLocaleString("ko-KR")}만원을 넘어 주택청약 소득공제를 적용하지 않았습니다.`,
    );
  }
  const cardTotal = input.creditCard + input.debitAndCash + input.marketAndTransit;
  if (cardTotal > 0 && tax.cardDeduction === 0) {
    warnings.push("카드 등 사용액이 총급여의 25%를 넘지 않아 신용카드 소득공제가 없습니다.");
  }
  const medicalTotal = input.medicalSelf + input.medicalFamily;
  if (medicalTotal > 0 && medicalTotal <= input.totalSalary * policy.medical.thresholdRate) {
    warnings.push("의료비가 총급여의 3%를 넘지 않아 의료비 세액공제가 없습니다.");
  }

  if (input.withheldIncomeTax === undefined) {
    return {
      primary: {
        label: `${policy.year}년 귀속 결정세액 (지방소득세 포함)`,
        amount: determinedTotal,
        unit: "원",
        note: "1년 동안 급여에서 뗀 소득세·지방소득세 합계가 이보다 많으면 차액을 돌려받습니다.",
      },
      rows,
      assumptions,
      warnings,
      policyVersion: POLICY_VERSION,
    };
  }

  const withheldLocal = Math.floor((input.withheldIncomeTax * policy.localTaxRate) / 10) * 10;
  const withheldTotal = input.withheldIncomeTax + withheldLocal;
  const difference = withheldTotal - determinedTotal;
  rows.push(
    { label: "이미 낸 소득세", amount: input.withheldIncomeTax, unit: "원", kind: "info" },
    { label: "이미 낸 지방소득세", amount: withheldLocal, unit: "원", kind: "info" },
    {
      label: difference >= 0 ? "돌려받는 금액" : "더 내는 금액",
      amount: Math.abs(difference),
      unit: "원",
      kind: "total",
    },
  );
  assumptions.push("이미 낸 지방소득세는 입력한 소득세의 10%로 계산했습니다.");

  return {
    primary: {
      label: difference >= 0 ? "예상 환급액" : "예상 추가 납부액",
      amount: Math.abs(difference),
      unit: "원",
      note:
        difference >= 0
          ? "소득세와 지방소득세를 합친 금액이며, 보통 2월 급여와 함께 받습니다."
          : "소득세와 지방소득세를 합친 금액이며, 보통 2월 급여에서 빠집니다.",
    },
    rows,
    assumptions,
    warnings,
    policyVersion: POLICY_VERSION,
  };
}
