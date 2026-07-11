import {
  POLICY_2026,
  POLICY_VERSION,
  type InsuredPeriodKey,
} from "./policy.ts";

export type CalculationUnit = "원" | "일" | "시간" | "%" | "개월" | "년";

export type CalculationRow = {
  label: string;
  amount: number;
  unit: CalculationUnit;
  kind?: "income" | "deduction" | "subtotal" | "total" | "info";
  note?: string;
};

export type CalculationResult = {
  primary: {
    label: string;
    amount: number;
    unit: CalculationUnit;
  };
  rows: CalculationRow[];
  assumptions: string[];
  warnings: string[];
  policyVersion: string;
};

export type SalaryInput = {
  basis: "monthly" | "annual";
  gross: number;
  nonTaxableMonthly: number;
  dependents: number;
  children: number;
  effectiveMonth: string;
};

export type HourlyPayInput = {
  hourlyWage: number;
  weeklyHours: number;
  workdaysPerWeek: number;
  attendedAllDays: boolean;
};

export type SeveranceInput = {
  hireDate: string;
  retirementDate: string;
  lastThreeMonthsWages: number;
  annualBonus: number;
  annualLeaveAllowance: number;
  ordinaryDailyWage?: number;
  weeklyHours: number;
};

export type UnemploymentBenefitInput = {
  averageMonthlyWage: number;
  referenceDays: number;
  dailyHours: number;
  ageGroup: "under50" | "over50";
  insuredPeriod: InsuredPeriodKey;
};

export type AnnualLeaveInput = {
  hireDate: string;
  asOfDate: string;
  workplaceAtLeastFive: boolean;
  weeklyHours: number;
  attendanceRate: number;
  fullMonthAttendance: boolean;
};

export type WeeklyHolidayPayInput = {
  hourlyWage: number;
  weeklyHours: number;
  attendedAllDays: boolean;
};

export type ShutdownAllowanceInput = {
  averageDailyWage: number;
  ordinaryDailyWage?: number;
  shutdownDays: number;
};

export type IncomeTaxEstimateInput = {
  monthlyTaxableIncome: number;
  dependents: number;
  eligibleChildren: number;
  annualInsuranceContributions: number;
};

export type IncomeTaxEstimate = {
  monthlyIncomeTax: number;
  monthlyLocalIncomeTax: number;
  annualIncomeTax: number;
  assumptions: string[];
  warnings: string[];
};

type PlainDate = {
  year: number;
  month: number;
  day: number;
};

const DAY_MS = 86_400_000;
const MONTHS_PER_YEAR = 12;

function assertFiniteNumber(
  value: number,
  label: string,
  options: {
    minimum?: number;
    maximum?: number;
    integer?: boolean;
    minimumExclusive?: boolean;
  } = {},
): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label}은(는) 유한한 숫자여야 합니다.`);
  }

  if (options.integer && !Number.isInteger(value)) {
    throw new RangeError(`${label}은(는) 정수여야 합니다.`);
  }

  if (options.minimum !== undefined) {
    const invalid = options.minimumExclusive
      ? value <= options.minimum
      : value < options.minimum;
    if (invalid) {
      const comparison = options.minimumExclusive ? "초과" : "이상";
      throw new RangeError(`${label}은(는) ${options.minimum}${comparison}이어야 합니다.`);
    }
  }

  if (options.maximum !== undefined && value > options.maximum) {
    throw new RangeError(`${label}은(는) ${options.maximum} 이하여야 합니다.`);
  }
}

function assertBoolean(value: boolean, label: string): void {
  if (typeof value !== "boolean") {
    throw new TypeError(`${label}은(는) 불리언이어야 합니다.`);
  }
}

function roundWon(value: number): number {
  return Math.round(value);
}

function floorToTenWon(value: number): number {
  return Math.max(0, Math.floor(value / 10) * 10);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function parsePlainDate(value: string, label: string): PlainDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new RangeError(`${label}은(는) YYYY-MM-DD 형식이어야 합니다.`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || year > 9999 || month < 1 || month > 12) {
    throw new RangeError(`${label}이(가) 유효한 날짜가 아닙니다.`);
  }

  const maximumDay = daysInMonth(year, month);
  if (day < 1 || day > maximumDay) {
    throw new RangeError(`${label}이(가) 유효한 날짜가 아닙니다.`);
  }

  return { year, month, day };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function epochDay(date: PlainDate): number {
  return Math.floor(Date.UTC(date.year, date.month - 1, date.day) / DAY_MS);
}

function compareDates(left: PlainDate, right: PlainDate): number {
  return epochDay(left) - epochDay(right);
}

function daysBetween(start: PlainDate, end: PlainDate): number {
  return epochDay(end) - epochDay(start);
}

function addCalendarMonths(date: PlainDate, months: number): PlainDate {
  const absoluteMonth = date.year * MONTHS_PER_YEAR + (date.month - 1) + months;
  const year = Math.floor(absoluteMonth / MONTHS_PER_YEAR);
  const monthIndex = absoluteMonth - year * MONTHS_PER_YEAR;
  const month = monthIndex + 1;
  return {
    year,
    month,
    day: Math.min(date.day, daysInMonth(year, month)),
  };
}

function completedCalendarMonths(start: PlainDate, end: PlainDate): number {
  let months = (end.year - start.year) * 12 + (end.month - start.month);
  if (months < 0) return months;
  if (compareDates(addCalendarMonths(start, months), end) > 0) months -= 1;
  return months;
}

function completedCalendarYears(start: PlainDate, end: PlainDate): number {
  return Math.floor(completedCalendarMonths(start, end) / 12);
}

function pensionBaseForMonth(effectiveMonth: string): {
  minimum: number;
  maximum: number;
} {
  if (!/^2026-(0[1-9]|1[0-2])$/.test(effectiveMonth)) {
    throw new RangeError("적용월은 2026-01부터 2026-12 사이의 YYYY-MM 형식이어야 합니다.");
  }

  const period = POLICY_2026.insurance.nationalPension.basePeriods.find(
    ({ fromMonth, toMonth }) =>
      effectiveMonth >= fromMonth && effectiveMonth <= toMonth,
  );
  if (!period) {
    throw new RangeError("적용월에 해당하는 국민연금 기준소득월액 정책이 없습니다.");
  }
  return period;
}

function earnedIncomeDeduction(annualTaxablePay: number): number {
  let deduction: number;
  if (annualTaxablePay <= 5_000_000) {
    deduction = annualTaxablePay * 0.7;
  } else if (annualTaxablePay <= 15_000_000) {
    deduction = 3_500_000 + (annualTaxablePay - 5_000_000) * 0.4;
  } else if (annualTaxablePay <= 45_000_000) {
    deduction = 7_500_000 + (annualTaxablePay - 15_000_000) * 0.15;
  } else if (annualTaxablePay <= 100_000_000) {
    deduction = 12_000_000 + (annualTaxablePay - 45_000_000) * 0.05;
  } else {
    deduction = 14_750_000 + (annualTaxablePay - 100_000_000) * 0.02;
  }
  return Math.min(deduction, POLICY_2026.incomeTaxEstimate.earnedIncomeDeductionCap);
}

function progressiveIncomeTax(taxBase: number): number {
  const bracket = POLICY_2026.incomeTaxEstimate.brackets.find(
    ({ upTo }) => upTo === null || taxBase <= upTo,
  );
  if (!bracket) return 0;
  return Math.max(0, taxBase * bracket.rate - bracket.quickDeduction);
}

function childTaxCredit(children: number): number {
  const credit = POLICY_2026.incomeTaxEstimate.childCredit;
  if (children <= 0) return 0;
  if (children === 1) return credit.oneChild;
  if (children === 2) return credit.twoChildren;
  return credit.twoChildren + (children - 2) * credit.eachAdditionalChild;
}

export function estimateIncomeTax(input: IncomeTaxEstimateInput): IncomeTaxEstimate {
  assertFiniteNumber(input.monthlyTaxableIncome, "월 과세급여", { minimum: 0 });
  assertFiniteNumber(input.dependents, "공제대상 가족 수", {
    minimum: 1,
    maximum: 20,
    integer: true,
  });
  assertFiniteNumber(input.eligibleChildren, "공제대상 자녀 수", {
    minimum: 0,
    maximum: 19,
    integer: true,
  });
  if (input.eligibleChildren > input.dependents - 1) {
    throw new RangeError("공제대상 자녀 수는 본인을 제외한 가족 수보다 많을 수 없습니다.");
  }
  assertFiniteNumber(input.annualInsuranceContributions, "연간 사회보험료", {
    minimum: 0,
  });

  const annualTaxablePay = input.monthlyTaxableIncome * 12;
  const employmentIncome = Math.max(
    0,
    annualTaxablePay - earnedIncomeDeduction(annualTaxablePay),
  );
  const basicDeduction =
    input.dependents * POLICY_2026.incomeTaxEstimate.basicDeductionPerDependent;
  const taxBase = Math.max(
    0,
    employmentIncome - basicDeduction - input.annualInsuranceContributions,
  );
  const calculatedTax = progressiveIncomeTax(taxBase);
  const earnedIncomeCredit = Math.min(
    calculatedTax <= 1_300_000
      ? calculatedTax * 0.55
      : 715_000 + (calculatedTax - 1_300_000) * 0.3,
    POLICY_2026.incomeTaxEstimate.earnedIncomeTaxCreditCap,
  );
  const annualIncomeTax = Math.max(
    0,
    Math.floor(
      calculatedTax -
        earnedIncomeCredit -
        childTaxCredit(input.eligibleChildren) -
        POLICY_2026.incomeTaxEstimate.standardTaxCredit,
    ),
  );
  const monthlyIncomeTax = floorToTenWon(annualIncomeTax / 12);
  const monthlyLocalIncomeTax = floorToTenWon(monthlyIncomeTax * 0.1);

  return {
    monthlyIncomeTax,
    monthlyLocalIncomeTax,
    annualIncomeTax,
    assumptions: [
      "2026년 누진세율·근로소득공제·기본공제·근로소득세액공제를 단순 적용했습니다.",
      "공제대상 자녀세액공제는 연간 세액에서 한 번만 적용했습니다.",
      "지방소득세는 추정 소득세의 10%를 10원 단위로 내림했습니다.",
    ],
    warnings: [
      "공식 근로소득 간이세액표 조회값이 아닌 예상치이며 실제 원천징수·연말정산과 다를 수 있습니다.",
      "공제대상 가족의 소득·연령 요건과 개인별 특별공제는 별도로 확인해야 합니다.",
    ],
  };
}

export function calculateSalary(input: SalaryInput): CalculationResult {
  if (input.basis !== "monthly" && input.basis !== "annual") {
    throw new RangeError("급여 기준은 monthly 또는 annual이어야 합니다.");
  }
  assertFiniteNumber(input.gross, "세전 급여", { minimum: 0, minimumExclusive: true });
  assertFiniteNumber(input.nonTaxableMonthly, "월 비과세액", { minimum: 0 });
  assertFiniteNumber(input.dependents, "공제대상 가족 수", {
    minimum: 1,
    maximum: 20,
    integer: true,
  });
  assertFiniteNumber(input.children, "공제대상 자녀 수", {
    minimum: 0,
    maximum: 19,
    integer: true,
  });
  if (input.children > input.dependents - 1) {
    throw new RangeError("공제대상 자녀 수는 본인을 제외한 가족 수보다 많을 수 없습니다.");
  }

  const monthlyGross = input.basis === "annual" ? input.gross / 12 : input.gross;
  if (input.nonTaxableMonthly > monthlyGross) {
    throw new RangeError("월 비과세액은 월 세전급여보다 클 수 없습니다.");
  }
  const monthlyTaxable = monthlyGross - input.nonTaxableMonthly;
  const pensionPolicy = pensionBaseForMonth(input.effectiveMonth);
  const rawPensionBase = Math.floor(monthlyTaxable / 1_000) * 1_000;
  const pensionBase =
    rawPensionBase > 0
      ? clamp(rawPensionBase, pensionPolicy.minimum, pensionPolicy.maximum)
      : 0;
  const pension = roundWon(
    pensionBase * POLICY_2026.insurance.nationalPension.employeeRate,
  );
  const rawHealth = roundWon(
    monthlyTaxable * POLICY_2026.insurance.health.employeeRate,
  );
  const health =
    monthlyTaxable > 0
      ? clamp(
          rawHealth,
          POLICY_2026.insurance.health.employeeMonthlyMinimum,
          POLICY_2026.insurance.health.employeeMonthlyMaximum,
        )
      : 0;
  const longTermCare = roundWon(
    (health * POLICY_2026.insurance.longTermCare.contributionRate) /
      POLICY_2026.insurance.longTermCare.healthContributionRate,
  );
  const employment = roundWon(
    monthlyTaxable * POLICY_2026.insurance.employment.employeeRate,
  );
  const annualInsuranceContributions =
    (pension + health + longTermCare + employment) * 12;
  const tax = estimateIncomeTax({
    monthlyTaxableIncome: monthlyTaxable,
    dependents: input.dependents,
    eligibleChildren: input.children,
    annualInsuranceContributions,
  });
  const monthlyDeductions =
    pension +
    health +
    longTermCare +
    employment +
    tax.monthlyIncomeTax +
    tax.monthlyLocalIncomeTax;
  const monthlyNet = roundWon(monthlyGross - monthlyDeductions);

  const warnings = [...tax.warnings];
  if (rawPensionBase > 0 && rawPensionBase < pensionPolicy.minimum) {
    warnings.push(`국민연금 기준소득월액 하한 ${pensionPolicy.minimum.toLocaleString("ko-KR")}원이 적용되었습니다.`);
  }
  if (rawPensionBase > pensionPolicy.maximum) {
    warnings.push(`국민연금 기준소득월액 상한 ${pensionPolicy.maximum.toLocaleString("ko-KR")}원이 적용되었습니다.`);
  }
  if (
    monthlyTaxable > 0 &&
    rawHealth < POLICY_2026.insurance.health.employeeMonthlyMinimum
  ) {
    warnings.push("건강보험 근로자 부담 하한 10,080원이 적용되었습니다.");
  }
  if (rawHealth > POLICY_2026.insurance.health.employeeMonthlyMaximum) {
    warnings.push("건강보험 근로자 부담 상한 4,591,740원이 적용되었습니다.");
  }

  const assumptions = [
    input.basis === "annual"
      ? "연봉은 상여 변동 없이 12개월에 동일하게 지급되는 것으로 가정했습니다."
      : "입력한 월급이 매월 동일하게 지급되는 것으로 가정했습니다.",
    "비과세액을 제외한 월 급여를 건강보험·고용보험 보수의 근사 기준으로 사용했습니다.",
    `국민연금 기준소득월액은 ${input.effectiveMonth} 기준 상·하한과 천원 미만 절사를 적용했습니다.`,
    ...tax.assumptions,
  ];

  return {
    primary: { label: "월 예상 실수령액", amount: monthlyNet, unit: "원" },
    rows: [
      { label: "월 세전급여", amount: roundWon(monthlyGross), unit: "원", kind: "income" },
      { label: "월 비과세액", amount: roundWon(input.nonTaxableMonthly), unit: "원", kind: "info" },
      { label: "월 과세급여", amount: roundWon(monthlyTaxable), unit: "원", kind: "subtotal" },
      { label: "국민연금", amount: pension, unit: "원", kind: "deduction" },
      { label: "건강보험", amount: health, unit: "원", kind: "deduction" },
      { label: "장기요양보험", amount: longTermCare, unit: "원", kind: "deduction" },
      { label: "고용보험", amount: employment, unit: "원", kind: "deduction" },
      { label: "예상 소득세", amount: tax.monthlyIncomeTax, unit: "원", kind: "deduction" },
      { label: "예상 지방소득세", amount: tax.monthlyLocalIncomeTax, unit: "원", kind: "deduction" },
      { label: "월 공제 합계", amount: monthlyDeductions, unit: "원", kind: "subtotal" },
      { label: "연 예상 실수령액", amount: monthlyNet * 12, unit: "원", kind: "total" },
    ],
    assumptions: unique(assumptions),
    warnings: unique(warnings),
    policyVersion: POLICY_VERSION,
  };
}

export function calculateHourlyPay(input: HourlyPayInput): CalculationResult {
  assertFiniteNumber(input.hourlyWage, "시급", { minimum: 0, minimumExclusive: true });
  assertFiniteNumber(input.weeklyHours, "주 소정근로시간", {
    minimum: 0,
    minimumExclusive: true,
    maximum: 168,
  });
  assertFiniteNumber(input.workdaysPerWeek, "주 근무일수", {
    minimum: 1,
    maximum: 7,
    integer: true,
  });
  assertBoolean(input.attendedAllDays, "소정근로일 개근 여부");

  const dailyHours = input.weeklyHours / input.workdaysPerWeek;
  const weeklyBasePay = roundWon(input.hourlyWage * input.weeklyHours);
  const eligibleForWeeklyHoliday = input.weeklyHours >= 15 && input.attendedAllDays;
  const weeklyHolidayHours = eligibleForWeeklyHoliday
    ? Math.min((input.weeklyHours / 40) * 8, 8)
    : 0;
  const weeklyHolidayPay = roundWon(input.hourlyWage * weeklyHolidayHours);
  const isStandardFullTime =
    Math.abs(input.weeklyHours - 40) < Number.EPSILON &&
    Math.abs(weeklyHolidayHours - 8) < Number.EPSILON;
  const monthlyPaidHours = isStandardFullTime
    ? POLICY_2026.minimumWage.monthlyHours
    : (input.weeklyHours + weeklyHolidayHours) * (365 / 7 / 12);
  const monthlyPay = roundWon(input.hourlyWage * monthlyPaidHours);

  const warnings: string[] = [];
  if (input.hourlyWage < POLICY_2026.minimumWage.hourly) {
    warnings.push(`입력 시급이 2026년 최저임금 ${POLICY_2026.minimumWage.hourly.toLocaleString("ko-KR")}원보다 낮습니다.`);
  }
  if (input.weeklyHours < 15) {
    warnings.push("주 15시간 미만으로 주휴수당을 포함하지 않았습니다.");
  } else if (!input.attendedAllDays) {
    warnings.push("소정근로일을 개근하지 않은 것으로 입력되어 주휴수당을 포함하지 않았습니다.");
  }
  if (input.weeklyHours > 40 || dailyHours > 8) {
    warnings.push("법정근로시간을 넘는 시간의 연장·야간·휴일 가산수당은 이 결과에 포함되지 않았습니다.");
  }

  return {
    primary: { label: "월 예상 세전급여", amount: monthlyPay, unit: "원" },
    rows: [
      { label: "시급", amount: input.hourlyWage, unit: "원", kind: "info" },
      { label: "1일 평균 근로시간", amount: dailyHours, unit: "시간", kind: "info" },
      { label: "주 소정근로시간", amount: input.weeklyHours, unit: "시간", kind: "info" },
      { label: "주 기본급", amount: weeklyBasePay, unit: "원", kind: "income" },
      { label: "주휴 산정시간", amount: weeklyHolidayHours, unit: "시간", kind: "info" },
      { label: "주휴수당", amount: weeklyHolidayPay, unit: "원", kind: "income" },
      { label: "월 환산 유급시간", amount: monthlyPaidHours, unit: "시간", kind: "subtotal" },
      { label: "연 예상 세전급여", amount: monthlyPay * 12, unit: "원", kind: "total" },
    ],
    assumptions: [
      isStandardFullTime
        ? "주 40시간과 주휴 8시간은 고시 기준 월 209시간으로 환산했습니다."
        : "월 환산은 주 단위 유급시간에 365÷7÷12를 곱했습니다.",
      "주휴수당은 주 15시간 이상이며 소정근로일을 개근한 경우에만 반영했습니다.",
      "연장·야간·휴일근로 가산수당과 휴게시간은 별도입니다.",
    ],
    warnings,
    policyVersion: POLICY_VERSION,
  };
}

export function calculateSeverance(input: SeveranceInput): CalculationResult {
  const hireDate = parsePlainDate(input.hireDate, "입사일");
  const retirementDate = parsePlainDate(input.retirementDate, "퇴직일");
  if (compareDates(retirementDate, hireDate) <= 0) {
    throw new RangeError("퇴직일은 입사일보다 뒤여야 합니다.");
  }
  assertFiniteNumber(input.lastThreeMonthsWages, "퇴직 전 3개월 임금총액", {
    minimum: 0,
    minimumExclusive: true,
  });
  assertFiniteNumber(input.annualBonus, "퇴직 전 1년간 상여금", { minimum: 0 });
  assertFiniteNumber(input.annualLeaveAllowance, "퇴직 전 1년간 연차수당", {
    minimum: 0,
  });
  assertFiniteNumber(input.weeklyHours, "주 평균 소정근로시간", {
    minimum: 0,
    maximum: 168,
  });
  if (input.ordinaryDailyWage !== undefined) {
    assertFiniteNumber(input.ordinaryDailyWage, "1일 통상임금", { minimum: 0 });
  }

  const serviceDays = daysBetween(hireDate, retirementDate);
  const averagePeriodStart = addCalendarMonths(retirementDate, -3);
  const referenceDays = daysBetween(averagePeriodStart, retirementDate);
  const apportionedBonus = input.annualBonus * (3 / 12);
  const apportionedLeaveAllowance = input.annualLeaveAllowance * (3 / 12);
  const referenceWages =
    input.lastThreeMonthsWages + apportionedBonus + apportionedLeaveAllowance;
  const averageDailyWage = referenceWages / referenceDays;
  const appliedDailyWage = Math.max(
    averageDailyWage,
    input.ordinaryDailyWage ?? 0,
  );
  const eligibleByService = serviceDays >= 365;
  const eligibleByHours = input.weeklyHours >= 15;
  const severance =
    eligibleByService && eligibleByHours
      ? roundWon(appliedDailyWage * 30 * (serviceDays / 365))
      : 0;

  const warnings: string[] = [];
  if (!eligibleByService) warnings.push("계속근로기간이 1년 미만으로 계산되었습니다.");
  if (!eligibleByHours) warnings.push("주 평균 소정근로시간이 15시간 미만으로 입력되었습니다.");
  if (
    input.ordinaryDailyWage !== undefined &&
    input.ordinaryDailyWage > averageDailyWage
  ) {
    warnings.push("1일 평균임금보다 큰 통상임금을 퇴직금 산정 기준으로 적용했습니다.");
  }

  const rows: CalculationRow[] = [
    { label: "계속근로일수", amount: serviceDays, unit: "일", kind: "info" },
    { label: "평균임금 산정기간", amount: referenceDays, unit: "일", kind: "info" },
    { label: "3개월 임금총액", amount: input.lastThreeMonthsWages, unit: "원", kind: "income" },
    { label: "상여금 가산액", amount: roundWon(apportionedBonus), unit: "원", kind: "income" },
    {
      label: "연차수당 가산액",
      amount: roundWon(apportionedLeaveAllowance),
      unit: "원",
      kind: "income",
    },
    { label: "1일 평균임금", amount: roundWon(averageDailyWage), unit: "원", kind: "subtotal" },
  ];
  if (input.ordinaryDailyWage !== undefined) {
    rows.push({
      label: "입력한 1일 통상임금",
      amount: input.ordinaryDailyWage,
      unit: "원",
      kind: "info",
    });
  }
  rows.push({
    label: "적용 1일 임금",
    amount: roundWon(appliedDailyWage),
    unit: "원",
    kind: "total",
  });

  return {
    primary: { label: "예상 퇴직금", amount: severance, unit: "원" },
    rows,
    assumptions: [
      "퇴직일은 근로관계가 종료되는 날(마지막 근무일의 다음 날)로 해석했습니다.",
      "평균임금 산정기간은 퇴직일 직전 3개 달력월을 월말 보정하여 계산했습니다.",
      "상여금과 연차수당은 입력한 연간 금액의 3/12을 가산했습니다.",
      "휴직 등 평균임금 산정 제외기간과 퇴직금 중간정산은 반영하지 않았습니다.",
    ],
    warnings,
    policyVersion: POLICY_VERSION,
  };
}

export function calculateUnemploymentBenefit(
  input: UnemploymentBenefitInput,
): CalculationResult {
  assertFiniteNumber(input.averageMonthlyWage, "퇴직 전 월평균임금", {
    minimum: 0,
    minimumExclusive: true,
  });
  assertFiniteNumber(input.referenceDays, "평균임금 산정일수", {
    minimum: 0,
    minimumExclusive: true,
    maximum: 366,
    integer: true,
  });
  assertFiniteNumber(input.dailyHours, "1일 소정근로시간", {
    minimum: 0,
    minimumExclusive: true,
    maximum: POLICY_2026.unemployment.maximumDailyHours,
  });
  if (input.ageGroup !== "under50" && input.ageGroup !== "over50") {
    throw new RangeError("연령 구분은 under50 또는 over50이어야 합니다.");
  }
  const validPeriods: readonly InsuredPeriodKey[] = [
    "under1",
    "1to3",
    "3to5",
    "5to10",
    "over10",
  ];
  if (!validPeriods.includes(input.insuredPeriod)) {
    throw new RangeError("유효하지 않은 고용보험 피보험기간 구분입니다.");
  }

  const averageDailyWage = (input.averageMonthlyWage * 3) / input.referenceDays;
  const rawDailyBenefit = averageDailyWage * POLICY_2026.unemployment.replacementRate;
  const dailyLower = roundWon(
    POLICY_2026.minimumWage.hourly *
      POLICY_2026.unemployment.lowerMinimumWageRatio *
      input.dailyHours,
  );
  const dailyBenefit = roundWon(
    clamp(rawDailyBenefit, dailyLower, POLICY_2026.unemployment.dailyUpper),
  );
  const benefitDays =
    POLICY_2026.unemployment.benefitDays[input.ageGroup][input.insuredPeriod];
  const totalBenefit = dailyBenefit * benefitDays;

  const warnings = [
    "비자발적 이직 사유, 피보험단위기간 180일, 재취업 활동 등 실제 수급자격은 판정하지 않습니다.",
    "반복수급자 감액·대기기간·지급 중 취업일은 반영하지 않았습니다.",
  ];
  if (rawDailyBenefit < dailyLower) {
    warnings.push("1일 구직급여 하한액이 적용되었습니다.");
  } else if (rawDailyBenefit > POLICY_2026.unemployment.dailyUpper) {
    warnings.push("1일 구직급여 상한액 68,100원이 적용되었습니다.");
  }
  if (input.referenceDays < 89 || input.referenceDays > 92) {
    warnings.push("통상적인 3개월 역일수(89~92일) 밖의 값이므로 제외기간 여부를 확인하세요.");
  }

  return {
    primary: { label: "1일 예상 구직급여", amount: dailyBenefit, unit: "원" },
    rows: [
      { label: "1일 평균임금", amount: roundWon(averageDailyWage), unit: "원", kind: "info" },
      { label: "평균임금의 60%", amount: roundWon(rawDailyBenefit), unit: "원", kind: "subtotal" },
      { label: "1일 하한액", amount: dailyLower, unit: "원", kind: "info" },
      {
        label: "1일 상한액",
        amount: POLICY_2026.unemployment.dailyUpper,
        unit: "원",
        kind: "info",
      },
      { label: "소정급여일수", amount: benefitDays, unit: "일", kind: "info" },
      { label: "총 예상 구직급여", amount: totalBenefit, unit: "원", kind: "total" },
    ],
    assumptions: [
      "퇴직 전 3개월 임금총액을 월평균임금×3으로 근사했습니다.",
      "하한액은 2026년 최저임금×80%×1일 소정근로시간으로 계산했습니다.",
      "50세 이상 구분에는 장애인이 포함되는 것으로 가정합니다.",
    ],
    warnings: unique(warnings),
    policyVersion: POLICY_VERSION,
  };
}

export function calculateAnnualLeave(input: AnnualLeaveInput): CalculationResult {
  const hireDate = parsePlainDate(input.hireDate, "입사일");
  const asOfDate = parsePlainDate(input.asOfDate, "기준일");
  if (compareDates(asOfDate, hireDate) < 0) {
    throw new RangeError("기준일은 입사일보다 빠를 수 없습니다.");
  }
  assertBoolean(input.workplaceAtLeastFive, "상시 5인 이상 사업장 여부");
  assertBoolean(input.fullMonthAttendance, "월 개근 여부");
  assertFiniteNumber(input.weeklyHours, "주 소정근로시간", {
    minimum: 0,
    maximum: 168,
  });
  assertFiniteNumber(input.attendanceRate, "출근율", { minimum: 0, maximum: 1 });

  const serviceDays = daysBetween(hireDate, asOfDate);
  const completedMonths = completedCalendarMonths(hireDate, asOfDate);
  const completedYears = completedCalendarYears(hireDate, asOfDate);
  const remainingMonths = completedMonths - completedYears * 12;
  const eligibleWorkplace = input.workplaceAtLeastFive;
  const eligibleHours = input.weeklyHours >= 15;
  let entitlement = 0;
  const warnings: string[] = [
    "이 결과는 법정 발생일수이며 사용·소멸·사용촉진을 반영한 잔여일수가 아닙니다.",
  ];

  if (!eligibleWorkplace) {
    warnings.push("상시근로자 5인 미만 사업장으로 입력되어 법정 연차일수를 0일로 표시했습니다.");
  } else if (!eligibleHours) {
    warnings.push("주 소정근로시간이 15시간 미만으로 입력되어 법정 연차일수를 0일로 표시했습니다.");
  } else if (completedYears < 1) {
    if (input.fullMonthAttendance) {
      entitlement = Math.min(completedMonths, 11);
    } else {
      warnings.push("1년 미만 기간의 월 개근일수를 알 수 없어 발생일수를 0일로 표시했습니다.");
    }
  } else if (input.attendanceRate >= 0.8) {
    entitlement = Math.min(15 + Math.floor((completedYears - 1) / 2), 25);
  } else {
    warnings.push("출근율 80% 미만은 월별 개근 횟수가 필요해 이 입력만으로 발생일수를 확정할 수 없습니다.");
  }

  return {
    primary: { label: "법정 연차 발생일수", amount: entitlement, unit: "일" },
    rows: [
      { label: "계속근로일수", amount: serviceDays, unit: "일", kind: "info" },
      { label: "완료 근속연수", amount: completedYears, unit: "년", kind: "info" },
      { label: "추가 근속개월", amount: remainingMonths, unit: "개월", kind: "info" },
      { label: "출근율", amount: input.attendanceRate * 100, unit: "%", kind: "info" },
    ],
    assumptions: [
      "근속기간은 30일·365일 나눗셈이 아니라 입사일의 달력상 월·연 기념일로 계산했습니다.",
      "1년 미만은 월 개근으로 입력된 경우 완료한 달력월마다 1일, 최대 11일로 계산했습니다.",
      "1년 이상은 출근율 80% 이상일 때 15일, 3년차부터 2년마다 1일을 더해 최대 25일로 계산했습니다.",
      "기준일 현재 근로관계가 계속되는 것으로 가정했습니다.",
    ],
    warnings: unique(warnings),
    policyVersion: POLICY_VERSION,
  };
}

export function calculateWeeklyHolidayPay(
  input: WeeklyHolidayPayInput,
): CalculationResult {
  assertFiniteNumber(input.hourlyWage, "시급", { minimum: 0, minimumExclusive: true });
  assertFiniteNumber(input.weeklyHours, "주 소정근로시간", {
    minimum: 0,
    minimumExclusive: true,
    maximum: 168,
  });
  assertBoolean(input.attendedAllDays, "소정근로일 개근 여부");

  const eligible = input.weeklyHours >= 15 && input.attendedAllDays;
  const paidHours = eligible ? Math.min((input.weeklyHours / 40) * 8, 8) : 0;
  const weeklyPay = roundWon(input.hourlyWage * paidHours);
  const monthlyPay = roundWon(weeklyPay * (365 / 7 / 12));
  const warnings: string[] = [];
  if (input.weeklyHours < 15) {
    warnings.push("주 15시간 미만으로 주휴수당이 발생하지 않는 것으로 계산했습니다.");
  } else if (!input.attendedAllDays) {
    warnings.push("소정근로일을 개근하지 않은 것으로 입력되어 주휴수당을 0원으로 계산했습니다.");
  }
  if (input.hourlyWage < POLICY_2026.minimumWage.hourly) {
    warnings.push(`입력 시급이 2026년 최저임금 ${POLICY_2026.minimumWage.hourly.toLocaleString("ko-KR")}원보다 낮습니다.`);
  }

  return {
    primary: { label: "주 1회 예상 주휴수당", amount: weeklyPay, unit: "원" },
    rows: [
      { label: "시급", amount: input.hourlyWage, unit: "원", kind: "info" },
      { label: "주 소정근로시간", amount: input.weeklyHours, unit: "시간", kind: "info" },
      { label: "주휴 산정시간", amount: paidHours, unit: "시간", kind: "subtotal" },
      { label: "월 환산 주휴수당", amount: monthlyPay, unit: "원", kind: "total" },
      { label: "연 환산 주휴수당", amount: monthlyPay * 12, unit: "원", kind: "total" },
    ],
    assumptions: [
      "주휴 산정시간은 (주 소정근로시간÷40)×8로 계산하고 최대 8시간으로 제한했습니다.",
      "월 환산은 주휴수당에 365÷7÷12를 곱했습니다.",
    ],
    warnings,
    policyVersion: POLICY_VERSION,
  };
}

export function calculateShutdownAllowance(
  input: ShutdownAllowanceInput,
): CalculationResult {
  assertFiniteNumber(input.averageDailyWage, "1일 평균임금", {
    minimum: 0,
    minimumExclusive: true,
  });
  assertFiniteNumber(input.shutdownDays, "휴업일수", {
    minimum: 0,
    minimumExclusive: true,
    maximum: 3_650,
  });
  if (input.ordinaryDailyWage !== undefined) {
    assertFiniteNumber(input.ordinaryDailyWage, "1일 통상임금", {
      minimum: 0,
      minimumExclusive: true,
    });
  }

  const seventyPercent = input.averageDailyWage * 0.7;
  const ordinaryWageApplied =
    input.ordinaryDailyWage !== undefined &&
    seventyPercent > input.ordinaryDailyWage;
  const appliedDailyAllowance = ordinaryWageApplied
    ? input.ordinaryDailyWage!
    : seventyPercent;
  const totalAllowance = roundWon(appliedDailyAllowance * input.shutdownDays);

  const rows: CalculationRow[] = [
    { label: "1일 평균임금", amount: input.averageDailyWage, unit: "원", kind: "info" },
    { label: "평균임금의 70%", amount: roundWon(seventyPercent), unit: "원", kind: "subtotal" },
  ];
  if (input.ordinaryDailyWage !== undefined) {
    rows.push({
      label: "1일 통상임금",
      amount: input.ordinaryDailyWage,
      unit: "원",
      kind: "info",
    });
  }
  rows.push(
    {
      label: "적용 1일 휴업수당",
      amount: roundWon(appliedDailyAllowance),
      unit: "원",
      kind: "subtotal",
    },
    { label: "휴업일수", amount: input.shutdownDays, unit: "일", kind: "info" },
  );

  return {
    primary: { label: "예상 휴업수당 총액", amount: totalAllowance, unit: "원" },
    rows,
    assumptions: [
      "사용자 귀책사유로 인한 전일 휴업을 가정했습니다.",
      ordinaryWageApplied
        ? "평균임금 70%가 통상임금보다 커 입력한 통상임금을 적용했습니다."
        : "평균임금의 70%를 1일 휴업수당으로 적용했습니다.",
    ],
    warnings: [
      "사용자 귀책 여부, 일부 시간 휴업, 노동위원회 승인에 따른 감액 여부는 판정하지 않습니다.",
      "세금·사회보험 공제 전 참고 금액입니다.",
    ],
    policyVersion: POLICY_VERSION,
  };
}

export { POLICY_2026, POLICY_VERSION };
